/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, RotateCcw, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  sectionName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  recoveryAttempted: boolean;
}

/**
 * Prime News Graph Enterprise Editorial Error Boundary
 * Catches unhandled runtime exceptions gracefully, prevents blank-screen crashes,
 * and presents bilingual recovery paths while maintaining editorial brand integrity.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      recoveryAttempted: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[PRIME NEWS GRAPH ErrorBoundary] Caught unhandled exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleResetState = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, recoveryAttempted: true });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleClearCacheAndReload = () => {
    try {
      // Clear non-critical app caches while keeping essential session if preferred
      sessionStorage.clear();
      // Keep admin credentials/tokens intact in localStorage, but clear UI transient flags
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.startsWith('png_admin_') && key !== 'png_theme') {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Cache clearing error:', e);
    }
    window.location.href = '/';
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, showDetails } = this.state;
      const isBengali = typeof document !== 'undefined' && document.documentElement.lang === 'bn';

      return (
        <div className="min-h-screen bg-[#F5F7FA] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between font-sans transition-colors duration-200">
          {/* Top Editorial Ribbon */}
          <div className="bg-[#101D35] dark:bg-black text-white border-b border-blue-950 px-4 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3">
              <span className="font-serif font-black tracking-tight text-lg text-white">
                PRIME <span className="text-[#246BFD]">NEWS</span> GRAPH
              </span>
              <span className="hidden sm:inline-block text-xs uppercase tracking-widest text-slate-400 border-l border-slate-700 pl-3">
                Editorial Platform Safety Shield
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-mono bg-amber-950/40 border border-amber-800/40 px-2.5 py-1 rounded">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Fault-Tolerant Engine</span>
            </div>
          </div>

          {/* Main Error Canvas */}
          <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-12">
            <div className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              {/* Header Badge */}
              <div className="bg-gradient-to-r from-red-600 to-rose-700 p-6 text-white text-center sm:text-left flex flex-col sm:flex-row items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/20">
                  <AlertTriangle className="w-8 h-8 text-white animate-pulse" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold font-serif leading-tight">
                    {isBengali ? 'একটি অনাকাঙ্ক্ষিত ত্রুটি দেখা দিয়েছে' : 'An Unexpected Error Occurred'}
                  </h1>
                  <p className="text-red-100 text-sm mt-1">
                    {isBengali
                      ? 'সংবাদ পরিবেশন প্রক্রিয়া সুরক্ষিত রাখা হয়েছে। আপনি পুনরায় পৃষ্ঠাটি লোড করতে পারেন।'
                      : 'Editorial systems remained secure. The application caught this issue to protect your browsing session.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons & Recovery Paths */}
              <div className="p-6 sm:p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={this.handleReload}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#246BFD] hover:bg-blue-600 text-white font-medium text-sm transition-all shadow-sm cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>{isBengali ? 'পৃষ্ঠা পুনরায় লোড করুন' : 'Reload Page'}</span>
                  </button>

                  <button
                    onClick={this.handleGoHome}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#101D35] dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-medium text-sm transition-all shadow-sm cursor-pointer"
                  >
                    <Home className="w-4 h-4" />
                    <span>{isBengali ? 'মূল পাতায় ফিরে যান' : 'Back to Homepage'}</span>
                  </button>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={this.handleResetState}
                    className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isBengali ? 'কম্পোনেন্ট রিস্টার্ট করুন' : 'Restart Component State'}</span>
                  </button>

                  <button
                    onClick={this.handleClearCacheAndReload}
                    className="hover:text-red-600 dark:hover:text-red-400 underline decoration-dotted cursor-pointer"
                  >
                    {isBengali ? 'ক্যাশ পরিষ্কার করে ফ্রেশ শুরু করুন' : 'Clear Cache & Fresh Start'}
                  </button>
                </div>

                {/* Collapsible Diagnostic Details (for engineers/audits) */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-950/60">
                  <button
                    onClick={this.toggleDetails}
                    className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-colors"
                  >
                    <span className="font-mono">
                      {isBengali ? 'কারিগরি ডায়াগনস্টিক তথ্য' : 'Technical Diagnostics'}
                    </span>
                    {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showDetails && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 space-y-2 overflow-x-auto max-h-60 overflow-y-auto">
                      <div className="font-bold text-red-600 dark:text-red-400">
                        {error?.name || 'Error'}: {error?.message || 'Unknown Exception'}
                      </div>
                      {error?.stack && (
                        <pre className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                          {error.stack}
                        </pre>
                      )}
                      {errorInfo?.componentStack && (
                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                          <span className="text-slate-500 font-semibold">Component Stack:</span>
                          <pre className="text-[10px] leading-relaxed text-slate-500 whitespace-pre-wrap">
                            {errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>

          {/* Footer Ribbon */}
          <footer className="text-center py-4 text-xs text-slate-500 dark:text-slate-500 border-t border-slate-200 dark:border-slate-800">
            &copy; {new Date().getFullYear()} PRIME NEWS GRAPH. International Editorial Integrity Guaranteed.
          </footer>
        </div>
      );
    }

    return this.props.children;
  }
}
