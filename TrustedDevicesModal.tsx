import React from 'react';
import { 
  ShieldCheck, 
  Trash2, 
  Smartphone, 
  Tablet, 
  X, 
  Lock, 
  AlertCircle,
  KeyRound
} from 'lucide-react';
import { DeviceInfo } from '../types';

interface TrustedDevicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  trustedDevices: DeviceInfo[];
  onRevokeDevice: (id: string) => void;
  onConnectTrusted: (device: DeviceInfo) => void;
}

export const TrustedDevicesModal: React.FC<TrustedDevicesModalProps> = ({
  isOpen,
  onClose,
  trustedDevices,
  onRevokeDevice,
  onConnectTrusted,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Trusted Devices</h3>
              <p className="text-[11px] text-slate-400">Authenticated peer keys stored locally in secure app storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 max-h-[380px] overflow-y-auto">
          {trustedDevices.length === 0 ? (
            <div className="text-center py-8">
              <Lock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No trusted devices registered yet.</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                Pair using QR code or passkey and select &quot;Save as Trusted Device&quot; to authorize future quick connections.
              </p>
            </div>
          ) : (
            trustedDevices.map((device) => (
              <div
                key={device.id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400">
                    {device.type === 'phone' ? <Smartphone className="w-4 h-4" /> : <Tablet className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">{device.name}</h4>
                    <p className="font-mono text-[10px] text-slate-400 mt-0.5">
                      Fingerprint: {device.publicKeyFingerprint}
                    </p>
                    <span className="text-[10px] text-emerald-400">
                      OS: {device.osVersion} · Authorized
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onConnectTrusted(device)}
                    className="px-3 py-1 text-xs font-medium text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors"
                  >
                    Connect
                  </button>
                  <button
                    onClick={() => onRevokeDevice(device.id)}
                    title="Revoke trusted device authorization"
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Security Notice */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
            <KeyRound className="w-3.5 h-3.5" />
            Security Rule:
          </div>
          <p>
            Reconnecting to a trusted device never reuses old cryptographic keys. A fresh ephemeral ECDH handshake is executed for every session to guarantee forward secrecy.
          </p>
        </div>

      </div>
    </div>
  );
};
