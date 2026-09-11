import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { Button as EngineButton } from '@inmore/engine';

/**
 * The site's button: the engine's, taught about routes.
 *
 * The engine's Button deliberately knows nothing about routing — it mounts in
 * host pages that have no router, and requiring one would be the engine
 * asserting something about a page it does not own. Routing is this app's
 * concern, so the `to` prop lives here and resolves to a react-router Link.
 */
export const Button = forwardRef(function Button({ to, ...props }, ref) {
  if (to) return <EngineButton ref={ref} as={Link} to={to} {...props} />;
  return <EngineButton ref={ref} {...props} />;
});

export default Button;
