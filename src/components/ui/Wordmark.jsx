import styles from './Wordmark.module.css';

export function Wordmark({ height = 18, title = 'INMORE' }) {
  return (
    <span
      className={styles.wordmark}
      dir="ltr"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.55rem',
        lineHeight: 1,
        unicodeBidi: 'isolate',
      }}
    >
      <img
        src="/logo/inmore.png"
        alt=""
        aria-hidden="true"
        height={height}
        style={{
          display: 'block',
          width: 'auto',
          height: `${height}px`,
          objectFit: 'contain',
        }}
      />
      <span
        className={styles.text}
        aria-label={title}
        role="img"
        style={{
          fontSize: `${height * 0.72}px`,
          fontWeight: 600,
          letterSpacing: '0.2em',
        }}
      >
        INMORE
      </span>
    </span>
  );
}

export default Wordmark;
