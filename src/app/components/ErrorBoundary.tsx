import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { Zap } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary — catches render-time exceptions and shows
 * a styled fallback instead of a white screen of death.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            background: "#f8fafc",
            fontFamily: "'Inter', sans-serif",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#fef2f2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <Zap style={{ width: 32, height: 32, color: "#ef4444" }} />
          </div>

          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
            Something went wrong
          </h1>

          <p style={{ fontSize: "0.875rem", color: "#64748b", marginTop: 8, maxWidth: 320 }}>
            An unexpected error occurred. Please reload the page to try again.
          </p>

          {import.meta.env.DEV && this.state.error && (
            <pre
              style={{
                marginTop: 16,
                padding: 12,
                background: "#1e293b",
                color: "#f87171",
                borderRadius: 12,
                fontSize: "0.7rem",
                maxWidth: "100%",
                overflow: "auto",
                textAlign: "left",
              }}
            >
              {this.state.error.message}
              {"\n"}
              {this.state.error.stack}
            </pre>
          )}

          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 24,
              padding: "12px 32px",
              background: "#10b981",
              color: "white",
              border: "none",
              borderRadius: 12,
              fontSize: "0.9rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
