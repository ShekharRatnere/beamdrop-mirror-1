import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeftRight, 
  Maximize2, 
  Minimize2, 
  Play, 
  Pause, 
  RotateCw, 
  Monitor, 
  Smartphone, 
  Tablet, 
  ShieldAlert, 
  FileText, 
  Terminal, 
  Image as ImageIcon, 
  Wifi, 
  Usb, 
  Radio, 
  Lock,
  Layers,
  Sparkles,
  Sliders,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { ConnectionState, ConnectionTransport, DeviceType, MirrorRole, StreamTelemetry } from '../types';

interface PhoneTabletSimulatorProps {
  telemetry: StreamTelemetry;
  setTelemetry: React.Dispatch<React.SetStateAction<StreamTelemetry>>;
  connectionState: ConnectionState;
  activeTransport: ConnectionTransport;
  isStreaming: boolean;
  setIsStreaming: (val: boolean) => void;
  onOpenPairing: () => void;
  onOpenDiagnostics: () => void;
  onOpenSettings: () => void;
}

export const PhoneTabletSimulator: React.FC<PhoneTabletSimulatorProps> = ({
  telemetry,
  setTelemetry,
  connectionState,
  activeTransport,
  isStreaming,
  setIsStreaming,
  onOpenPairing,
  onOpenDiagnostics,
  onOpenSettings,
}) => {
  // Sender is Phone by default, Receiver is Tablet
  const [senderDevice, setSenderDevice] = useState<DeviceType>('phone');
  const [phoneOrientation, setPhoneOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [tabletOrientation, setTabletOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [activeMockApp, setActiveMockApp] = useState<'pdf_reader' | 'slides' | 'terminal' | 'real_screen'>('pdf_reader');
  const [isPaused, setIsPaused] = useState(false);
  const [isFlagSecureActive, setIsFlagSecureActive] = useState(false);
  const [isReceiverFullscreen, setIsReceiverFullscreen] = useState(false);
  
  // Real screen capture stream
  const [realMediaStream, setRealMediaStream] = useState<MediaStream | null>(null);
  const videoSenderRef = useRef<HTMLVideoElement>(null);
  const videoReceiverRef = useRef<HTMLVideoElement>(null);

  // Animated canvas for mock screens
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasFrameTick, setCanvasFrameTick] = useState(0);

  // Swap sender and receiver without re-pairing
  const handleSwapRoles = () => {
    setSenderDevice(prev => prev === 'phone' ? 'tablet' : 'phone');
  };

  // Start real screen capture via browser getDisplayMedia
  const handleStartRealCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'window',
          frameRate: { ideal: 60, max: 60 },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false,
      });
      setRealMediaStream(stream);
      setActiveMockApp('real_screen');
      setIsStreaming(true);

      // Handle stream end
      stream.getVideoTracks()[0].onended = () => {
        setRealMediaStream(null);
        setActiveMockApp('pdf_reader');
      };
    } catch (err) {
      console.warn('Real screen capture declined or unsupported, using high-fidelity test canvas instead.', err);
      setActiveMockApp('pdf_reader');
    }
  };

  // Bind real media stream to video elements
  useEffect(() => {
    if (realMediaStream && videoSenderRef.current && videoReceiverRef.current) {
      videoSenderRef.current.srcObject = realMediaStream;
      videoReceiverRef.current.srcObject = realMediaStream;
    }
  }, [realMediaStream, senderDevice, isStreaming]);

  // Tick generator for simulated screens
  useEffect(() => {
    if (!isStreaming || isPaused) return;
    const interval = setInterval(() => {
      setCanvasFrameTick(t => (t + 1) % 1000);
      setTelemetry(prev => ({
        ...prev,
        fps: Math.round(58 + Math.random() * 4),
        bitrateMbps: Number((telemetry.encoderStatus === 'hardware_hevc' ? 4.2 + Math.random() * 0.4 : 5.8 + Math.random() * 0.6).toFixed(1)),
        latencyMs: Math.round(activeTransport === 'usb' ? 28 + Math.random() * 6 : 42 + Math.random() * 12),
        framesSent: prev.framesSent + 1,
        uptimeSeconds: prev.uptimeSeconds + 1,
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [isStreaming, isPaused, activeTransport, setTelemetry, telemetry.encoderStatus]);

  // Render mock screen to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (activeMockApp === 'pdf_reader') {
      // PDF Reader Mock UI
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // PDF Top Header
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(0, 0, canvas.width, 36);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Autonomous Systems Architecture — Page 4 of 28', 14, 22);

      // PDF Content page
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('4.2 Direct Memory Access & Zero-Copy Pipelines', 24, 70);

      ctx.fillStyle = '#475569';
      ctx.font = '12px "Plus Jakarta Sans", sans-serif';
      const lines = [
        'Hardware acceleration in Android relies on surface-to-surface binding between',
        'the MediaProjection VirtualDisplay and the MediaCodec video encoder input.',
        'This eliminates memory copies across the user/kernel space barrier, minimizing',
        'both thermal dissipation and end-to-end presentation latency (<100ms).',
        '',
        'Table 4.1: End-to-End Latency vs Network Protocol on 5GHz Wi-Fi Direct',
      ];
      lines.forEach((line, i) => {
        ctx.fillText(line, 24, 100 + i * 20);
      });

      // Data table chart in PDF
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.strokeRect(24, 230, canvas.width - 48, 110);
      ctx.fillRect(24, 230, canvas.width - 48, 110);

      ctx.fillStyle = '#0284c7';
      ctx.fillRect(36, 280, 80, 40);
      ctx.fillRect(136, 260, 80, 60);
      ctx.fillRect(236, 245, 80, 75);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('USB-C Wired (32ms)', 30, 332);
      ctx.fillText('Wi-Fi Direct (46ms)', 130, 332);
      ctx.fillText('Local AP (68ms)', 236, 332);

      // Footnote
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'italic 10px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Confidential personal document · Synchronized via BeamDrop offline', 24, canvas.height - 24);

    } else if (activeMockApp === 'slides') {
      // Presentation Slide
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Gradient accent
      const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
      grad.addColorStop(0, '#06b6d4');
      grad.addColorStop(1, '#3b82f6');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, 4);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.fillText('STAGE 2 // CORE ENGINE SPECIFICATION', 32, 50);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Bidirectional Screen & PDF Mirroring', 32, 90);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('• Zero-server local transport (AOA USB / Wi-Fi Direct)', 32, 135);
      ctx.fillText('• Ephemeral ECDH X25519 & AES-256-GCM authenticated cipher', 32, 165);
      ctx.fillText('• Hardware-accelerated MediaProjection & MediaCodec', 32, 195);
      ctx.fillText('• Dedicated document reading sync with vector sharpness', 32, 225);

      // Status chip
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(32, 260, 240, 32);
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.fillText('VERIFIED OFFLINE TRANSMISSION', 46, 280);

    } else if (activeMockApp === 'terminal') {
      // Terminal
      ctx.fillStyle = '#05070c';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#10b981';
      ctx.font = '12px "JetBrains Mono", monospace';
      const logLines = [
        'beamdrop@android-device:~$ status --network',
        'Active Interface: wlan_p2p0 (Wi-Fi Direct P2P Group)',
        'Local Peer IP: 192.168.49.1:8988',
        'Cryptographic Handshake: ECDH-P256 complete',
        'Derived Cipher: AES-256-GCM (Zero Replay Counter: 4,812)',
        'Hardware MediaCodec: video/avc encoder initialized',
        'VirtualDisplay: 1920x1080@60fps (DPI: 320)',
        'FLAG_SECURE Monitor: Active (No protected content blocked)',
        'AOA USB Bus: Enumerated (Vendor ID 0x18D1)',
        'Frame delivery delay: 41.8ms | Buffer pool health: 99.4%',
        'Telemetry status: 0 external packets sent (100% offline)',
        'beamdrop@android-device:~$ _'
      ];
      logLines.forEach((l, idx) => {
        ctx.fillText(l, 18, 32 + idx * 22);
      });
    }
  }, [activeMockApp, canvasFrameTick, isStreaming]);

  // Screen content renderer
  const renderScreenContent = (isSenderView: boolean) => {
    if (!isStreaming) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-900/60">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <Radio className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-200">Mirroring Idle</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Start mirroring to capture and stream the screen securely to the paired device.
          </p>
          <button
            onClick={() => setIsStreaming(true)}
            className="mt-4 px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors"
          >
            Start Mirroring
          </button>
        </div>
      );
    }

    if (isFlagSecureActive) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-black text-slate-200">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-amber-400">FLAG_SECURE Protected Content</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
            The active application (e.g. banking app, password entry, or DRM media) has requested Android screen capture protection. Black frame is rendered per Android security specification.
          </p>
          <button
            onClick={() => setIsFlagSecureActive(false)}
            className="mt-4 px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md"
          >
            Dismiss Protection Overlay
          </button>
        </div>
      );
    }

    if (activeMockApp === 'real_screen' && realMediaStream) {
      return (
        <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
          <video
            ref={isSenderView ? videoSenderRef : videoReceiverRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-contain"
          />
        </div>
      );
    }

    return (
      <div className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          width={400}
          height={680}
          className="w-full h-full object-contain"
        />
        {isPaused && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-center p-4">
            <Pause className="w-8 h-8 text-amber-400 mb-2" />
            <p className="text-xs font-semibold text-amber-300">Stream Paused</p>
            <p className="text-[11px] text-slate-400">No frames are currently being transmitted</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Control Header & Role Switcher Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Active Direction Indicator */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700/60 text-cyan-400">
            {senderDevice === 'phone' ? <Smartphone className="w-5 h-5" /> : <Tablet className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">
                {senderDevice === 'phone' ? 'Phone (Sender)' : 'Tablet (Sender)'}
              </span>
              <span className="text-slate-500 font-mono text-xs">→</span>
              <span className="text-sm font-semibold text-cyan-400">
                {senderDevice === 'phone' ? 'Tablet (Receiver)' : 'Phone (Receiver)'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Role: <span className="text-slate-200 capitalize">{senderDevice} mirrors screen to {senderDevice === 'phone' ? 'Tablet' : 'Phone'}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Swap Direction */}
          <button
            onClick={handleSwapRoles}
            title="Swap Sender and Receiver role immediately without re-pairing"
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all active:scale-95 shadow-sm"
          >
            <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
            Swap Direction
          </button>

          {/* Pause / Resume */}
          {isStreaming && (
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium border rounded-xl transition-all active:scale-95 ${
                isPaused 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {isPaused ? <Play className="w-4 h-4 text-amber-400" /> : <Pause className="w-4 h-4 text-slate-400" />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
          )}

          {/* Screen Content Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded-xl">
            <button
              onClick={() => setActiveMockApp('pdf_reader')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeMockApp === 'pdf_reader' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              PDF Document
            </button>
            <button
              onClick={() => setActiveMockApp('slides')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeMockApp === 'slides' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Deck Slides
            </button>
            <button
              onClick={() => setActiveMockApp('terminal')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeMockApp === 'terminal' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Terminal
            </button>
            <button
              onClick={handleStartRealCapture}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeMockApp === 'real_screen' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-cyan-400 hover:bg-slate-900'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              Capture Real Screen
            </button>
          </div>

          {/* Simulate FLAG_SECURE */}
          <button
            onClick={() => setIsFlagSecureActive(!isFlagSecureActive)}
            title="Simulate DRM or Banking application requesting FLAG_SECURE"
            className={`p-2 rounded-xl border text-xs transition-colors ${
              isFlagSecureActive
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4" />
          </button>

        </div>
      </div>

      {/* Main Dual Device Sandbox Layout */}
      <div className={`grid gap-6 ${isReceiverFullscreen ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'} items-start`}>
        
        {/* Device 1: Sender Device Frame */}
        {!isReceiverFullscreen && (
          <div className="lg:col-span-5 flex flex-col items-center">
            
            {/* Device Header Tag */}
            <div className="w-full flex items-center justify-between px-2 mb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                {senderDevice === 'phone' ? <Smartphone className="w-4 h-4 text-cyan-400" /> : <Tablet className="w-4 h-4 text-cyan-400" />}
                <span>{senderDevice === 'phone' ? 'Phone (Sender Display)' : 'Tablet (Sender Display)'}</span>
                <span className="text-[11px] text-emerald-400 font-normal">● MediaProjection Active</span>
              </div>
              <button
                onClick={() => setPhoneOrientation(o => o === 'portrait' ? 'landscape' : 'portrait')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 p-1"
                title="Rotate device"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span className="capitalize">{phoneOrientation}</span>
              </button>
            </div>

            {/* Simulated Phone Shell */}
            <div 
              className={`relative bg-slate-900 border-4 border-slate-800 shadow-2xl rounded-[36px] overflow-hidden transition-all duration-300 ${
                phoneOrientation === 'portrait'
                  ? 'w-[320px] h-[640px]'
                  : 'w-[520px] h-[300px]'
              }`}
            >
              {/* Android Notch / Punch hole */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-slate-950 z-30 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
              </div>

              {/* Persistent Screen Sharing Notification Overlay */}
              {isStreaming && (
                <div className="absolute top-0 left-0 right-0 z-20 bg-slate-950/95 border-b border-slate-800 px-3 py-2 text-[11px] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-cyan-400">
                    <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                    <span className="font-medium">Screen Sharing Active</span>
                  </div>
                  <button
                    onClick={() => setIsStreaming(false)}
                    className="px-2 py-0.5 text-[10px] font-semibold text-rose-300 bg-rose-500/20 hover:bg-rose-500/30 rounded border border-rose-500/30"
                  >
                    Stop
                  </button>
                </div>
              )}

              {/* Screen Body */}
              <div className="w-full h-full pt-8 pb-4">
                {renderScreenContent(true)}
              </div>

              {/* Android Home Bar Indicator */}
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 rounded-full bg-slate-600/60 z-20" />
            </div>

            <p className="text-[11px] text-slate-500 mt-2">
              VirtualDisplay capturing 1080p @ 60 FPS · Zero cloud transfer
            </p>
          </div>
        )}

        {/* Device 2: Receiver Device Frame (Tablet Viewer) */}
        <div className={`${isReceiverFullscreen ? 'col-span-1' : 'lg:col-span-7'} flex flex-col items-center`}>
          
          {/* Device Header Tag */}
          <div className="w-full flex items-center justify-between px-2 mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              {senderDevice === 'phone' ? <Tablet className="w-4 h-4 text-blue-400" /> : <Smartphone className="w-4 h-4 text-blue-400" />}
              <span>{senderDevice === 'phone' ? 'Tablet (Large Screen Receiver)' : 'Phone (Receiver View)'}</span>
              <span className="text-[11px] text-slate-400">· Low Latency Hardware Surface</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setTabletOrientation(o => o === 'landscape' ? 'portrait' : 'landscape')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 p-1"
                title="Rotate receiver"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span className="capitalize">{tabletOrientation}</span>
              </button>

              <button
                onClick={() => setIsReceiverFullscreen(!isReceiverFullscreen)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 p-1"
                title="Toggle receiver full view"
              >
                {isReceiverFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span>{isReceiverFullscreen ? 'Exit Fullscreen' : 'Full Screen'}</span>
              </button>
            </div>
          </div>

          {/* Simulated Tablet Shell */}
          <div 
            className={`relative bg-slate-900 border-4 border-slate-800 shadow-2xl rounded-[32px] overflow-hidden transition-all duration-300 ${
              isReceiverFullscreen
                ? 'w-full max-w-5xl h-[720px]'
                : tabletOrientation === 'landscape'
                  ? 'w-full max-w-2xl h-[440px]'
                  : 'w-[420px] h-[600px]'
            }`}
          >
            {/* Tablet Camera dot */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-slate-950 z-30" />

            {/* Live Streaming Surface */}
            <div className="w-full h-full p-2 bg-slate-950 flex items-center justify-center">
              {renderScreenContent(false)}
            </div>

            {/* Bottom Floating Telemetry Overlay on Receiver */}
            {isStreaming && (
              <div className="absolute bottom-3 left-4 right-4 z-30 bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-2 flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-mono font-medium text-emerald-400">{telemetry.fps} FPS</span>
                  </div>
                  <span className="text-slate-600">|</span>
                  <div className="font-mono">{telemetry.bitrateMbps} Mbps</div>
                  <span className="text-slate-600">|</span>
                  <div className="font-mono text-cyan-400">{telemetry.latencyMs} ms RTT</div>
                  <span className="text-slate-600">|</span>
                  <div className="hidden sm:inline text-slate-400">{telemetry.cipher}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onOpenDiagnostics}
                    className="text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
                  >
                    View Metrics
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-500 mt-2">
            SurfaceView direct hardware decoding · Auto aspect-ratio preservation
          </p>

        </div>

      </div>

      {/* Feature highlights & security indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
        
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold mb-1">
            <Lock className="w-4 h-4" />
            Zero-Cloud E2EE
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Fresh ephemeral X25519 ECDH handshake & AES-256-GCM. No remote relays or accounts.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold mb-1">
            <Usb className="w-4 h-4" />
            USB-C & Wi-Fi Direct
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Direct wired AOA protocol with fallback to Wi-Fi Direct P2P or local subnet.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1">
            <CheckCircle2 className="w-4 h-4" />
            Bidirectional 1-Tap
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Switch between Phone-to-Tablet and Tablet-to-Phone without repeating authentication.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-1">
            <ShieldAlert className="w-4 h-4" />
            Android FLAG_SECURE
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Gracefully blanks banking & DRM password inputs to respect OS security boundaries.
          </p>
        </div>

      </div>

    </div>
  );
};
