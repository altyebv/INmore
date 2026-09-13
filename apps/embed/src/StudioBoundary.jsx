import { Component } from 'react';
import { Fallback } from './fallback';
import { ERROR_CODES } from './protocol';

/**
 * The last line of defence.
 *
 * Every check in `resolveTenant` runs before the engine is even loaded, so a
 * config that is wrong in a way the schema catches never gets here. But a
 * config that passes validation and still describes something the engine
 * cannot render — a mismatch the schema does not know to check, a model the
 * loader chokes on — used to take the canvas down silently: React unmounts to
 * a blank iframe, and because nothing threw *before* `resolveTenant` resolved,
 * the host was already told `ready` and no `error` ever followed it. A host
 * waiting for that message waited forever for a failure it was never told
 * about.
 *
 * `onError` is a plain callback rather than this component reaching for the
 * bridge itself, so it can be tested without a parent window to post to.
 */
export class StudioBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    this.props.onError?.(error);
  }

  render() {
    const { locale, dir, children } = this.props;
    if (this.state.failed) {
      return <Fallback code={ERROR_CODES.UNKNOWN} locale={locale} dir={dir} />;
    }
    return children;
  }
}

export default StudioBoundary;
