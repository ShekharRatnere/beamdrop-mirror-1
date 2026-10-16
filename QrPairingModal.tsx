import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  KeyRound, 
  ShieldCheck, 
  Timer, 
  RefreshCw, 
  Check, 
  X, 
  AlertTriangle,
  Smartphone,
  Tablet,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { LocalCryptoEngine, KeyPairResult } from '../crypto/cryptoEngine';
import { EphemeralPairingData, DeviceType } from '../types';

interface QrPairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPairingSuccess: (deviceInfo: { name: string; type: DeviceType; fingerprint: string }) => void;
}

export const QrPairingModal: React.FC<QrPairingModalProps> = ({
  isOpen,
  onClose,
  onPairingSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'display_qr' | 'enter_passkey'>('display_qr');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [pairingData, setPairingData] = useState<EphemeralPairingData | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(120);
  const [enteredPasskey, setEnteredPasskey] = useState<string>('');
  const [rateLimitWarning, setRateLimitWarning] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationFingerprint, setVerificationFingerprint] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [trustDevice, setTrustDevice] = useState(true);

  // Generate fresh ephemeral session credentials
  const generateNewSession = async () => {
    try {
      const keyResult = await LocalCryptoEngine.generateEphemeralKeyPair();
      const sessionId = LocalCryptoEngine.generateSessionId();
      const passkey = LocalCryptoEngine.generateSecurePasskey();
      const now = Date.now();
      const expiresAt = now + 120_000; // 2 minutes

      const data: EphemeralPairingData = {
        sessionId,
        senderName: 'Pixel 9 Pro (Sender)',
        deviceType: 'phone',
        publicKeyHex: keyResult.publicKeyHex,
        shortCode: passkey,
        timestamp: now,
        expiresAt,
        nonce: LocalCryptoEngine.generateSessionId().slice(0, 16),
        transportPreference: 'wifi_direct',
        ipAddress: '192.168.49.1',
        port: 8988,
      };

      setPairingData(data);
      setTimeLeft(120);
      setVerificationFingerprint(keyResult.fingerprint);

      // Generate QR Code with minimum necessary metadata (NO private keys, NO permanent tokens)
      const qrPayload = JSON.stringify({
        s: data.sessionId,
        k: data.shortCode,
        p: data.publicKeyHex.slice(0, 32),
        f: keyResult.fingerprint,
        t: data.transportPreference,
      });

      const url = await QRCode.toDataURL(qrPayload, {
        width: 280,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error('Failed to generate pairing QR:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      generateNewSession();
    }
  }, [isOpen]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, timeLeft]);

  // Handle passkey validation
  const handleVerifyPasskey = () => {
    const rateCheck = LocalCryptoEngine.checkRateLimit();
    if (!rateCheck.allowed) {
      setRateLimitWarning(`Too many failed attempts. Rate limited for ${rateCheck.waitSeconds}s.`);
      return;
    }

    if (!pairingData) return;

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      if (enteredPasskey === pairingData.shortCode) {
        LocalCryptoEngine.recordPasskeyAttempt(true);
        // Successful authentication
        onPairingSuccess({
          name: 'Galaxy Tab S9+ (Receiver)',
          type: 'tablet',
          fingerprint: verificationFingerprint || '4A:72:C9:81:B2:FF:10:9A',
        });
        onClose();
      } else {
        LocalCryptoEngine.recordPasskeyAttempt(false);
        setRateLimitWarning('Invalid passkey. Verify digits and expiration time.');
      }
    }, 400);
  };

  const handleCopyCode = () => {
    if (pairingData?.shortCode) {
      navigator.clipboard.writeText(pairingData.shortCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Secure Device Pairing</h3>
              <p className="text-[11px] text-slate-400">Ephemeral ECDH & AES-256-GCM Handshake</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex p-1 bg-slate-950/60 border-b border-slate-800/80">
          <button
            onClick={() => setActiveTab('display_qr')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'display_qr' ? 'bg-slate-800 text-cyan-400 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            Show QR & Passkey
          </button>
          <button
            onClick={() => setActiveTab('enter_passkey')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'enter_passkey' ? 'bg-slate-800 text-cyan-400 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Enter Passkey
          </button>
        </div>

        {/* Tab 1: Display QR & Ephemeral Passkey */}
        {activeTab === 'display_qr' && (
          <div className="p-6 flex flex-col items-center text-center">
            
            {/* Expiration warning or QR image */}
            {timeLeft > 0 ? (
              <div className="relative p-2.5 bg-white rounded-2xl shadow-md border border-slate-200">
                {qrDataUrl && (
                  <img
                    src={qrDataUrl}
                    alt="Pairing QR Code"
                    className="w-52 h-52 object-contain"
                  />
                )}
                <div className="absolute top-2 right-2 bg-slate-900/90 text-cyan-400 text-[10px] font-mono px-1.5 py-0.5 rounded">
                  {timeLeft}s
                </div>
              </div>
            ) : (
              <div className="w-52 h-52 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-4">
                <AlertTriangle className="w-8 h-8 text-amber-400 mb-2" />
                <p className="text-xs font-semibold text-slate-300">Credentials Expired</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Ephemeral credentials expire after 120s to prevent replay attacks.
                </p>
                <button
                  onClick={generateNewSession}
                  className="mt-3 px-3 py-1.5 text-xs font-medium text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  Regenerate
                </button>
              </div>
            )}

            {/* 6-Digit Passkey Alternative */}
            {pairingData && timeLeft > 0 && (
              <div className="mt-4 w-full">
                <p className="text-xs text-slate-400 mb-1">
                  Or enter this 6-digit ephemeral passkey:
                </p>
                <div className="flex items-center justify-center gap-2">
                  <div className="font-mono text-2xl font-bold tracking-widest text-cyan-400 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
                    {pairingData.shortCode}
                  </div>
                  <button
                    onClick={handleCopyCode}
                    title="Copy passkey"
                    className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Cryptographic Fingerprint */}
            {verificationFingerprint && (
              <div className="mt-4 p-2 bg-slate-950/60 border border-slate-800/80 rounded-xl w-full text-left">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  SHA-256 Fingerprint (Verify on peer):
                </span>
                <span className="font-mono text-xs text-slate-300 font-medium">
                  {verificationFingerprint}
                </span>
              </div>
            )}

            {/* Reconnect as simulated paired device */}
            <div className="mt-5 w-full flex items-center justify-between border-t border-slate-800 pt-4">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={trustDevice}
                  onChange={(e) => setTrustDevice(e.target.checked)}
                  className="rounded border-slate-700 accent-cyan-400"
                />
                Save as Trusted Device
              </label>

              <button
                onClick={() => {
                  onPairingSuccess({
                    name: 'Companion Tablet',
                    type: 'tablet',
                    fingerprint: verificationFingerprint || '4A:72:C9:81:B2:FF:10:9A',
                  });
                  onClose();
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors"
              >
                Simulate Successful Peer Scan
              </button>
            </div>

          </div>
        )}

        {/* Tab 2: Enter Passkey */}
        {activeTab === 'enter_passkey' && (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Enter 6-Digit Passkey displayed on initiating device
              </label>
              <input
                type="text"
                maxLength={6}
                value={enteredPasskey}
                onChange={(e) => {
                  setEnteredPasskey(e.target.value.replace(/[^0-9]/g, ''));
                  setRateLimitWarning(null);
                }}
                placeholder="e.g. 849201"
                className="w-full text-center font-mono text-2xl tracking-widest px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-cyan-400 placeholder-slate-600 focus:outline-hidden focus:border-cyan-500"
              />
            </div>

            {rateLimitWarning && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{rateLimitWarning}</span>
              </div>
            )}

            <p className="text-xs text-slate-400 leading-relaxed">
              Upon entering the passkey, an authenticated Diffie-Hellman handshake will negotiate fresh 256-bit encryption keys. No permanent tokens are stored.
            </p>

            <button
              onClick={handleVerifyPasskey}
              disabled={enteredPasskey.length !== 6 || isVerifying}
              className="w-full py-2.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 disabled:hover:bg-cyan-400 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Verifying Cryptographic Handshake...
                </>
              ) : (
                'Authenticate & Connect'
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
