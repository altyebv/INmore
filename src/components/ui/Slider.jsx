import { useId } from 'react';
import styles from './Slider.module.css';

/**
 * Labelled range input with a live readout.
 *
 * `onChange` fires continuously while dragging; `onCommit` fires once the
 * interaction ends, which is what the studio records in its undo history.
 */
export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  onCommit,
  format = (v) => v,
  disabled,
  ...props
}) {
  const id = useId();

  return (
    <div className={styles.field}>
      <div className={styles.header}>
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
        <output className={styles.value} htmlFor={id}>
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        className={styles.input}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        onPointerUp={() => onCommit?.()}
        onKeyUp={() => onCommit?.()}
        {...props}
      />
    </div>
  );
}

export default Slider;
