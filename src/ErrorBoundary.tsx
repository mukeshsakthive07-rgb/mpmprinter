// @ts-nocheck
import React, { Component, ErrorInfo, ReactNode } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error('Uncaught error:', error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
          <div className="bg-rose-900/50 p-6 rounded-xl border border-rose-500/50 max-w-xl w-full">
            <h1 className="text-xl font-bold text-rose-400 mb-2">Something went wrong.</h1>
            <p className="text-sm text-rose-200 mb-4">The application encountered an unexpected error.</p>
            <pre className="text-xs bg-slate-950 p-4 rounded overflow-auto max-h-64 text-rose-300 font-mono">
              {this.state.error?.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 rounded-lg text-sm font-medium transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
