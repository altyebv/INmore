import { Component } from 'react';
import Button from '@/components/ui/Button';
import { useT } from '@/i18n';

/**
 * The default fallback. A function component so it can read the active locale;
 * the boundary itself must stay a class, and classes cannot use hooks.
 */
export function ErrorFallback() {
  const t = useT();

  return (
    <div
      className="u-shell"
      style={{ minHeight: '60svh', display: 'grid', alignContent: 'center', gap: 'var(--space-4)' }}
    >
      <p className="u-label">{t.error.eyebrow}</p>
      <h1 style={{ fontSize: 'var(--step-3)', maxWidth: '18ch' }}>{t.error.heading}</h1>
      <div>
        <Button onClick={() => window.location.reload()} variant="primary">
          {t.common.reload}
        </Button>
      </div>
    </div>
  );
}

/**
 * Keeps a WebGL or asset failure from taking the whole site down.
 * The 3D layer is the most likely thing to fail on unusual hardware, and a
 * visitor should still be able to read the site and reach us if it does.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Replace with a real reporter when one exists.
    console.error('[INMORE]', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return this.props.fallback ?? <ErrorFallback />;
  }
}

export default ErrorBoundary;
