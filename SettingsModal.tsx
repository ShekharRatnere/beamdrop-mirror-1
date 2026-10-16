import React from 'react';
import { 
  Settings, 
  Sliders, 
  Cpu, 
  Eye, 
  Activity, 
  Zap, 
  ShieldAlert, 
  X,
  Battery,
  HardDrive
} from 'lucide-react';
import { AppSettings, StreamingQualityMode } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Streaming & Performance Preferences</h3>
              <p className="text-[11px] text-slate-400">Hardware encoder optimization and display profiles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-5 space-y-5 max-h-[440px] overflow-y-auto text-xs">
          
          {/* Quality Profile: Reading Mode vs Motion Mode */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">
              Streaming Quality Profile
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  onUpdateSettings({
                    qualityMode: 'reading',
                    targetFps: 30,
                    maxBitrateMbps: 8,
                    readingModeTextSharpening: true,
                  });
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  settings.qualityMode === 'reading'
                    ? 'bg-slate-800 border-cyan-500 text-white ring-1 ring-cyan-500/40'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-cyan-400 mb-1">
                  <Eye className="w-4 h-4" />
                  Reading Mode
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Maximizes text clarity for PDFs and documents. 30 FPS target, lower battery drain (~2.8%/hr).
                </p>
              </button>

              <button
                onClick={() => {
                  onUpdateSettings({
                    qualityMode: 'motion',
                    targetFps: 60,
                    maxBitrateMbps: 12,
                    readingModeTextSharpening: false,
                  });
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  settings.qualityMode === 'motion'
                    ? 'bg-slate-800 border-cyan-500 text-white ring-1 ring-cyan-500/40'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-blue-400 mb-1">
                  <Zap className="w-4 h-4" />
                  Motion Mode
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Smooth 60 FPS screen navigation. Low-latency CBR stream with sub-50ms presentation target.
                </p>
              </button>
            </div>
          </div>

          {/* Target Frame Rate */}
          <div>
            <div className="flex justify-between text-slate-300 font-semibold mb-1.5">
              <span>Target Frame Rate</span>
              <span className="font-mono text-cyan-400">{settings.targetFps} FPS</span>
            </div>
            <div className="flex gap-2">
              {[30, 60].map((fps) => (
                <button
                  key={fps}
                  onClick={() => onUpdateSettings({ targetFps: fps })}
                  className={`flex-1 py-1.5 rounded-lg border text-center transition-colors font-medium ${
                    settings.targetFps === fps
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {fps} FPS
                </button>
              ))}
            </div>
          </div>

          {/* Max Bitrate Slider */}
          <div>
            <div className="flex justify-between text-slate-300 font-semibold mb-1.5">
              <span>Maximum Bitrate</span>
              <span className="font-mono text-cyan-400">{settings.maxBitrateMbps} Mbps</span>
            </div>
            <input
              type="range"
              min={2}
              max={20}
              step={1}
              value={settings.maxBitrateMbps}
              onChange={(e) => onUpdateSettings({ maxBitrateMbps: Number(e.target.value) })}
              className="w-full accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>2 Mbps (Battery Saver)</span>
              <span>10 Mbps (Balanced)</span>
              <span>20 Mbps (Ultra-Lossless)</span>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-white font-medium block">Keep Screen Awake (WakeLock)</span>
                <span className="text-slate-400 text-[11px]">Prevents device sleep during mirroring session</span>
              </div>
              <input
                type="checkbox"
                checked={settings.keepScreenOn}
                onChange={(e) => onUpdateSettings({ keepScreenOn: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 accent-cyan-400"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-white font-medium block">Automatic Reconnect</span>
                <span className="text-slate-400 text-[11px]">Automatically retries Wi-Fi Direct on transient drop</span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoReconnect}
                onChange={(e) => onUpdateSettings({ autoReconnect: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 accent-cyan-400"
              />
            </label>
          </div>

          {/* Advanced Touch Injection Notice (Section 8) */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Remote Touch Input (Accessibility Service)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Dispatching remote touch events to 3rd-party Android apps requires enabling an AccessibilityService. Disabled by default to protect personal data and adhere to Google Play security guidelines.
            </p>
            <label className="flex items-center gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableAccessibilityTouch}
                onChange={(e) => onUpdateSettings({ enableAccessibilityTouch: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 accent-amber-500"
              />
              <span className="text-slate-300 font-medium">Enable Optional Remote Touch Input</span>
            </label>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
