import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import cx from '@/lib/utils/cx';
import styles from './Button.module.css';

/**
 * One button, three jobs: real button, internal link, external link.
 * Consolidating them here keeps focus, disabled and sizing behaviour identical
 * wherever an action appears.
 */
export const Button = forwardRef(function Button(
  { as, to, href, variant = 'quiet', size = 'md', block, icon, className, children, ...props },
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

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

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
