import { Component } from "react";

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || "Unexpected application failure." };
  }

  componentDidCatch(error) {
    console.error("App boundary caught an error", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen px-6 py-10">
          <div className="glass-panel mx-auto max-w-2xl p-8 text-center">
            <div className="text-xs uppercase tracking-[0.3em] text-white/45">Recovery mode</div>
            <h1 className="mt-4 font-display text-4xl text-white">Arrakis hit an unexpected fault</h1>
            <p className="mt-4 text-sm leading-7 text-white/62">{this.state.message}</p>
            <button
              className="focus-ring mt-6 rounded-button bg-gradient-to-r from-orange-500 to-yellow-400 px-5 py-3 font-semibold text-black"
              onClick={() => window.location.reload()}
              type="button"
            >
              Reload application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
