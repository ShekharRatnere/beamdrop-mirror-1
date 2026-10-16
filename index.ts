/**
 * Types and interfaces for BeamDrop Mirror
 * Secure, Offline, Bidirectional Android Screen & PDF Mirroring
 */

export type DeviceType = 'phone' | 'tablet';

export type MirrorRole = 'sender' | 'receiver';

export type ConnectionTransport = 
  | 'usb' 
  | 'wifi_direct' 
  | 'local_wifi' 
  | 'hotspot' 
  | 'bluetooth_discovery';

export type StreamingQualityMode = 'reading' | 'motion' | 'custom';

export type ConnectionState = 
  | 'idle' 
  | 'pairing' 
  | 'authenticating' 
  | 'connected' 
  | 'streaming' 
  | 'paused' 
  | 'reconnecting' 
  | 'error';

export interface DeviceInfo {
  id: string;
  name: string;
  type: DeviceType;
  platform: 'android' | 'web';
  osVersion: string;
  publicKeyFingerprint: string;
  isTrusted: boolean;
  ipAddress?: string;
  port?: number;
}

export interface EphemeralPairingData {
  sessionId: string;
  senderName: string;
  deviceType: DeviceType;
  publicKeyHex: string;
  shortCode: string;
  timestamp: number;
  expiresAt: number;
  nonce: string;
  transportPreference: ConnectionTransport;
  ipAddress?: string;
  port?: number;
}

export interface StreamTelemetry {
  fps: number;
  bitrateMbps: number;
  latencyMs: number;
  packetLossPercent: number;
  resolution: {
    width: number;
    height: number;
  };
  cipher: string;
  activeTransport: ConnectionTransport;
  framesSent: number;
  framesDropped: number;
  encoderStatus: 'hardware_h264' | 'hardware_hevc' | 'software' | 'simulated';
  decoderStatus: 'hardware_surface' | 'software' | 'simulated';
  thermalState: 'nominal' | 'fair' | 'serious' | 'critical';
  batteryDrainEstimatePercentPerHour: number;
  uptimeSeconds: number;
}

export interface PdfDocumentState {
  title: string;
  totalPages: number;
  currentPage: number;
  zoomLevel: number;
  fitMode: 'width' | 'page' | 'original';
  aspectRatio: number;
  lastUpdatedBy: 'phone' | 'tablet';
  versionCounter: number;
}

export interface DiagnosticsLog {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'security';
  category: 'transport' | 'crypto' | 'mediacodec' | 'projection' | 'pdf' | 'session';
  message: string;
}

export interface AppSettings {
  qualityMode: StreamingQualityMode;
  targetFps: number;
  maxBitrateMbps: number;
  preferredTransport: ConnectionTransport;
  autoReconnect: boolean;
  enableAccessibilityTouch: boolean;
  readingModeTextSharpening: boolean;
  keepScreenOn: boolean;
  darkTheme: boolean;
}
