import { useCopy } from '../i18n';
import styles from './LayerTabs.module.css';

/**
 * Which placed thing the placement controls act on. Shown only when there is
 * a choice to make — a logo alone, or one line of text alone, needs no tabs.
 */
export function LayerTabs({ layers, selectedId, onSelect }) {
  const t = useCopy().text;
  if (layers.length < 2) return null;

  return (
    <div className={styles.tabs} role="group" aria-label={t.layers}>
      {layers.map((layer) => (
        <button
          key={layer.id}
          type="button"
          className={styles.tab}
          aria-pressed={layer.id === selectedId}
          onClick={() => onSelect(layer.id)}
        >
          {layer.kind === 'image' ? t.logo : layer.text.content.split('\n')[0] || '—'}
        </button>
      ))}
    </div>
  );
}

export default LayerTabs;
