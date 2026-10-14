import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home, Copy, Check } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
  inline?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    console.error('[WireBrain ErrorBoundary] Caught render error:', error, errorInfo);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleResetToDefault = (): void => {
    try {
      const stored = localStorage.getItem('wirebrain_project_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.boards && parsed.boards.length > 0) {
          parsed.activeBoardId = parsed.boards[0].id;
          localStorage.setItem('wirebrain_project_v1', JSON.stringify(parsed));
        }
      }
    } catch (e) {
      console.warn('Failed to reset active board in storage:', e);
    }
    if (this.props.onReset) {
      this.props.onReset();
      this.setState({ hasError: false, error: null, errorInfo: null });
    } else {
      window.location.reload();
    }
  };

  handleCopyDetails = (): void => {
    const details = `${this.state.error?.toString()}\n\nComponent Stack:\n${this.state.errorInfo?.componentStack || 'N/A'}`;
    navigator.clipboard.writeText(details).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || 'An unexpected error occurred during rendering.';
      const compStack = this.state.errorInfo?.componentStack || '';

      const isInline = Boolean(this.props.inline);

      return (
        <div
          role="alert"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: isInline ? 1 : undefined,
            width: isInline ? '100%' : '100vw',
            height: isInline ? '100%' : '100vh',
            minHeight: isInline ? 320 : undefined,
            backgroundColor: '#050507',
            color: '#f4f5f8',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            padding: 24,
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              maxWidth: 580,
              width: '100%',
              backgroundColor: '#0c0e14',
              border: '1px solid #232938',
              borderRadius: 12,
              padding: '28px 32px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(239, 68, 68, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ef4444',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#ffffff' }}>
                  {this.props.fallbackTitle || 'WireBrain Recovered from an Error'}
                </h2>
                <span style={{ fontSize: 12, color: '#8895a7' }}>
                  The application caught a render exception and preserved your saved data safely.
                </span>
              </div>
            </div>

            {/* Error Message Box */}
            <div
              style={{
                backgroundColor: '#07080c',
                border: '1px solid #1c2230',
                borderRadius: 8,
                padding: '12px 14px',
                fontSize: 12,
                color: '#f87171',
                fontFamily: 'monospace',
                lineHeight: 1.45,
                maxHeight: 120,
                overflowY: 'auto',
                wordBreak: 'break-word',
              }}
            >
              {errorMsg}
            </div>

            {/* Collapsible Stack Trace */}
            {compStack && (
              <details style={{ fontSize: 11, color: '#6b798e' }}>
                <summary style={{ cursor: 'pointer', outline: 'none', userSelect: 'none' }}>
                  View component diagnostic stack
                </summary>
                <pre
                  style={{
                    marginTop: 8,
                    padding: 10,
                    backgroundColor: '#040508',
                    border: '1px solid #161b26',
                    borderRadius: 6,
                    fontSize: 10,
                    color: '#8b9bb4',
                    maxHeight: 150,
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace',
                  }}
                >
                  {compStack}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={this.handleResetToDefault}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '9px 14px',
                  backgroundColor: '#2563eb',
                  border: '1px solid #3b82f6',
                  borderRadius: 6,
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  minWidth: 160,
                }}
              >
                <Home size={14} /> Switch to Default Board
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '9px 14px',
                  backgroundColor: '#121620',
                  border: '1px solid #232c3d',
                  borderRadius: 6,
                  color: '#d0dae7',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={14} /> Reload
              </button>

              <button
                type="button"
                onClick={this.handleCopyDetails}
                title="Copy technical details to clipboard"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '9px 14px',
                  backgroundColor: '#121620',
                  border: '1px solid #232c3d',
                  borderRadius: 6,
                  color: '#d0dae7',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {this.state.copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{this.state.copied ? 'Copied' : 'Copy Log'}</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
