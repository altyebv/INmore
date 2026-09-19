import { useEffect, useMemo } from 'react';
import Button from '../ui/Button';
import IconButton from '../ui/IconButton';
import { AlignIcon, PlusIcon, TrashIcon } from '../ui/icons';
import { useAssetBase } from '../assets';
import { ensureFonts, useFontVersion } from '../artwork/fonts';
import { TEXT_ALIGNMENTS } from '../artwork/text';
import { useCopy, useStudioLocale, localize } from '../i18n';
import cx from '../utils/cx';
import { studioUtils } from '../StudioRoot';
import styles from './TextControls.module.css';

/**
 * Add text, choose its font and colour, and set how it is aligned.
 *
 * Where it sits and how big it is are the placement controls' job — the same
 * sliders and the same drag that move a logo — so this panel only decides what
 * the text *is*. Selecting a line here selects it there.
 *
 * Typing is recorded as one undo step, not one per keystroke: each change goes
 * in flight, and the field's `blur` commits it.
 */
export function TextControls({
  texts,
  selectedId,
  settings,
  onAdd,
  onSelect,
  onUpdate,
  onRemove,
}) {
  const t = useCopy().text;
  const { locale, isRTL } = useStudioLocale();
  const assetBase = useAssetBase();
  useFontVersion();

  // Load every face up front: the picker shows each name in its own type.
  useEffect(() => {
    ensureFonts(settings.fonts, assetBase);
  }, [settings.fonts, assetBase]);

  // A studio in Arabic offers the faces that can set Arabic first.
  const fonts = useMemo(() => {
    if (!isRTL) return settings.fonts;
    const arabic = (font) => font.script === 'arabic' || font.script === 'both';
    return [...settings.fonts].sort((a, b) => Number(arabic(b)) - Number(arabic(a)));
  }, [settings.fonts, isRTL]);

  const active = texts.find((layer) => layer.id === selectedId) ?? texts[texts.length - 1];
  const atLimit = texts.length >= settings.maxLayers;

  if (!texts.length) {
    return (
      <div className={styles.empty}>
        <p className={styles.hint}>{t.hint}</p>
        <Button size="sm" onClick={() => onAdd()}>
          <PlusIcon />
          {t.add}
        </Button>
      </div>
    );
  }

  const commit = () => onUpdate(active.id, {}, true);

  return (
    <div className={styles.controls}>
      <div className={styles.lines} role="group" aria-label={t.lines}>
        {texts.map((layer, index) => (
          <button
            key={layer.id}
            type="button"
            className={styles.line}
            aria-pressed={layer.id === active.id}
            onClick={() => onSelect(layer.id)}
          >
            <span className={styles.lineIndex}>{index + 1}</span>
            <span className={styles.lineText}>{layer.content.split('\n')[0] || '—'}</span>
          </button>
        ))}
        <IconButton
          label={atLimit ? t.limit : t.addAnother}
          onClick={() => onAdd()}
          disabled={atLimit}
        >
          <PlusIcon />
        </IconButton>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>{t.content}</span>
        <textarea
          className={styles.input}
          rows={2}
          dir="auto"
          value={active.content}
          maxLength={settings.maxLength}
          placeholder={t.placeholder}
          onChange={(event) => onUpdate(active.id, { content: event.target.value }, false)}
          onBlur={commit}
        />
      </label>

      <div className={styles.field}>
        <span className={styles.label}>{t.font}</span>
        <div className={styles.fonts} role="radiogroup" aria-label={t.font}>
          {fonts.map((font) => (
            <button
              key={font.id}
              type="button"
              role="radio"
              aria-checked={font.id === active.fontId}
              className={styles.font}
              onClick={() => onUpdate(active.id, { fontId: font.id }, true)}
            >
              <span
                className={styles.sample}
                style={{ fontFamily: font.stack, fontWeight: font.weight, fontStyle: font.style }}
              >
                {t.sample}
              </span>
              <span className={styles.fontName}>{localize(font.label, locale)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <span className={styles.label}>{t.color}</span>
        <div className={styles.swatches} role="group" aria-label={t.color}>
          {settings.colors.map((color) => (
            <button
              key={color}
              type="button"
              className={styles.swatch}
              style={{ '--swatch': color }}
              aria-pressed={color.toLowerCase() === active.color.toLowerCase()}
              aria-label={color}
              title={color}
              onClick={() => onUpdate(active.id, { color }, true)}
            />
          ))}
          {settings.allowCustomColor && (
            <label className={styles.custom} title={t.customColor}>
              <PlusIcon size="0.9em" />
              <span className={studioUtils.visuallyHidden}>{t.customColor}</span>
              <input
                type="color"
                className={styles.customInput}
                value={active.color}
                onChange={(event) => onUpdate(active.id, { color: event.target.value }, false)}
                onBlur={commit}
              />
            </label>
          )}
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.aligns} role="group" aria-label={t.align}>
          {TEXT_ALIGNMENTS.map((align) => {
            const label = t[`align${align[0].toUpperCase()}${align.slice(1)}`];
            return (
              <IconButton
                key={align}
                label={label}
                aria-pressed={active.align === align}
                className={cx(active.align === align && styles.on)}
                onClick={() => onUpdate(active.id, { align }, true)}
              >
                <AlignIcon align={align} />
              </IconButton>
            );
          })}
        </div>
        <Button size="sm" variant="ghost" onClick={() => onRemove(active.id)}>
          <TrashIcon />
          {t.remove}
        </Button>
      </div>
    </div>
  );
}

export default TextControls;
