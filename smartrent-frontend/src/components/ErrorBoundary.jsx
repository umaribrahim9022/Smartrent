import React from 'react';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[SmartRent ErrorBoundary] Uncaught render error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      // Clear potentially corrupt localStorage state
      const theme = localStorage.getItem('smartrent-theme');
      localStorage.clear();
      if (theme) localStorage.setItem('smartrent-theme', theme);
    } catch (_) {}
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-6" style={{ background: 'var(--surface-sunken)' }}>
          <div className="surface max-w-md w-full p-8 text-center space-y-4 rounded-2xl border" style={{ borderColor: 'var(--border)' }}>
            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
              Something went wrong
            </h1>

            <p className="text-xs leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
              We encountered an unexpected error loading this view. You can return to the home page or reset your session.
            </p>

            {this.state.error && (
              <div className="p-3 rounded-lg text-[11px] font-mono text-left overflow-auto max-h-32" style={{ background: 'var(--surface-tint)', color: 'var(--danger)' }}>
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <a
                href="/"
                className="btn btn-secondary btn-sm flex-1 flex items-center justify-center gap-1.5"
              >
                <Home className="w-4 h-4" /> Go to Home
              </a>
              <button
                type="button"
                onClick={this.handleReset}
                className="btn btn-primary btn-sm flex-1 flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" /> Reset & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
