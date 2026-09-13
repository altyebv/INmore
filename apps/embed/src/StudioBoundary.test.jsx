// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { StudioBoundary } from './StudioBoundary';

/**
 * The failure this guards against never threw before render: a config that
 * passes validation but describes something the engine chokes on (a mismatch
 * the schema does not check, a model the loader cannot parse) used to unmount
 * to a blank iframe with `resolveTenant` having already told the host `ready`.
 * `error` never followed. These tests are about that promise: something
 * always renders, and the host is always told.
 */

afterEach(cleanup);

function Bomb() {
  throw new Error('the engine choked');
}

describe('StudioBoundary', () => {
  it('renders its children when nothing fails', () => {
    render(
      <StudioBoundary locale="en" dir="ltr">
        <p>the studio</p>
      </StudioBoundary>
    );
    expect(screen.getByText('the studio')).toBeTruthy();
  });

  it('shows the generic fallback instead of a blank frame when a child throws', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      render(
        <StudioBoundary locale="en" dir="ltr">
          <Bomb />
        </StudioBoundary>
      );
      expect(screen.getByRole('status')).toBeTruthy();
      expect(screen.queryByText('the studio')).toBeNull();
    } finally {
      quiet.mockRestore();
    }
  });

  it('reports the failure so the host is not left guessing', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onError = vi.fn();
    try {
      render(
        <StudioBoundary locale="en" dir="ltr" onError={onError}>
          <Bomb />
        </StudioBoundary>
      );
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError.mock.calls[0][0].message).toBe('the engine choked');
    } finally {
      quiet.mockRestore();
    }
  });
});
