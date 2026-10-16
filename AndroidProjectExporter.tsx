import React, { useState } from 'react';
import JSZip from 'jszip';
import { 
  Code2, 
  Download, 
  Copy, 
  Check, 
  FolderTree, 
  FileCode, 
  Terminal, 
  Layers, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';
import { NATIVE_ANDROID_FILES, AndroidFile } from '../data/nativeAndroidCodebase';

export const AndroidProjectExporter: React.FC = () => {
  const [selectedFilePath, setSelectedFilePath] = useState<string>(NATIVE_ANDROID_FILES[0].path);
  const [isCopied, setIsCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  const selectedFile = NATIVE_ANDROID_FILES.find(f => f.path === selectedFilePath) || NATIVE_ANDROID_FILES[0];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const zip = new JSZip();

      // Add all native Android files to the zip maintaining project hierarchy
      NATIVE_ANDROID_FILES.forEach(file => {
        zip.file(file.path, file.content);
      });

      // Add gradle wrapper properties and root files
      zip.file('gradle/wrapper/gradle-wrapper.properties', `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.5-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`);

      zip.file('gradle.properties', `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
kotlin.code.style=official
`);

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'BeamDropMirror-AndroidStudio-Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create project ZIP:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const filteredFiles = activeCategoryFilter === 'all'
    ? NATIVE_ANDROID_FILES
    : NATIVE_ANDROID_FILES.filter(f => f.category === activeCategoryFilter);

  return (
    <div className="space-y-6">
      
      {/* Exporter Header Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Code2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Native Android Studio Project (Kotlin & Jetpack Compose)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Production-ready Android code: MediaProjection, MediaCodec, X25519/AES-GCM, Wi-Fi Direct, and AOA USB
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadZip}
          disabled={isZipping}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-xl transition-all shadow-md shadow-cyan-500/10 active:scale-95 whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          {isZipping ? 'Generating Android Studio .zip...' : 'Download Project (.zip)'}
        </button>
      </div>

      {/* Main Codebase Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: File Tree Browser */}
        <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
          
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <FolderTree className="w-4 h-4 text-cyan-400" />
              <span>Project Structure</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              {NATIVE_ANDROID_FILES.length} Files
            </span>
          </div>

          {/* Category Filter Pills */}
          <div className="p-2 border-b border-slate-800 flex flex-wrap gap-1 bg-slate-950/20">
            {['all', 'service', 'media', 'crypto', 'transport', 'pdf', 'ui', 'test'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategoryFilter(cat)}
                className={`px-2 py-0.5 text-[10px] rounded-md transition-colors capitalize ${
                  activeCategoryFilter === cat
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* File List */}
          <div className="p-2 space-y-1 max-h-[520px] overflow-y-auto">
            {filteredFiles.map((file) => {
              const isSelected = file.path === selectedFilePath;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFilePath(file.path)}
                  className={`w-full text-left p-2 rounded-xl transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-300 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <FileCode className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <div className="truncate">
                    <span className="text-xs font-semibold block truncate">{file.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono block truncate">{file.path}</span>
                  </div>
                </button>
              );
            })}
          </div>

        </div>

        {/* Right: File Code Viewer */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-xl">
          
          {/* File Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white font-mono">{selectedFile.path}</span>
                <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                  {selectedFile.category}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{selectedFile.description}</p>
            </div>

            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors shrink-0"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Syntax Code Container */}
          <div className="p-4 overflow-x-auto max-h-[500px] overflow-y-auto bg-slate-950 font-mono text-xs leading-relaxed text-slate-300">
            <pre className="whitespace-pre">
              <code>{selectedFile.content}</code>
            </pre>
          </div>

        </div>

      </div>

      {/* APK Compilation Instructions */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          Building and Installing on Android Devices
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="font-bold text-cyan-400 block">Step 1: Open in Android Studio</span>
            <p className="text-slate-400 leading-relaxed">
              Extract the downloaded ZIP. Open the folder in Android Studio (Ladybug or later). Gradle will synchronize dependencies automatically.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="font-bold text-cyan-400 block">Step 2: Build Debug / Release APK</span>
            <p className="text-slate-400 leading-relaxed font-mono">
              ./gradlew assembleDebug
            </p>
            <p className="text-slate-500 text-[11px]">
              Outputs to <code className="text-slate-300">app/build/outputs/apk/debug/app-debug.apk</code>
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="font-bold text-cyan-400 block">Step 3: Deploy to Phone & Tablet</span>
            <p className="text-slate-400 leading-relaxed font-mono">
              adb -s &lt;phone&gt; install app-debug.apk<br />
              adb -s &lt;tablet&gt; install app-debug.apk
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};
