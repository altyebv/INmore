import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Button from './ui/Button';
import cx from './utils/cx';
import ArtworkControls from './components/ArtworkControls';
import ArtworkDropzone from './components/ArtworkDropzone';
import FlatPreview from './components/FlatPreview';
import ProductPicker from './components/ProductPicker';
import StockPicker from './components/StockPicker';
import StudioStage from './components/StudioStage';
import StudioSheet from './components/StudioSheet';
import StudioProvider, { useStudio } from './state/StudioProvider';
import StudioRoot, { studioUtils } from './StudioRoot';
import useArtworkTexture from './three/useArtworkTexture';
import exportProof from './artwork/exportProof';
import buildSubmitPayload from './artwork/submitPayload';
import { AssetProvider } from './assets';
import { localizeProduct } from './catalogue';
import { LicenseProvider, permissiveLicense, useLicense } from './license';
import {
  CopyProvider,
  LocaleContextProvider,
  directionFor,
  resolveCopy,
  useCopy,
  useStudioLocale,
} from './i18n';
import { COMPACT_WIDTH, SIDE_PANEL_RATIO, useElementShape } from './utils/useElementShape';
import styles from './Studio.module.css';

/**
 * Shared behaviour for both layouts.
 *
 * Texture generation, keyboard shortcuts and proof export belong to the studio
 * regardless of how it is arranged on screen, so they live here and the two
 * layout components below only decide where things sit.
 */
function useStudioSession({ rootRef, onSubmit, onEvent, tenant }) {
  const studio = useStudio();
  const { locale } = useStudioLocale();
  const product = useMemo(
    () => localizeProduct(studio.product, locale),
    [studio.product, locale]
  );

  const { texture } = useArtworkTexture(
    studio.product,
    studio.artwork,
    studio.transform,
    studio.baseColor
  );

  /*
   * Undo listens on the studio's own element, not on `window`.
   *
   * On the standalone site the difference is invisible. In a host page it is
   * the difference between Ctrl+Z undoing the visitor's logo placement and
   * Ctrl+Z undoing whatever they were typing in the page's own form — and with
   * two studios mounted, a window listener would have both of them undo at
   * once.
   */
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return undefined;

    const onKey = (event) => {
      const modifier = event.metaKey || event.ctrlKey;
      if (!modifier || event.key.toLowerCase() !== 'z') return;
      event.preventDefault();
      if (event.shiftKey) studio.redo();
      else studio.undo();
    };

    node.addEventListener('keydown', onKey);
    return () => node.removeEventListener('keydown', onKey);
  }, [rootRef, studio]);

  const exportCurrentProof = useCallback(() => {
    onEvent?.('proof:download', { sku: studio.product.id });
    return exportProof(studio.product, studio.artwork, studio.transform, {
      stockColor: studio.baseColor,
    });
  }, [studio.product, studio.artwork, studio.transform, studio.baseColor, onEvent]);

  const submit = useCallback(() => {
    const payload = buildSubmitPayload({
      tenant,
      locale,
      product: studio.product,
      artwork: studio.artwork,
      transform: studio.transform,
      baseColor: studio.baseColor,
    });
    onEvent?.('submit', { sku: payload.sku });
    onSubmit?.(payload);
    return payload;
  }, [tenant, locale, studio.product, studio.artwork, studio.transform, studio.baseColor, onSubmit, onEvent]);

  return {
    ...studio,
    product,
    texture,
    exportCurrentProof,
    submit,
    commit: () => studio.setTransform({}, true),
  };
}

function Step({ index, title, children }) {
  return (
    <section className={styles.step}>
      <header className={styles.stepHeader}>
        <span className={styles.stepIndex}>{index}</span>
        <h2 className={styles.stepTitle}>{title}</h2>
        <span className={styles.stepRule} aria-hidden="true" />
      </header>
      {children}
    </section>
  );
}

function Specs({ product, className }) {
  if (!product.specs?.length) return null;
  return (
    <div className={className ?? styles.specs}>
      {product.specs.map((spec) => (
        <div key={spec.label} className={styles.spec}>
          <span>{spec.label}</span>
          <span className={styles.specValue}>{spec.value}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * The call to action.
 *
 * The engine knows when a configuration is finished; it does not know what
 * should happen next. On the standalone site that is a link to a contact page,
 * in an embed it is a postMessage to the host's basket, and in a third place
 * it will be something else again. So the host supplies the control, and gets
 * the payload when it asks for one.
 */
function Cta({ session, renderCta, block, size }) {
  const { unlicensed } = useLicense();
  if (!renderCta) return null;
  return renderCta({ submit: session.submit, disabled: unlicensed, block, size });
}

/* --- Pointer layout --------------------------------------------------------- */

function PointerStudio({ session: s, renderCta }) {
  const t = useCopy();

  return (
    <div className={cx(styles.workspace, studioUtils.shell)}>
      <div className={styles.viewer}>
        <StudioStage
          product={s.product}
          texture={s.texture}
          baseColor={s.baseColor}
          autoRotate={s.autoRotate}
          onInteract={() => s.toggleAutoRotate(false)}
          onExport={s.exportCurrentProof}
          canExport={Boolean(s.artwork)}
        />
      </div>

      <aside className={styles.panel} aria-label={t.panelLabel}>
        <Step index="01" title={t.steps.product}>
          <ProductPicker selectedId={s.product.id} onSelect={s.selectProduct} />
        </Step>

        <Step index="02" title={t.stock.step}>
          <StockPicker product={s.product} value={s.baseColor} onChange={s.setBaseColor} />
        </Step>

        <Step index="03" title={t.steps.artwork}>
          <ArtworkDropzone
            artwork={s.artwork}
            status={s.status}
            error={s.error}
            onUpload={s.uploadArtwork}
            onClear={s.clearArtwork}
          />
        </Step>

        <Step index="04" title={t.steps.placement}>
          <FlatPreview
            product={s.product}
            artwork={s.artwork}
            transform={s.transform}
            baseColor={s.baseColor}
            onTransform={s.setTransform}
            onCommit={s.commit}
          />
          <ArtworkControls
            product={s.product}
            artwork={s.artwork}
            transform={s.transform}
            onTransform={s.setTransform}
            onCommit={s.commit}
            onReset={s.resetTransform}
          />
          <div className={styles.historyRow}>
            <Button size="sm" variant="ghost" onClick={s.undo} disabled={!s.canUndo}>
              {t.undo}
            </Button>
            <Button size="sm" variant="ghost" onClick={s.redo} disabled={!s.canRedo}>
              {t.redo}
            </Button>
          </div>
        </Step>

        <Specs product={s.product} />

        <div className={styles.cta}>
          <Cta session={s} renderCta={renderCta} block />
        </div>
      </aside>
    </div>
  );
}

/* --- Touch layout ----------------------------------------------------------- */

function TouchStudio({ session: s, renderCta, sidePanel }) {
  const t = useCopy();
  const { isRTL } = useStudioLocale();

  const [tab, setTab] = useState('product');
  const [snap, setSnap] = useState('peek');

  // Uploading is the moment the visitor's attention moves to placement, so the
  // sheet follows them there instead of making them find the next step.
  useEffect(() => {
    if (s.artwork) {
      setTab('placement');
      setSnap('half');
    }
  }, [s.artwork]);

  const openTab = useCallback((next) => {
    setTab(next);
    setSnap((current) => (current === 'peek' ? 'half' : current));
  }, []);

  const tabs = [
    { id: 'product', label: t.tabs.product, complete: true },
    { id: 'artwork', label: t.tabs.artwork, complete: Boolean(s.artwork) },
    { id: 'placement', label: t.tabs.placement, disabled: !s.artwork },
  ];

  return (
    <div className={cx(styles.shell, sidePanel && styles.shellSide)}>
      <div className={styles.shellViewer}>
        <StudioStage
          product={s.product}
          texture={s.texture}
          baseColor={s.baseColor}
          autoRotate={s.autoRotate}
          onInteract={() => s.toggleAutoRotate(false)}
          onExport={s.exportCurrentProof}
          canExport={Boolean(s.artwork)}
          compact
        />
      </div>

      <StudioSheet
        tabs={tabs}
        activeTab={tab}
        onTabChange={openTab}
        snap={snap}
        onSnapChange={setSnap}
        gripLabel={t.sheetHandle}
        edge={sidePanel ? 'inline-end' : 'bottom'}
        rtl={isRTL}
        footer={
          tab === 'placement' && s.artwork ? (
            <>
              <Button size="sm" onClick={s.undo} disabled={!s.canUndo}>
                {t.undo}
              </Button>
              <Button size="sm" onClick={s.redo} disabled={!s.canRedo}>
                {t.redo}
              </Button>
              <Button size="sm" variant="primary" onClick={s.exportCurrentProof}>
                {t.downloadProof}
              </Button>
            </>
          ) : (
            <Cta session={s} renderCta={renderCta} block size="sm" />
          )
        }
      >
        {tab === 'product' && (
          <div className={styles.sheetStep}>
            <ProductPicker selectedId={s.product.id} onSelect={s.selectProduct} />
            <p className={styles.sheetHint}>{s.product.summary}</p>
            <StockPicker product={s.product} value={s.baseColor} onChange={s.setBaseColor} />
            <Specs product={s.product} />
          </div>
        )}

        {tab === 'artwork' && (
          <div className={styles.sheetStep}>
            <ArtworkDropzone
              artwork={s.artwork}
              status={s.status}
              error={s.error}
              onUpload={s.uploadArtwork}
              onClear={s.clearArtwork}
              compact
            />
          </div>
        )}

        {tab === 'placement' && (
          <div className={styles.sheetStep}>
            <FlatPreview
              product={s.product}
              artwork={s.artwork}
              transform={s.transform}
              baseColor={s.baseColor}
              onTransform={s.setTransform}
              onCommit={s.commit}
            />
            <ArtworkControls
              product={s.product}
              artwork={s.artwork}
              transform={s.transform}
              onTransform={s.setTransform}
              onCommit={s.commit}
              onReset={s.resetTransform}
            />
          </div>
        )}
      </StudioSheet>
    </div>
  );
}

/** Chooses a layout from the room it has, then renders it. */
function StudioBody({ shape, rootRef, renderCta, onSubmit, onEvent, tenant }) {
  const session = useStudioSession({ rootRef, onSubmit, onEvent, tenant });

  return shape.compact ? (
    <TouchStudio session={session} renderCta={renderCta} sidePanel={shape.sidePanel} />
  ) : (
    <PointerStudio session={session} renderCta={renderCta} />
  );
}

/**
 * The configurator.
 *
 * Everything tenant-specific arrives as a prop. The engine fetches nothing
 * from a host it chose, reads no global state, writes to no element it does
 * not own, and holds no opinion about what happens after a visitor is
 * finished. Two of these on one page do not interfere.
 *
 * @param {{
 *   catalogue: import('./catalogue').Catalogue,
 *   branding?: import('./StudioRoot').Branding,
 *   sku?: string,
 *   locale?: string,
 *   dir?: 'ltr'|'rtl',
 *   assetBase?: string,
 *   license?: import('./license').License,
 *   copy?: object,
 *   tenant?: string,
 *   fullscreen?: boolean,
 *   insetBlockStart?: string,
 *   className?: string,
 *   renderCta?: (api: { submit: () => object, disabled: boolean }) => React.ReactNode,
 *   onSubmit?: (payload: object) => void,
 *   onEvent?: (name: string, data: object) => void,
 * }} props
 */
export function Studio({
  catalogue,
  branding,
  sku,
  locale = 'en',
  dir,
  assetBase = '',
  dracoPath,
  license = permissiveLicense,
  copy,
  tenant = 'unknown',
  fullscreen = false,
  insetBlockStart,
  className,
  renderCta,
  onSubmit,
  onEvent,
}) {
  const rootRef = useRef(null);

  /*
   * The layout is chosen from the studio's own width, not the viewport's.
   *
   * A viewport query is right exactly once: when the studio is the page. Put
   * it in a 600 px column on a wide desktop and a viewport query picks the
   * pointer layout, which then overflows its container. What matters is the
   * room the studio actually has.
   */
  const shape = useElementShape(rootRef);

  const resolvedDir = dir ?? directionFor(locale);
  const resolvedCopy = useMemo(() => resolveCopy(locale, copy), [locale, copy]);
  const localeValue = useMemo(
    () => ({ locale, dir: resolvedDir, isRTL: resolvedDir === 'rtl' }),
    [locale, resolvedDir]
  );

  return (
    <StudioRoot
      ref={rootRef}
      branding={branding}
      locale={locale}
      dir={resolvedDir}
      insetBlockStart={insetBlockStart}
      className={className}
      data-fullscreen={fullscreen ? '' : undefined}
      tabIndex={-1}
    >
      <LocaleContextProvider value={localeValue}>
        <CopyProvider value={resolvedCopy}>
          <AssetProvider assetBase={assetBase} dracoPath={dracoPath}>
            <LicenseProvider value={license}>
              <StudioProvider catalogue={catalogue} initialProductId={sku}>
                <StudioBody
                  shape={shape}
                  rootRef={rootRef}
                  renderCta={renderCta}
                  onSubmit={onSubmit}
                  onEvent={onEvent}
                  tenant={tenant}
                />
              </StudioProvider>
            </LicenseProvider>
          </AssetProvider>
        </CopyProvider>
      </LocaleContextProvider>
    </StudioRoot>
  );
}

export { COMPACT_WIDTH, SIDE_PANEL_RATIO };
export default Studio;
