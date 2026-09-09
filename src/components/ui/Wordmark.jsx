/**
 * Provisional wordmark.
 *
 * Drawn as type rather than an image so it stays crisp and inherits colour
 * from context. Replace with the approved logo file once the brand system is
 * signed off — no other component references the mark directly.
 */
export function Wordmark({ height = 18, title = 'INMORE' }) {
  return (
    <span
      aria-label={title}
      role="img"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.06em',
        fontSize: `${height}px`,
        fontWeight: 600,
        letterSpacing: '0.28em',
        lineHeight: 1,
        textIndent: '0.28em',
      }}
    >
      INMORE
    </span>
  );
}

export default Wordmark;
