import React from 'react';
import { 
  Usb, 
  Wifi, 
  Radio, 
  Bluetooth, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  X,
  Sliders,
  ShieldCheck
} from 'lucide-react';
import { ConnectionTransport } from '../types';

interface ConnectionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTransport: ConnectionTransport;
  onSelectTransport: (transport: ConnectionTransport) => void;
}

export const ConnectionManagerModal: React.FC<ConnectionManagerModalProps> = ({
  isOpen,
  onClose,
  activeTransport,
  onSelectTransport,
}) => {
  if (!isOpen) return null;

  const transports: {
    id: ConnectionTransport;
    name: string;
    priority: number;
    icon: React.ReactNode;
    status: 'operational' | 'available' | 'requires_hardware';
    description: string;
    notes: string;
  }[] = [
    {
      id: 'usb',
      name: 'USB-C Wired Connection (AOA Protocol)',
      priority: 1,
      icon: <Usb className="w-5 h-5 text-cyan-400" />,
      status: 'operational',
      description: 'Zero wireless interference, sub-30ms latency, dual-role USB-C to USB-C cable.',
      notes: 'Requires one device in USB Host (OTG) mode and companion in Android Open Accessory (AOA) mode. If role negotiation fails, automatically falls back to Wi-Fi Direct.',
    },
    {
      id: 'wifi_direct',
      name: 'Wi-Fi Direct (P2P Direct Wireless)',
      priority: 2,
      icon: <Radio className="w-5 h-5 text-emerald-400" />,
      status: 'operational',
      description: 'Device-to-device direct 5GHz Wi-Fi link. 100% offline, zero internet or router required.',
      notes: 'Uses Android WifiP2pManager. One device acts as autonomous Group Owner (GO). Target latency: 35-45ms.',
    },
    {
      id: 'local_wifi',
      name: 'Local Wi-Fi Network (LAN / Subnet)',
      priority: 3,
      icon: <Wifi className="w-5 h-5 text-blue-400" />,
      status: 'available',
      description: 'Both devices connected to same local router. Works even when router has no internet uplink.',
      notes: 'Uses mDNS / Network Service Discovery (NSD) on port 9245. AES-256-GCM encrypted traffic.',
    },
    {
      id: 'hotspot',
      name: 'Personal Mobile Hotspot',
      priority: 4,
      icon: <Radio className="w-5 h-5 text-purple-400" />,
      status: 'available',
      description: 'Tablet connects directly to Phone portable Wi-Fi hotspot without consuming cellular data.',
      notes: 'Direct TCP socket binding on 192.168.43.1 gateway.',
    },
    {
      id: 'bluetooth_discovery',
      name: 'Bluetooth Low Energy (BLE Discovery Only)',
      priority: 5,
      icon: <Bluetooth className="w-5 h-5 text-indigo-400" />,
      status: 'available',
      description: 'Used strictly for initial out-of-band device discovery and pairing handshakes.',
      notes: 'Not used for video streaming due to Bluetooth bandwidth limitations (~2 Mbps max throughput).',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Connection Transport Manager</h3>
              <p className="text-[11px] text-slate-400">Select preferred offline transport</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Transports List */}
        <div className="p-4 space-y-3 max-h-[460px] overflow-y-auto">
          {transports.map((t) => {
            const isSelected = activeTransport === t.id;
            return (
              <div
                key={t.id}
                onClick={() => onSelectTransport(t.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-slate-800/80 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/30'
                    : 'bg-slate-950/40 border-slate-800 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      {t.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{t.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">Priority {t.priority}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{t.description}</p>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      Active
                    </span>
                  )}
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/60 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">Technical Context: </span>
                  {t.notes}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Automatic fallback engages upon signal interruption.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors"
          >
            Apply & Close
          </button>
        </div>

      </div>
    </div>
  );
};
