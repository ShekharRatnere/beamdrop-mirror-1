import React, { useState } from 'react';
import { 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2, 
  FileUp, 
  Smartphone, 
  Tablet, 
  RotateCcw, 
  CheckCircle2, 
  Sparkles,
  Layers,
  ArrowLeftRight,
  Share2
} from 'lucide-react';
import { PdfDocumentState } from '../types';

interface PdfSyncViewerProps {
  onNotify?: (msg: string) => void;
}

const SAMPLE_DOCUMENTS = [
  {
    id: 'doc_1',
    title: 'Hardware-Accelerated Video Pipelines on Android (H.264 & HEVC)',
    author: 'BeamDrop Engineering Research',
    totalPages: 16,
    pages: [
      {
        pageNumber: 1,
        title: 'Executive Summary & Pipeline Latency',
        content: `1. Abstract and Core Architecture
Android screen streaming architectures historically suffered from excessive latency (>250ms) due to software frame grabbing and multiple CPU memory copies. 

By leveraging the android.media.projection API coupled directly with an input Surface created from android.media.MediaCodec, frame buffers flow directly within GPU/VPU memory spaces without transitioning through Dalvik/ART heap buffers.

Key Performance Indicators (Measured):
• MediaProjection -> MediaCodec Surface: <1.2ms
• Hardware H.264 Baseline Profile Encode: 8.4ms (1080p@60fps)
• Wi-Fi Direct Encrypted Framing (AES-256-GCM): 2.1ms
• Wireless Transmission (5GHz 802.11ac Direct Link): 14.8ms
• Hardware MediaCodec Decode to SurfaceView: 9.3ms
• Total End-to-End Presentation Latency: ~35.8ms`
      },
      {
        pageNumber: 2,
        title: 'Direct USB-C Wired Communication Analysis',
        content: `2. USB Open Accessory (AOA) vs USB Host (OTG)
Establishing a direct USB-C data pipe between two unrooted Android devices requires strict adherence to USB role protocols. 

When two modern USB-C Android devices are connected via a C-to-C cable:
1. Type-C CC (Configuration Channel) pins negotiate Dual-Role-Data (DRD) and Dual-Role-Power (DRP).
2. One device must assume the USB Host role, while the companion assumes the USB Device (Accessory) role.
3. The host initiates the Android Open Accessory (AOA) protocol by checking accessory version (control request 51) and sending manufacturer strings (BeamDrop / MirrorPeer).
4. Once recognized, the accessory device transitions USB product ID to 0x2D00/0x2D01, presenting an open ParcelFileDescriptor in Android user space.

Fallback Hierarchy:
If AOA handshake fails (e.g. cable is charge-only or devices both refuse Host negotiation), the app automatically shifts to Wi-Fi Direct P2P without terminating the user session.`
      },
      {
        pageNumber: 3,
        title: 'Cryptographic Guarantees & Replay Immunity',
        content: `3. Ephemeral ECDH Key Agreement & Monotonic Nonces
Security in BeamDrop Mirror is grounded in zero-trust local networking. Even over an open Wi-Fi network, raw video or PDF content must never be decipherable by third parties.

Authentication Pipeline:
1. Ephemeral Keypair: Generated using NIST P-256 / Curve25519 for every pairing session. Private keys exist exclusively in RAM and are scrubbed upon session termination.
2. QR Code Out-of-Band Channel: Contains session ID, local ephemeral public key, and a 6-digit random passkey.
3. Key Derivation: Shared secret derived via ECDH, hashed with HKDF-SHA256 and domain-specific salt.
4. Monotonic Nonce Framing: Every packet contains an ascending 64-bit counter embedded in the 12-byte AES-GCM IV. Any packet arriving with counter <= lastCounter is discarded as a replay attack.`
      },
      {
        pageNumber: 4,
        title: 'Vector PDF Synchronization Protocol',
        content: `4. Synchronized PDF Engine Architecture
Full-screen video mirroring of static text incurs unnecessary battery and wireless bandwidth consumption. The dedicated PDF mode solves this:

1. Direct File Transfer: The selected PDF file is streamed in encrypted chunks (64KB) directly to the peer's private app cache (/data/user/0/com.beamdrop.mirror/cache/temp_doc.pdf).
2. Native Rendering: Both devices open the file locally using android.graphics.pdf.PdfRenderer, rendering crisp vector glyphs at native screen DPI.
3. State Synchronization: Navigation events (page turns, zoom level, fit mode) are synchronized via lightweight JSON delta packets (<100 bytes).
4. Conflict Resolution: Each change increments a 64-bit monotonic version counter. The higher counter deterministically takes precedence, eliminating desynchronization loops.`
      }
    ]
  },
  {
    id: 'doc_2',
    title: 'Android Operating System Security Boundaries & Permissions',
    author: 'Platform Security Architecture',
    totalPages: 8,
    pages: [
      {
        pageNumber: 1,
        title: 'MediaProjection Permissions & FLAG_SECURE',
        content: `1. Privacy Boundaries in Modern Android
Android enforces strict operating system boundaries that no legitimate, unrooted application can or should bypass:

• Foreground Service Requirement: Since Android 10, MediaProjection requires a foreground service with type 'mediaProjection' and a persistent notification with user-visible stop action.
• WindowManager.LayoutParams.FLAG_SECURE: Applications handling financial transactions, passwords, or DRM video mark their windows with FLAG_SECURE. When captured, the VirtualDisplay outputs a black frame. BeamDrop handles this gracefully with informative diagnostics.
• Accessibility Service Constraints: Remote touch injection across other apps requires Accessibility permissions with clear, user-facing security disclosures.`
      }
    ]
  }
];

export const PdfSyncViewer: React.FC<PdfSyncViewerProps> = ({ onNotify }) => {
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);
  const activeDoc = SAMPLE_DOCUMENTS[selectedDocIndex];

  // PDF Sync State (shared between phone and tablet)
  const [pdfState, setPdfState] = useState<PdfDocumentState>({
    title: activeDoc.title,
    totalPages: activeDoc.totalPages,
    currentPage: 1,
    zoomLevel: 100,
    fitMode: 'width',
    aspectRatio: 1.414,
    lastUpdatedBy: 'phone',
    versionCounter: 1,
  });

  const [dualViewMode, setDualViewMode] = useState<'split' | 'phone_only' | 'tablet_only'>('split');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [textSharpening, setTextSharpening] = useState(true);

  // Handle local or remote page turn
  const handlePageChange = (newPage: number, device: 'phone' | 'tablet') => {
    const clamped = Math.max(1, Math.min(newPage, pdfState.totalPages));
    setPdfState(prev => ({
      ...prev,
      currentPage: clamped,
      lastUpdatedBy: device,
      versionCounter: prev.versionCounter + 1,
    }));
  };

  const handleZoom = (delta: number) => {
    setPdfState(prev => ({
      ...prev,
      zoomLevel: Math.max(50, Math.min(prev.zoomLevel + delta, 250)),
      fitMode: 'original',
      versionCounter: prev.versionCounter + 1,
    }));
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPdfState({
        title: file.name,
        totalPages: 12,
        currentPage: 1,
        zoomLevel: 100,
        fitMode: 'width',
        aspectRatio: 1.414,
        lastUpdatedBy: 'phone',
        versionCounter: 1,
      });
      if (onNotify) onNotify(`Directly transferred "${file.name}" to companion tablet cache.`);
    }
  };

  // Get current page content from sample
  const currentPageData = activeDoc.pages.find(p => p.pageNumber === pdfState.currentPage) || {
    pageNumber: pdfState.currentPage,
    title: `Section ${pdfState.currentPage}. Detailed Architectural Appendices`,
    content: `Detailed specifications for document page ${pdfState.currentPage}. 
High-clarity vector rendering active. Reading position synchronized over local peer-to-peer transport with monotonic conflict resolution.

Resolution: Native Device PPI (Retina sharpness)
Sync Latency: <8ms delta broadcast`
  };

  return (
    <div className="space-y-6">
      
      {/* Top Controls Toolbar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Document Selection & Info */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700/60 text-cyan-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white truncate max-w-sm">
                {pdfState.title}
              </span>
              <span className="text-[11px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20 font-mono">
                v{pdfState.versionCounter}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Synced: <span className="text-slate-200">Page {pdfState.currentPage} of {pdfState.totalPages}</span>
              <span className="mx-1.5">·</span>
              Last navigated by <span className="text-cyan-300 capitalize">{pdfState.lastUpdatedBy}</span>
            </p>
          </div>
        </div>

        {/* View Mode & Upload */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Switch Document */}
          <select
            value={selectedDocIndex}
            onChange={(e) => {
              const idx = Number(e.target.value);
              setSelectedDocIndex(idx);
              setPdfState(prev => ({
                ...prev,
                title: SAMPLE_DOCUMENTS[idx].title,
                totalPages: SAMPLE_DOCUMENTS[idx].totalPages,
                currentPage: 1,
                versionCounter: prev.versionCounter + 1,
              }));
            }}
            className="text-xs bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-3 py-2 focus:outline-hidden"
          >
            {SAMPLE_DOCUMENTS.map((doc, idx) => (
              <option key={doc.id} value={idx}>{doc.title.slice(0, 32)}...</option>
            ))}
          </select>

          {/* Upload File */}
          <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl cursor-pointer transition-colors">
            <FileUp className="w-4 h-4 text-cyan-400" />
            <span>Open PDF</span>
            <input type="file" accept=".pdf,.txt,.doc" onChange={handleCustomUpload} className="hidden" />
          </label>

          {/* Dual View Selector */}
          <div className="flex items-center bg-slate-950 p-1 border border-slate-800 rounded-xl">
            <button
              onClick={() => setDualViewMode('split')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                dualViewMode === 'split' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Dual Synced View
            </button>
            <button
              onClick={() => setDualViewMode('tablet_only')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                dualViewMode === 'tablet_only' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tablet Full View
            </button>
          </div>

          {/* Text Sharpening Toggle */}
          <button
            onClick={() => setTextSharpening(!textSharpening)}
            title="Toggle high-clarity subpixel text rendering"
            className={`px-2.5 py-1.5 text-xs font-medium rounded-xl border transition-colors flex items-center gap-1.5 ${
              textSharpening 
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Reading Clarity</span>
          </button>

        </div>

      </div>

      {/* Main Document Sync Canvas */}
      <div className={`grid gap-6 ${dualViewMode === 'split' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
        
        {/* Device 1: Phone Reader View (Controller & Synced Reader) */}
        {(dualViewMode === 'split' || dualViewMode === 'phone_only') && (
          <div className={`${dualViewMode === 'split' ? 'lg:col-span-5' : 'max-w-xl mx-auto'} flex flex-col items-center`}>
            
            <div className="w-full flex items-center justify-between px-2 mb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span>Phone Reader (Sender)</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Page {pdfState.currentPage}</span>
            </div>

            {/* Phone Screen Mock */}
            <div className="w-[320px] h-[600px] bg-white text-slate-900 border-4 border-slate-800 rounded-[32px] shadow-2xl flex flex-col overflow-hidden relative">
              
              {/* Phone Status bar */}
              <div className="h-6 bg-slate-100 border-b border-slate-200 px-4 flex items-center justify-between text-[10px] text-slate-600 font-medium">
                <span>09:42</span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Synced
                </span>
              </div>

              {/* Document Page Header */}
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <p className="text-[10px] font-semibold tracking-wider text-cyan-700 uppercase">
                  {pdfState.title}
                </p>
                <h3 className="text-sm font-bold text-slate-900 mt-1">
                  {currentPageData.title}
                </h3>
              </div>

              {/* Scrollable Page Body */}
              <div className={`flex-1 p-4 overflow-y-auto ${textSharpening ? 'antialiased tracking-tight font-serif' : 'font-sans'}`}>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {currentPageData.content}
                </p>
              </div>

              {/* Phone Bottom Navigation Bar */}
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <button
                  onClick={() => handlePageChange(pdfState.currentPage - 1, 'phone')}
                  disabled={pdfState.currentPage <= 1}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 disabled:opacity-40 hover:bg-slate-100"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="text-xs font-semibold text-slate-800 font-mono">
                  {pdfState.currentPage} / {pdfState.totalPages}
                </span>

                <button
                  onClick={() => handlePageChange(pdfState.currentPage + 1, 'phone')}
                  disabled={pdfState.currentPage >= pdfState.totalPages}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 disabled:opacity-40 hover:bg-slate-100"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>

            <p className="text-[11px] text-slate-500 mt-2">
              Phone touch events broadcast delta sync packets (&lt;100 bytes)
            </p>

          </div>
        )}

        {/* Device 2: Tablet Large-Screen Synced Reader */}
        {(dualViewMode === 'split' || dualViewMode === 'tablet_only') && (
          <div className={`${dualViewMode === 'split' ? 'lg:col-span-7' : 'w-full max-w-4xl mx-auto'} flex flex-col items-center`}>
            
            <div className="w-full flex items-center justify-between px-2 mb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Tablet className="w-4 h-4 text-blue-400" />
                <span>Tablet Large-Screen Reader (Receiver)</span>
                <span className="text-[11px] text-emerald-400">· Vector Sharpened</span>
              </div>

              {/* Tablet Zoom and Fit Controls */}
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1">
                <button
                  onClick={() => handleZoom(-10)}
                  className="p-1 text-slate-400 hover:text-white"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] text-slate-300 font-mono px-1">
                  {pdfState.zoomLevel}%
                </span>
                <button
                  onClick={() => handleZoom(10)}
                  className="p-1 text-slate-400 hover:text-white"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Tablet Shell */}
            <div className="w-full h-[600px] bg-slate-950 border-4 border-slate-800 rounded-[28px] shadow-2xl flex flex-col overflow-hidden relative">
              
              {/* Tablet Document Container */}
              <div className="flex-1 overflow-auto p-6 flex justify-center bg-slate-900/60">
                
                {/* Simulated Paper Sheet */}
                <div 
                  style={{ transform: `scale(${pdfState.zoomLevel / 100})`, transformOrigin: 'top center' }}
                  className="w-full max-w-2xl bg-white text-slate-900 shadow-xl rounded-lg p-8 min-h-[500px] transition-transform duration-150 flex flex-col justify-between"
                >
                  <div>
                    <div className="border-b border-slate-200 pb-3 mb-6 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {pdfState.title}
                      </span>
                      <span className="text-xs font-mono font-medium text-slate-400">
                        Page {pdfState.currentPage} of {pdfState.totalPages}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-slate-900 mb-4">
                      {currentPageData.title}
                    </h2>

                    <div className={`text-sm text-slate-800 leading-relaxed whitespace-pre-line ${textSharpening ? 'font-serif' : 'font-sans'}`}>
                      {currentPageData.content}
                    </div>
                  </div>

                  <div className="pt-6 mt-8 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span>Synchronized locally via BeamDrop Offline Transport</span>
                    <span>Version v{pdfState.versionCounter}</span>
                  </div>
                </div>

              </div>

              {/* Tablet Bottom Interactive Controller Bar */}
              <div className="bg-slate-900 border-t border-slate-800 p-3 px-6 flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pdfState.currentPage - 1, 'tablet')}
                    disabled={pdfState.currentPage <= 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 border border-slate-700"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Previous Page
                  </button>

                  <button
                    onClick={() => handlePageChange(pdfState.currentPage + 1, 'tablet')}
                    disabled={pdfState.currentPage >= pdfState.totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 border border-slate-700"
                  >
                    Next Page
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Page Jump Slider */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-mono">Jump:</span>
                  <input
                    type="range"
                    min={1}
                    max={pdfState.totalPages}
                    value={pdfState.currentPage}
                    onChange={(e) => handlePageChange(Number(e.target.value), 'tablet')}
                    className="w-32 accent-cyan-400"
                  />
                  <span className="text-xs font-mono text-cyan-400 font-bold min-w-8">
                    {pdfState.currentPage}/{pdfState.totalPages}
                  </span>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Bidirectional Sync Active</span>
                </div>
              </div>

            </div>

            <p className="text-[11px] text-slate-500 mt-2">
              Tablet can turn pages independently; updates propagate back to phone immediately
            </p>

          </div>
        )}

      </div>

      {/* Feature explanations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold mb-1">
            <Sparkles className="w-4 h-4" />
            Vector Text Sharpness
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Renders directly with native <code className="text-cyan-300">android.graphics.pdf.PdfRenderer</code>, eliminating video compression artifacts on tiny fonts.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold mb-1">
            <ArrowLeftRight className="w-4 h-4" />
            Independent Turn & Zoom
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Turn pages or pinch-to-zoom from either device. Monotonic versioning resolves conflicts deterministically.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1">
            <Layers className="w-4 h-4" />
            Ultra-Low Battery Drain
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Zero continuous video encoding. Battery drain drops from ~8.5%/hr down to &lt;2.8%/hr for extended reading.
          </p>
        </div>
      </div>

    </div>
  );
};
