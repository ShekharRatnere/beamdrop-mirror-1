/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TopNav } from './components/TopNav';
import { PhoneTabletSimulator } from './components/PhoneTabletSimulator';
import { PdfSyncViewer } from './components/PdfSyncViewer';
import { AndroidProjectExporter } from './components/AndroidProjectExporter';
import { DiagnosticsPanel } from './components/DiagnosticsPanel';
import { DocumentationView } from './components/DocumentationView';
import { QrPairingModal } from './components/QrPairingModal';
import { SettingsModal } from './components/SettingsModal';
import { ConnectionManagerModal } from './components/ConnectionManagerModal';
import { TrustedDevicesModal } from './components/TrustedDevicesModal';
import { 
  ConnectionState, 
  ConnectionTransport, 
  DeviceInfo, 
  DiagnosticsLog, 
  StreamTelemetry, 
  AppSettings,
  DeviceType 
} from './types';
import { 
  ShieldCheck, 
  Wifi, 
  Radio, 
  Cast, 
  BookOpen, 
  Code2, 
  Activity, 
  FileText, 
  Sliders,
  CheckCircle2,
  X
} from 'lucide-react';

const INITIAL_TELEMETRY: StreamTelemetry = {
  fps: 60,
  bitrateMbps: 5.8,
  latencyMs: 38,
  packetLossPercent: 0.0,
  resolution: { width: 1920, height: 1080 },
  cipher: 'AES-256-GCM',
  activeTransport: 'wifi_direct',
  framesSent: 1240,
  framesDropped: 0,
  encoderStatus: 'hardware_h264',
  decoderStatus: 'hardware_surface',
  thermalState: 'nominal',
  batteryDrainEstimatePercentPerHour: 4.8,
  uptimeSeconds: 142,
};

const DEFAULT_SETTINGS: AppSettings = {
  qualityMode: 'motion',
  targetFps: 60,
  maxBitrateMbps: 10,
  preferredTransport: 'wifi_direct',
  autoReconnect: true,
  enableAccessibilityTouch: false,
  readingModeTextSharpening: true,
  keepScreenOn: true,
  darkTheme: true,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'sandbox' | 'pdf' | 'android_project' | 'diagnostics' | 'docs'>('sandbox');
  const [connectionState, setConnectionState] = useState<ConnectionState>('connected');
  const [activeTransport, setActiveTransport] = useState<ConnectionTransport>('wifi_direct');
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [telemetry, setTelemetry] = useState<StreamTelemetry>(INITIAL_TELEMETRY);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Modals
  const [isPairingOpen, setIsPairingOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTransportOpen, setIsTransportOpen] = useState(false);
  const [isTrustedDevicesOpen, setIsTrustedDevicesOpen] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Trusted Devices List (saved in localStorage)
  const [trustedDevices, setTrustedDevices] = useState<DeviceInfo[]>(() => {
    try {
      const saved = localStorage.getItem('beamdrop_trusted_devices');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse trusted devices from storage:', e);
    }
    return [
      {
        id: 'dev_1',
        name: 'Galaxy Tab S9+ (Personal Tablet)',
        type: 'tablet',
        platform: 'android',
        osVersion: 'Android 14 (OneUI 6.1)',
        publicKeyFingerprint: '4A:72:C9:81:B2:FF:10:9A',
        isTrusted: true,
        ipAddress: '192.168.49.2',
        port: 8988,
      },
      {
        id: 'dev_2',
        name: 'Pixel 9 Pro (Phone)',
        type: 'phone',
        platform: 'android',
        osVersion: 'Android 15 (VanillaIceCream)',
        publicKeyFingerprint: '98:21:E4:FA:7D:3B:55:0C',
        isTrusted: true,
        ipAddress: '192.168.49.1',
        port: 8988,
      }
    ];
  });

  // Diagnostic Logs
  const [logs, setLogs] = useState<DiagnosticsLog[]>([
    {
      id: 'log_1',
      timestamp: Date.now() - 140000,
      level: 'info',
      category: 'transport',
      message: 'Wi-Fi Direct P2P Group Owner negotiated (Autonomous GO on 192.168.49.1:8988)'
    },
    {
      id: 'log_2',
      timestamp: Date.now() - 138000,
      level: 'security',
      category: 'crypto',
      message: 'Ephemeral ECDH P-256 key exchange completed. Derived AES-256-GCM session key.'
    },
    {
      id: 'log_3',
      timestamp: Date.now() - 135000,
      level: 'info',
      category: 'mediacodec',
      message: 'Hardware MediaCodec surface encoder initialized (1920x1080@60fps, 5.8 Mbps CBR)'
    },
    {
      id: 'log_4',
      timestamp: Date.now() - 60000,
      level: 'info',
      category: 'session',
      message: 'Zero cloud relay verified: Direct offline peer-to-peer connection stable.'
    }
  ]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handlePairingSuccess = (deviceInfo: { name: string; type: DeviceType; fingerprint: string }) => {
    const newDevice: DeviceInfo = {
      id: `dev_${Date.now()}`,
      name: deviceInfo.name,
      type: deviceInfo.type,
      platform: 'android',
      osVersion: 'Android 14',
      publicKeyFingerprint: deviceInfo.fingerprint,
      isTrusted: true,
      ipAddress: '192.168.49.2',
      port: 8988,
    };

    const updated = [newDevice, ...trustedDevices.filter(d => d.publicKeyFingerprint !== deviceInfo.fingerprint)];
    setTrustedDevices(updated);
    try {
      localStorage.setItem('beamdrop_trusted_devices', JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage save error:', e);
    }

    setConnectionState('connected');
    setIsStreaming(true);
    showToast(`Secure session established with ${deviceInfo.name}`);

    // Add log
    setLogs(prev => [
      {
        id: `log_${Date.now()}`,
        timestamp: Date.now(),
        level: 'security',
        category: 'crypto',
        message: `Fresh ephemeral handshake authenticated with ${deviceInfo.name} (${deviceInfo.fingerprint})`
      },
      ...prev
    ]);
  };

  const handleRevokeDevice = (id: string) => {
    const updated = trustedDevices.filter(d => d.id !== id);
    setTrustedDevices(updated);
    try {
      localStorage.setItem('beamdrop_trusted_devices', JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage error:', e);
    }
    showToast('Device authorization revoked.');
  };

  const handleSimulateError = (scenario: string) => {
    setLogs(prev => [
      {
        id: `err_${Date.now()}`,
        timestamp: Date.now(),
        level: 'warn',
        category: 'transport',
        message: `Simulated event: ${scenario}`
      },
      ...prev
    ]);
    showToast(`Diagnosed condition: ${scenario}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Top Bar Navigation */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        connectionState={connectionState}
        activeTransport={activeTransport}
        isStreaming={isStreaming}
        onOpenPairing={() => setIsPairingOpen(true)}
        onStopStreaming={() => {
          setIsStreaming(false);
          showToast('Screen mirroring stopped immediately.');
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Persistent Status Subheader */}
      <div className="bg-slate-900/40 border-b border-slate-900 px-4 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              100% Offline Direct Channel
            </span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <button
              onClick={() => setIsTransportOpen(true)}
              className="hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>Transport:</span>
              <strong className="text-cyan-400 font-mono underline underline-offset-2">
                {activeTransport === 'usb' ? 'USB-C Wired' : 'Wi-Fi Direct (P2P)'}
              </strong>
            </button>
            <span className="hidden sm:inline text-slate-600">|</span>
            <button
              onClick={() => setIsTrustedDevicesOpen(true)}
              className="hover:text-white transition-colors"
            >
              Trusted Devices ({trustedDevices.length})
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-slate-400">
              Profile: <span className="text-white capitalize">{settings.qualityMode} Mode</span>
            </span>
            <span className="text-cyan-400">{telemetry.fps} FPS</span>
            <span className="text-slate-400">{telemetry.latencyMs}ms RTT</span>
          </div>
        </div>
      </div>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {activeTab === 'sandbox' && (
          <PhoneTabletSimulator
            telemetry={telemetry}
            setTelemetry={setTelemetry}
            connectionState={connectionState}
            activeTransport={activeTransport}
            isStreaming={isStreaming}
            setIsStreaming={setIsStreaming}
            onOpenPairing={() => setIsPairingOpen(true)}
            onOpenDiagnostics={() => setActiveTab('diagnostics')}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {activeTab === 'pdf' && (
          <PdfSyncViewer onNotify={showToast} />
        )}

        {activeTab === 'android_project' && (
          <AndroidProjectExporter />
        )}

        {activeTab === 'diagnostics' && (
          <DiagnosticsPanel
            telemetry={telemetry}
            logs={logs}
            onClearLogs={() => setLogs([])}
            onSimulateError={handleSimulateError}
          />
        )}

        {activeTab === 'docs' && (
          <DocumentationView />
        )}

      </main>

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 border border-cyan-500/40 rounded-xl shadow-xl text-xs text-white animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Modal Dialogs */}
      <QrPairingModal
        isOpen={isPairingOpen}
        onClose={() => setIsPairingOpen(false)}
        onPairingSuccess={handlePairingSuccess}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) => setSettings(prev => ({ ...prev, ...newSettings }))}
      />

      <ConnectionManagerModal
        isOpen={isTransportOpen}
        onClose={() => setIsTransportOpen(false)}
        activeTransport={activeTransport}
        onSelectTransport={(t) => {
          setActiveTransport(t);
          setTelemetry(prev => ({ ...prev, activeTransport: t }));
          showToast(`Active transport switched to ${t}`);
        }}
      />

      <TrustedDevicesModal
        isOpen={isTrustedDevicesOpen}
        onClose={() => setIsTrustedDevicesOpen(false)}
        trustedDevices={trustedDevices}
        onRevokeDevice={handleRevokeDevice}
        onConnectTrusted={(dev) => {
          setIsTrustedDevicesOpen(false);
          setIsStreaming(true);
          showToast(`Re-authenticated session with ${dev.name}`);
        }}
      />

      {/* Minimal Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>BeamDrop Mirror · Secure Offline Personal Mirroring</span>
        <span>Android 10+ (API 29+) · Jetpack Compose · Zero Cloud</span>
      </footer>

    </div>
  );
}
