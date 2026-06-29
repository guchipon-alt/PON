import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('PON Error:', error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0c0c0d] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#161619] border border-rose-500/30 rounded-3xl p-8 space-y-6">
            <div className="flex justify-center">
              <AlertTriangle className="w-12 h-12 text-rose-500 animate-bounce" />
            </div>
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold text-white">Что-то пошло не так</h1>
              <p className="text-sm text-neutral-400">
                ПОН столкнулась с неожиданной ошибкой. Попробуй перезагрузить приложение.
              </p>
            </div>
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
              <p className="text-xs font-mono text-rose-300 break-words">
                {this.state.error?.message || 'Unknown error'}
              </p>
            </div>
            <button
              onClick={this.reset}
              className="w-full py-3 bg-white hover:bg-neutral-100 text-black font-semibold rounded-full flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Перезагрузить приложение
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
