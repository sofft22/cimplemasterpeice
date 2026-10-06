import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col bg-white text-ink">
        {/* Minimal brand bar — no full Header (would risk a loop) */}
        <div className="border-b border-[#e5e5e5] px-5 py-4 sm:px-8 lg:px-10">
          <a
            href="/"
            className="text-[15px] font-bold uppercase tracking-[0.04em] leading-none text-black sm:text-[17px]"
          >
            Cimmple Hair<span className="text-rose">.</span>
          </a>
        </div>

        <main className="flex flex-1 items-center justify-center px-5 py-24 sm:px-8">
          <div className="mx-auto max-w-md text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-rose">
              Something went wrong
            </p>
            <h1 className="mt-3 text-[24px] font-bold uppercase leading-tight tracking-tight text-black sm:text-[30px]">
              We hit a snag
            </h1>
            <p className="mt-4 text-[13px] leading-[1.7] text-black/60 sm:text-[14px]">
              The page ran into an unexpected error. Reload to try again, or head back home.
            </p>

            <div className="mt-8 flex flex-col items-center gap-2.5 sm:flex-row sm:justify-center">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 rounded-full bg-rose px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-rose-deep"
              >
                Reload
              </button>
              <a
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-[#e5e5e5] px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-black transition-colors hover:border-rose hover:text-rose"
              >
                Back home
              </a>
            </div>
          </div>
        </main>
      </div>
    );
  }
}