import React from 'react';
import { 
  Cast, 
  BookOpen, 
  Code2, 
  Activity, 
  FileText, 
  ShieldCheck, 
  QrCode, 
  Radio, 
  Settings,
  Square
} from 'lucide-react';
import { ConnectionState, ConnectionTransport } from '../types';

interface TopNavProps {
  activeTab: 'sandbox' | 'pdf' | 'android_project' | 'diagnostics' | 'docs';
  setActiveTab: (tab: 'sandbox' | 'pdf' | 'android_project' | 'diagnostics' | 'docs') => void;
  connectionState: ConnectionState;
  activeTransport: ConnectionTransport;
  isStreaming: boolean;
  onOpenPairing: () => void;
  onStopStreaming: () => void;
  onOpenSettings: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  connectionState,
  activeTransport,
  isStreaming,
  onOpenPairing,
  onStopStreaming,
  onOpenSettings,
}) => {
  const getTransportLabel = (transport: ConnectionTransport) => {
    switch (transport) {
      case 'usb': return 'USB-C Wired';
      case 'wifi_direct': return 'Wi-Fi Direct P2P';
      case 'local_wifi': return 'Local Wi-Fi';
      case 'hotspot': return 'Hotspot';
      case 'bluetooth_discovery': return 'BLE Discovery';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-8 h-16">
        
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-bold">
            <Cast className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
            BeamDrop Mirror
          </span>
        </div>

        {/* Zone 2: Navigation Links (Single line, 4-5 items) */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`flex items-center gap-2 transition-colors whitespace-nowrap py-1 ${
              activeTab === 'sandbox'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'hover:text-white'
            }`}
          >
            <Cast className="w-4 h-4" />
            Live Mirroring Lab
          </button>

          <button
            onClick={() => setActiveTab('pdf')}
            className={`flex items-center gap-2 transition-colors whitespace-nowrap py-1 ${
              activeTab === 'pdf'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            PDF Reading Mode
          </button>

          <button
            onClick={() => setActiveTab('android_project')}
            className={`flex items-center gap-2 transition-colors whitespace-nowrap py-1 ${
              activeTab === 'android_project'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'hover:text-white'
            }`}
          >
            <Code2 className="w-4 h-4" />
            Native Android Codebase
          </button>

          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`flex items-center gap-2 transition-colors whitespace-nowrap py-1 ${
              activeTab === 'diagnostics'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            Telemetry & Diagnostics
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center gap-2 transition-colors whitespace-nowrap py-1 ${
              activeTab === 'docs'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            Architecture & Specs
          </button>
        </nav>

        {/* Zone 3: Primary Action & Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Connection status indicator */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <Radio className={`w-3.5 h-3.5 ${isStreaming ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span>{getTransportLabel(activeTransport)}</span>
            <span aria-hidden="true">·</span>
            <span className="capitalize">{connectionState}</span>
          </div>

          <button
            onClick={onOpenSettings}
            title="Streaming Settings"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>

          {isStreaming ? (
            <button
              onClick={onStopStreaming}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors shadow-sm whitespace-nowrap"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              Stop Mirroring
            </button>
          ) : (
            <button
              onClick={onOpenPairing}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-sm whitespace-nowrap"
            >
              <QrCode className="w-3.5 h-3.5" />
              Pair Devices
            </button>
          )}
        </div>

      </div>

      {/* Mobile subnav */}
      <div className="lg:hidden flex items-center justify-around border-t border-slate-900 bg-slate-950 px-2 py-2 text-xs">
        <button
          onClick={() => setActiveTab('sandbox')}
          className={`px-2 py-1 rounded ${activeTab === 'sandbox' ? 'text-cyan-400 font-semibold' : 'text-slate-400'}`}
        >
          Mirroring
        </button>
        <button
          onClick={() => setActiveTab('pdf')}
          className={`px-2 py-1 rounded ${activeTab === 'pdf' ? 'text-cyan-400 font-semibold' : 'text-slate-400'}`}
        >
          PDF Mode
        </button>
        <button
          onClick={() => setActiveTab('android_project')}
          className={`px-2 py-1 rounded ${activeTab === 'android_project' ? 'text-cyan-400 font-semibold' : 'text-slate-400'}`}
        >
          Android Code
        </button>
        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`px-2 py-1 rounded ${activeTab === 'diagnostics' ? 'text-cyan-400 font-semibold' : 'text-slate-400'}`}
        >
          Diagnostics
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          className={`px-2 py-1 rounded ${activeTab === 'docs' ? 'text-cyan-400 font-semibold' : 'text-slate-400'}`}
        >
          Specs
        </button>
      </div>
    </header>
  );
};
