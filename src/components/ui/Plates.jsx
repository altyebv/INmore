import cx from '@/lib/utils/cx';
import styles from './Plates.module.css';

/**
 * The colour bars that mark which half of the house you are looking at.
 *
 * Print is made of four inks — cyan, magenta, yellow and key, the bars under
 * the logo. A screen is made of three lights: red, green and blue. The same
 * small strip in either set says "this is the printed side" or "this is the
 * digital side" without a word, and ties both back to the mark.
 */

const SETS = {
  cmyk: ['cyan', 'magenta', 'yellow', 'key'],
  rgb: ['red', 'green', 'blue'],
};

export function Plates({ kind = 'cmyk', className }) {
  return (
    <span className={cx(styles.plates, className)} aria-hidden="true">
      {SETS[kind].map((name) => (
        <i key={name} className={styles[name]} />
      ))}
    </span>
  );
}

export default Plates;
