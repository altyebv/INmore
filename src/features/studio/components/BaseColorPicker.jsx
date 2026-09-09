import styles from './BaseColorPicker.module.css';

/**
 * A set of preset swatches that sets the unprinted stock colour of the model.
 *
 * The selected colour is stored in studio state and piped through to the
 * proxy geometry and the GLB material so the whole surface updates instantly.
 */

const PRESETS = [
  { label: 'Natural white',  color: '#f7f5f1' },
  { label: 'Kraft brown',    color: '#c8a96e' },
  { label: 'Slate grey',     color: '#9aa4ae' },
  { label: 'Midnight',       color: '#1e2328' },
  { label: 'Blush',          color: '#e8c4b0' },
  { label: 'Sage',           color: '#a8b89a' },
  { label: 'Sand',           color: '#d4c4a0' },
  { label: 'Terracotta',     color: '#c47858' },
];

export function BaseColorPicker({ value, onChange }) {
  return (
    <div className={styles.root}>
      <div className={styles.swatches} role="group" aria-label="Base colour">
        {PRESETS.map(({ label, color }) => (
          <button
            key={color}
            type="button"
            className={styles.swatch}
            aria-label={label}
            aria-pressed={value === color}
            style={{ '--swatch-color': color }}
            onClick={() => onChange(color)}
          />
        ))}

        {/* Native colour input as the last option, giving full freedom */}
        <label className={styles.customLabel} aria-label="Custom colour">
          <input
            type="color"
            className={styles.customInput}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          <span className={styles.customIcon} style={{ '--swatch-color': value }} />
        </label>
      </div>
    </div>
  );
}

export default BaseColorPicker;
