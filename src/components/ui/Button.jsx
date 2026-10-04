import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import cx from '@/lib/utils/cx';
import { localizePath, useLocale } from '@/i18n';
import styles from './Button.module.css';

/**
 * One button, three jobs: a real button, an external link, or a route link.
 *
 * Keeping them in one component keeps focus, disabled and sizing behaviour
 * identical wherever an action appears. Pass `to` for a router link, `href`
 * for a plain anchor, or `as` to render a component of your own.
 */
export const Button = forwardRef(function Button(
  { as, to, href, variant = 'quiet', size = 'md', block, icon, className, children, ...props },
  ref
) {
  const { locale } = useLocale();
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
      <Link ref={ref} to={localizePath(to, locale)} className={classes} {...props}>
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
