import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-background via-accent to-background flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full border-danger/50">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-danger/10 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-danger" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Something Went Wrong</CardTitle>
                  <CardDescription>
                    We encountered an unexpected error. Don't worry, your data is safe.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-lg border">
                <p className="text-sm font-mono text-danger mb-2">
                  {this.state.error?.toString()}
                </p>
                {process.env.NODE_ENV === "development" && this.state.errorInfo && (
                  <details className="text-xs text-muted-foreground mt-2">
                    <summary className="cursor-pointer hover:text-foreground">
                      Stack trace (dev only)
                    </summary>
                    <pre className="mt-2 overflow-auto max-h-60 text-xs">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={this.handleReset} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={this.handleGoHome} variant="outline" className="flex-1">
                  <Home className="h-4 w-4 mr-2" />
                  Go to Homepage
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>If this problem persists, please try:</p>
                <ul className="mt-2 space-y-1 text-left max-w-md mx-auto">
                  <li>• Clearing your browser cache</li>
                  <li>• Refreshing the page</li>
                  <li>• Checking your internet connection</li>
                  <li>• Trying a different browser</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

