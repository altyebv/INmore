import { Component } from 'react';

/**
 * Catches a failed GLB load or parse and falls back to the proxy (or
 * nothing) instead of taking the whole canvas down with it.
 *
 * `ProductModel` attempts the GLB optimistically, even before the HEAD check
 * has confirmed the file exists, so a genuinely missing or corrupt asset can
 * throw before that check has had a chance to redirect to the proxy. This
 * boundary is the safety net for that race.
 */
export class GlbLoadBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    if (import.meta.env.DEV) {
      console.warn('[ProductModel] GLB failed to load:', this.props.url, error);
    }
  }

  componentDidUpdate(prevProps) {
    // A different product means a different URL — give it a clean attempt
    // rather than freezing on the previous one's failure.
    if (prevProps.url !== this.props.url && this.state.failed) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ failed: false });
    }
  }

  render() {
    return this.state.failed ? this.props.fallback ?? null : this.props.children;
  }
}

export default GlbLoadBoundary;
