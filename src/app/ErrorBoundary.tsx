import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * Catches unhandled render errors so a single component failure shows a
 * recoverable fallback instead of a blank page.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled render error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-card border border-border rounded-xl p-6 text-center space-y-4">
            <h1 className="text-lg font-semibold text-foreground">
              Something went wrong
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              An unexpected error occurred while rendering the app. Your API key
              and report text never leave this device — reloading is safe.
            </p>
            <pre className="text-xs text-destructive bg-background border border-border rounded p-3 overflow-x-auto text-left whitespace-pre-wrap">
              {this.state.error.message}
            </pre>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="bg-primary hover:bg-primary-hover text-white font-medium text-sm px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              Reload app
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
