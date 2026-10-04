import cx from '@/lib/utils/cx';
import styles from './Logo.module.css';

/**
 * The INMORE mark: the "iM" monogram over its four process-colour bars.
 *
 * Drawn rather than loaded. The mark is geometry — a dot, two strokes with
 * round ends and one filled form — so it is described as that, takes its
 * colour from context like type does, and stays crisp at header size and
 * footer size alike.
 *
 * The bars are the one place this departs from the supplied artwork, and on
 * purpose: there they are a hairline under the mark, which at 40 px is less
 * than two pixels of colour. Here they are twice as heavy and run the full
 * width of the mark, so cyan, magenta, yellow and key read as part of the
 * logo rather than as a rule beneath it.
 */

const BARS = ['cyan', 'magenta', 'yellow', 'key'];
const BAR = { width: 215, height: 64, gap: 46, x: 152, y: 1073 };

export function Logo({ height = 40, title = 'INMORE', className }) {
  return (
    <svg
      className={cx(styles.logo, className)}
      viewBox="152 152 998 985"
      height={height}
      role="img"
      aria-label={title}
    >
      <g fill="currentColor">
        <circle cx="235" cy="233.5" r="82.5" />
        <path d="M316.5 640A30 30 0 0 0 369.5 658.7L370 720 316.5 740Z" />
        <path d="M993.1 185.2A88 88 0 0 1 1150 240V926A79.5 79.5 0 0 1 991 926V790A129 129 0 0 0 761 709.7L584.9 936.1A74 74 0 0 1 469.1 843.9Z" />
      </g>
      <g fill="none" stroke="currentColor" strokeLinecap="round">
        <path d="M234.5 426.5V922.5" strokeWidth="165" />
        <path d="M251 929 768 279" strokeWidth="151" />
      </g>

      {BARS.map((name, i) => (
        <rect
          key={name}
          className={cx(styles.bar, styles[name])}
          style={{ '--i': i }}
          x={BAR.x + i * (BAR.width + BAR.gap)}
          y={BAR.y}
          width={BAR.width}
          height={BAR.height}
          rx={BAR.height / 2}
        />
      ))}
    </svg>
  );
}

export default Logo;
