/**
 * Cryptographic Engine for BeamDrop Mirror
 * 
 * Implements:
 * - Ephemeral ECDH key agreement (P-256)
 * - HKDF-SHA256 key derivation
 * - Authenticated AES-256-GCM encryption & decryption
 * - Replay attack mitigation via monotonic counter & nonce
 * - Cryptographically secure 6-digit short code generation
 * - Rate-limited pairing authentication
 * - Zero external dependencies (uses W3C Web Cryptography API)
 */

export interface KeyPairResult {
  keyPair: CryptoKeyPair;
  publicKeyHex: string;
  fingerprint: string;
}

export interface EncryptedPacket {
  counter: number;
  nonceHex: string;
  ciphertextHex: string;
}

export class LocalCryptoEngine {
  private static failedAttempts = 0;
  private static lockUntilTimestamp = 0;

  /**
   * Generates a fresh ephemeral ECDH keypair
   */
  public static async generateEphemeralKeyPair(): Promise<KeyPairResult> {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true,
      ['deriveKey', 'deriveBits']
    );

    const rawPub = await window.crypto.subtle.exportKey('raw', keyPair.publicKey);
    const publicKeyHex = this.arrayBufferToHex(rawPub);

    // Derive readable SHA-256 fingerprint for user out-of-band verification
    const hash = await window.crypto.subtle.digest('SHA-256', rawPub);
    const hashHex = this.arrayBufferToHex(hash);
    const fingerprint = hashHex
      .slice(0, 16)
      .match(/.{2}/g)
      ?.join(':')
      .toUpperCase() || 'UNKNOWN';

    return {
      keyPair,
      publicKeyHex,
      fingerprint,
    };
  }

  /**
   * Import peer raw public key hex
   */
  public static async importPeerPublicKey(publicKeyHex: string): Promise<CryptoKey> {
    const rawBuffer = this.hexToArrayBuffer(publicKeyHex);
    return window.crypto.subtle.importKey(
      'raw',
      rawBuffer,
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true,
      []
    );
  }

  /**
   * Performs ECDH + HKDF to derive a symmetric AES-GCM-256 session key
   */
  public static async deriveSessionKey(
    localPrivateKey: CryptoKey,
    peerPublicKey: CryptoKey,
    saltString = 'BeamDrop-Local-Mirror-Session-Salt-v1'
  ): Promise<CryptoKey> {
    // 1. Derive shared secret bits via ECDH
    const sharedSecret = await window.crypto.subtle.deriveBits(
      {
        name: 'ECDH',
        public: peerPublicKey,
      },
      localPrivateKey,
      256
    );

    // 2. Import shared bits into HKDF key
    const hkdfKey = await window.crypto.subtle.importKey(
      'raw',
      sharedSecret,
      'HKDF',
      false,
      ['deriveKey']
    );

    const encoder = new TextEncoder();
    const salt = encoder.encode(saltString);
    const info = encoder.encode('AES-256-GCM Session Key');

    // 3. Derive AES-GCM 256-bit key
    return window.crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt,
        info,
      },
      hkdfKey,
      {
        name: 'AES-GCM',
        length: 256,
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt payload with AES-256-GCM, incrementing packet counter to prevent replay
   */
  public static async encryptPacket(
    sessionKey: CryptoKey,
    plaintext: string,
    counter: number
  ): Promise<EncryptedPacket> {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(plaintext);

    // 12-byte IV: 4 bytes counter + 8 bytes CSPRNG random bytes
    const iv = new Uint8Array(12);
    const randomBytes = window.crypto.getRandomValues(new Uint8Array(8));
    new DataView(iv.buffer).setUint32(0, counter, false);
    iv.set(randomBytes, 4);

    const ciphertextBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
        tagLength: 128,
      },
      sessionKey,
      encodedData
    );

    return {
      counter,
      nonceHex: this.arrayBufferToHex(iv.buffer),
      ciphertextHex: this.arrayBufferToHex(ciphertextBuffer),
    };
  }

  /**
   * Decrypts packet and validates counter monotonicity
   */
  public static async decryptPacket(
    sessionKey: CryptoKey,
    packet: EncryptedPacket,
    lastReceivedCounter: number
  ): Promise<string> {
    if (packet.counter <= lastReceivedCounter) {
      throw new Error(`Replay attack detected: Packet counter ${packet.counter} <= last valid counter ${lastReceivedCounter}`);
    }

    const iv = new Uint8Array(this.hexToArrayBuffer(packet.nonceHex));
    const ciphertext = this.hexToArrayBuffer(packet.ciphertextHex);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
        tagLength: 128,
      },
      sessionKey,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  }

  /**
   * Generates a 6-digit cryptographically secure numeric passkey
   */
  public static generateSecurePasskey(): string {
    const buffer = new Uint32Array(1);
    window.crypto.getRandomValues(buffer);
    // 6-digit number formatted between 100000 and 999999
    const val = 100000 + (buffer[0] % 900000);
    return val.toString();
  }

  /**
   * Generates a random session ID
   */
  public static generateSessionId(): string {
    const buffer = new Uint8Array(16);
    window.crypto.getRandomValues(buffer);
    return this.arrayBufferToHex(buffer.buffer);
  }

  /**
   * Check rate-limiting for failed passkey attempts
   */
  public static checkRateLimit(): { allowed: boolean; waitSeconds?: number } {
    const now = Date.now();
    if (now < this.lockUntilTimestamp) {
      const waitSeconds = Math.ceil((this.lockUntilTimestamp - now) / 1000);
      return { allowed: false, waitSeconds };
    }
    return { allowed: true };
  }

  /**
   * Record attempt outcome
   */
  public static recordPasskeyAttempt(success: boolean): void {
    if (success) {
      this.failedAttempts = 0;
      this.lockUntilTimestamp = 0;
    } else {
      this.failedAttempts += 1;
      if (this.failedAttempts >= 5) {
        // Lock for 60 seconds after 5 consecutive failures
        this.lockUntilTimestamp = Date.now() + 60000;
      } else if (this.failedAttempts >= 3) {
        // Lock for 15 seconds after 3 consecutive failures
        this.lockUntilTimestamp = Date.now() + 15000;
      }
    }
  }

  // --- Helper utility methods ---
  public static arrayBufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  public static hexToArrayBuffer(hexString: string): ArrayBuffer {
    const bytes = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < hexString.length; i += 2) {
      bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
    }
    return bytes.buffer;
  }
}
