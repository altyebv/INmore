import { forwardRef } from 'react';
import cx from '../utils/cx';
import styles from './Button.module.css';

/**
 * One button, two jobs: a real button, or a link.
 *
 * Consolidating them keeps focus, disabled and sizing behaviour identical
 * wherever an action appears.
 *
 * It used to take a `to` and render a react-router `<Link>`, which meant the
 * engine could not be mounted without a Router above it — a router the host
 * page may not have, and has no reason to. Routing is the host's concern: it
 * passes `as` when it wants a link component of its own, and the engine never
 * learns what a route is.
 */
export const Button = forwardRef(function Button(
  { as, href, variant = 'quiet', size = 'md', block, icon, className, children, ...props },
  ref
) {
  const classes = cx(
    styles.base,
    styles[variant],
    size !== 'md' && styles[size],
    icon && styles.icon,
    block && styles.block,
    className
  );

  if (href) {
    return (
      <a
        ref={ref}
        href={href}
        className={classes}
        rel={props.target === '_blank' ? 'noopener noreferrer' : undefined}
        {...props}
      >
        {children}
      </a>
    );
  }

  const Component = as ?? 'button';
  return (
    <Component ref={ref} className={classes} type={Component === 'button' ? 'button' : undefined} {...props}>
      {children}
    </Component>
  );
});

export default Button;
