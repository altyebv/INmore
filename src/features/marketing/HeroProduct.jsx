import HeroShowcase from './HeroShowcase';

/**
 * The hero product block.
 *
 * Delegates to HeroShowcase, which cycles through all live products with
 * animated colour and model transitions. Kept as a thin wrapper so call-sites
 * in Home.jsx don't need to change.
 */
export function HeroProduct({ className }) {
  return <HeroShowcase className={className} />;
}

export default HeroProduct;
