import { forwardRef } from 'react';
import cx from '../utils/cx';
import styles from './IconButton.module.css';

/**
 * A button that is only an icon.
 *
 * The label is required rather than optional, because an icon on its own
 * names nothing to a screen reader — and it doubles as the tooltip, so a
 * pointer user who does not recognise the glyph can find out what it does.
 *
 * `glass` is for controls that float over the product, where a solid surface
 * would hide it and no surface at all would leave the icon unreadable against
 * whatever colour the stock happens to be.
 */
export const IconButton = forwardRef(function IconButton(
  { label, variant = 'plain', mirror = false, className, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      className={cx(styles.button, styles[variant], mirror && styles.mirror, className)}
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </button>
  );
});

export default IconButton;
