// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import StudioRoot, { studioUtils } from './StudioRoot';

/**
 * The studio's styling boundary.
 *
 * These assertions are about the *contract*, not about how anything looks:
 * jsdom applies no stylesheet, so nothing here can tell you the studio is
 * pretty. What it can tell you is that the studio writes its tokens onto its
 * own element and nowhere else, that a tenant's branding reaches that element
 * as data, and that two studios on one page can be branded differently — which
 * was impossible while the tokens lived on `:root`.
 *
 * Whether the result still looks like INMORE is a question for a screenshot,
 * and was answered with one.
 */

afterEach(cleanup);

const read = (el, prop) => el.style.getPropertyValue(prop);

describe('the studio root', () => {
  it('writes nothing onto the document', () => {
    render(<StudioRoot branding={{ ink: '#123456' }}>studio</StudioRoot>);

    expect(document.documentElement.style.getPropertyValue('--studio-ink')).toBe('');
    expect(document.body.style.getPropertyValue('--studio-ink')).toBe('');
  });

  it('carries the tenant brand on its own element', () => {
    const { container } = render(
      <StudioRoot branding={{ ink: '#101010', paper: '#fafafa', accent: '#ff5500' }}>
        studio
      </StudioRoot>
    );
    const root = container.firstChild;

    expect(read(root, '--studio-ink')).toBe('#101010');
    expect(read(root, '--studio-paper')).toBe('#fafafa');
    expect(read(root, '--studio-accent')).toBe('#ff5500');
  });

  it('omits what the tenant did not set, rather than writing undefined over it', () => {
    const { container } = render(<StudioRoot branding={{ accent: '#ff5500' }}>x</StudioRoot>);
    const root = container.firstChild;

    expect(read(root, '--studio-accent')).toBe('#ff5500');
    // An empty string here means the stylesheet default survives.
    expect(read(root, '--studio-ink')).toBe('');
    expect(read(root, '--studio-font')).toBe('');
  });

  it('renders with no branding at all', () => {
    const { container } = render(<StudioRoot>bare</StudioRoot>);
    expect(container.firstChild.getAttribute('style')).toBeFalsy();
    expect(screen.getByText('bare')).toBeTruthy();
  });

  it('lets a tenant write raw tokens for a ramp no rule would derive', () => {
    const { container } = render(
      <StudioRoot branding={{ ink: '#0b0b0a', tokens: { '--ink-800': '#121211' } }}>
        x
      </StudioRoot>
    );
    const root = container.firstChild;

    expect(read(root, '--studio-ink')).toBe('#0b0b0a');
    expect(read(root, '--ink-800')).toBe('#121211');
  });

  it('lets a raw token win over the named field it would otherwise derive from', () => {
    const { container } = render(
      <StudioRoot branding={{ radius: '10px', tokens: { '--radius-lg': '2px' } }}>x</StudioRoot>
    );
    expect(read(container.firstChild, '--radius-lg')).toBe('2px');
  });
});

describe('locale and direction', () => {
  it('carries them on itself, not on the document', () => {
    const { container } = render(
      <StudioRoot locale="ar" dir="rtl">
        x
      </StudioRoot>
    );
    const root = container.firstChild;

    expect(root.getAttribute('data-locale')).toBe('ar');
    expect(root.getAttribute('dir')).toBe('rtl');
    // The studio does not own the page it is mounted in.
    expect(document.documentElement.getAttribute('dir')).not.toBe('rtl');
  });

  it('defaults to English, left to right', () => {
    const { container } = render(<StudioRoot>x</StudioRoot>);
    expect(container.firstChild.getAttribute('data-locale')).toBe('en');
    expect(container.firstChild.getAttribute('dir')).toBe('ltr');
  });
});

describe('the host tells the studio what is above it', () => {
  it('takes an inset when the host has a header', () => {
    const { container } = render(
      <StudioRoot insetBlockStart="4.5rem">x</StudioRoot>
    );
    expect(read(container.firstChild, '--studio-inset-block-start')).toBe('4.5rem');
  });

  it('assumes nothing is above it by default', () => {
    const { container } = render(<StudioRoot>x</StudioRoot>);
    expect(read(container.firstChild, '--studio-inset-block-start')).toBe('');
  });
});

/**
 * The property the move off `:root` was for.
 */
describe('two studios on one page', () => {
  it('can be branded differently', () => {
    const { container } = render(
      <>
        <StudioRoot branding={{ accent: '#ff0000' }}>left</StudioRoot>
        <StudioRoot branding={{ accent: '#0000ff' }}>right</StudioRoot>
      </>
    );
    const [left, right] = container.children;

    expect(read(left, '--studio-accent')).toBe('#ff0000');
    expect(read(right, '--studio-accent')).toBe('#0000ff');
  });

  it('can be in two languages at once', () => {
    const { container } = render(
      <>
        <StudioRoot locale="en" dir="ltr">left</StudioRoot>
        <StudioRoot locale="ar" dir="rtl">right</StudioRoot>
      </>
    );
    const [left, right] = container.children;

    expect(left.getAttribute('dir')).toBe('ltr');
    expect(right.getAttribute('dir')).toBe('rtl');
  });
});

describe('the scoped utilities', () => {
  it('are hashed module classes, not global names', () => {
    for (const [name, value] of Object.entries(studioUtils)) {
      expect(value, name).toBeTruthy();
      expect(value, name).not.toMatch(/^u-/);
    }
  });

  it('cover every global utility the studio used to reach for', () => {
    expect(Object.keys(studioUtils).sort()).toEqual([
      'label',
      'ltr',
      'shell',
      'visuallyHidden',
    ]);
  });
});
