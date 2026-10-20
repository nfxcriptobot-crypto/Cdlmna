import React, { useState } from 'react';
import { Download, Smartphone, Terminal, Github, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { generateAndroidProjectZip } from '../game/androidExport';

interface AndroidExportModalProps {
  onClose: () => void;
}

export const AndroidExportModal: React.FC<AndroidExportModalProps> = ({ onClose }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'cloud' | 'studio' | 'install'>('cloud');

  const handleDownloadZip = async () => {
    try {
      setIsExporting(true);
      const zipBlob = await generateAndroidProjectZip();
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'shadow-strike-android-project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadSuccess(true);
    } catch (err) {
      console.error('Failed to export Android project zip:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      data-no-aim
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 pointer-events-auto select-none"
    >
      <div className="w-full max-w-2xl bg-slate-900 border-2 border-sky-500/50 rounded-2xl shadow-2xl p-6 text-slate-100 relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wider uppercase text-slate-100">
                NATIVE ANDROID APK & PROJECT EXPORTER
              </h2>
              <p className="text-xs text-slate-400">
                Kotlin 2.0 • Jetpack Compose • OpenGL ES 3.0 • Offline Ready
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="my-4 flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Main Action Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/80 via-slate-900 to-slate-950 border border-sky-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="font-bold text-sm text-sky-300">
                Complete Android Studio Project Source (.ZIP)
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Includes MainActivity.kt, GameRenderer.kt, build.gradle.kts, AndroidManifest, and GitHub Actions workflow.
              </div>
            </div>

            <button
              onClick={handleDownloadZip}
              disabled={isExporting}
              className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 active:scale-95 disabled:opacity-60 transition"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'PACKAGING ZIP...' : 'DOWNLOAD PROJECT ZIP'}</span>
            </button>
          </div>

          {downloadSuccess && (
            <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Project zip successfully downloaded! Follow instructions below to produce your APK.</span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 gap-2">
            <button
              onClick={() => setActiveTab('cloud')}
              className={`py-2 px-3 text-xs font-bold uppercase border-b-2 transition ${
                activeTab === 'cloud'
                  ? 'border-sky-400 text-sky-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Cloud Build (Free APK)
            </button>
            <button
              onClick={() => setActiveTab('studio')}
              className={`py-2 px-3 text-xs font-bold uppercase border-b-2 transition ${
                activeTab === 'studio'
                  ? 'border-sky-400 text-sky-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Android Studio
            </button>
            <button
              onClick={() => setActiveTab('install')}
              className={`py-2 px-3 text-xs font-bold uppercase border-b-2 transition ${
                activeTab === 'install'
                  ? 'border-sky-400 text-sky-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Install on Phone
            </button>
          </div>

          {/* Tab 1: Cloud Build */}
          {activeTab === 'cloud' && (
            <div className="space-y-3 text-xs text-slate-300 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-sky-400 font-bold">
                <Github className="w-4 h-4" />
                <span>Zero-Install Cloud APK Build via GitHub Actions</span>
              </div>
              <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed">
                <li>
                  Extract the downloaded <code className="bg-slate-800 px-1 py-0.5 rounded text-sky-300">shadow-strike-android-project.zip</code>.
                </li>
                <li>
                  Create a new repository on GitHub and push the extracted files.
                </li>
                <li>
                  The included workflow <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300">.github/workflows/build-apk.yml</code> will trigger automatically.
                </li>
                <li>
                  Once complete (about 2 minutes), go to the <strong>Actions</strong> tab &gt; click the build &gt; download <code className="text-emerald-300 font-bold">ShadowStrike-Survival-Debug-APK</code>.
                </li>
                <li>
                  Copy the APK to your Android device and open it to play!
                </li>
              </ol>
            </div>
          )}

          {/* Tab 2: Android Studio Local Build */}
          {activeTab === 'studio' && (
            <div className="space-y-3 text-xs text-slate-300 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Terminal className="w-4 h-4" />
                <span>Compiling in Android Studio or Terminal</span>
              </div>
              <p>You can compile the debug APK on your computer using Gradle:</p>
              <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-sky-300 overflow-x-auto">
{`# 1. Open terminal in the project directory
# 2. Build the debug APK with Gradle:
./gradlew assembleDebug

# Output APK location:
# app/build/outputs/apk/debug/app-debug.apk`}
              </pre>
              <p className="text-slate-400">
                Or open the folder directly in <strong>Android Studio (Hedgehog or newer)</strong>, let Gradle sync, and click <strong>Run (▶)</strong> to install to an emulator or connected phone.
              </p>
            </div>
          )}

          {/* Tab 3: Installing on Phone */}
          {activeTab === 'install' && (
            <div className="space-y-3 text-xs text-slate-300 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Smartphone className="w-4 h-4" />
                <span>Installing APK onto your Android Device</span>
              </div>
              <div className="space-y-2">
                <div className="font-bold text-slate-200">Method A: Direct on Phone (Easiest)</div>
                <p>
                  Download or transfer <code className="text-sky-300">app-debug.apk</code> to your phone (via USB, Google Drive, or email). Tap the file in your Files app and tap <strong>Install</strong>. (Allow &quot;Install from unknown sources&quot; when prompted).
                </p>

                <div className="font-bold text-slate-200 mt-3">Method B: USB Cable via ADB</div>
                <pre className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono text-sky-300">
                  adb install -r app/build/outputs/apk/debug/app-debug.apk
                </pre>
              </div>
            </div>
          )}

          {/* Technical Specifications & Remaining Limitations */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-300 font-bold">
              <AlertCircle className="w-3.5 h-3.5 text-sky-400" />
              <span>Hardware & Compatibility Profile</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-slate-400 text-[11px]">
              <li>Android OS: Minimum SDK 24 (Android 7.0 Nougat) through Target SDK 34 (Android 14).</li>
              <li>3D Renderer: Native OpenGL ES 3.0 SurfaceView (no NDK/C++ toolchain required).</li>
              <li>Offline: 100% self-contained, no network connectivity or user login required.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 uppercase"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
