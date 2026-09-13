import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import Button from './ui/Button';
import IconButton from './ui/IconButton';
import {
  ChevronIcon,
  DownloadIcon,
  InfoIcon,
  MoveIcon,
  RedoIcon,
  UndoIcon,
  UploadIcon,
} from './ui/icons';
import cx from './utils/cx';
import ArtworkControls from './components/ArtworkControls';
import ArtworkDropzone from './components/ArtworkDropzone';
import FlatPreview from './components/FlatPreview';
import ProductDetails from './components/ProductDetails';
import ProductPicker from './components/ProductPicker';
import StockPicker, { useStockName } from './components/StockPicker';
import StudioDrawer from './components/StudioDrawer';
import StudioStage from './components/StudioStage';
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
import { COMPACT_WIDTH, useElementShape } from './utils/useElementShape';
import styles from './Studio.module.css';

/**
 * Shared behaviour for both layouts.
 *
 * Texture generation, keyboard shortcuts, proof export and what the host is
 * told belong to the studio regardless of how it is arranged on screen, so
 * they live here and the two layout components below only decide where
 * things sit.
 */
function useStudioSession({ rootRef, apiRef, onSubmit, onEvent, tenant, showPicker }) {
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

  const buildPayload = useCallback(
    () =>
      buildSubmitPayload({
        tenant,
        locale,
        product: studio.product,
        artwork: studio.artwork,
        transform: studio.transform,
        baseColor: studio.baseColor,
      }),
    [tenant, locale, studio.product, studio.artwork, studio.transform, studio.baseColor]
  );

  const submit = useCallback(() => {
    const payload = buildPayload();
    onEvent?.('submit', { sku: payload.sku });
    onSubmit?.(payload);
    return payload;
  }, [buildPayload, onSubmit, onEvent]);

  /*
   * Tell the host when the visitor changes product.
   *
   * A host that sets `sku` needs to know when the visitor has moved on from
   * it: that is how it keeps its own copy in step, and so how a later request
   * for the original product is a change the studio acts on rather than a
   * repeat of a value it already holds. Not reported for the product the
   * studio opened on — the host chose that one.
   */
  const reportedProduct = useRef(studio.product.id);
  useEffect(() => {
    if (reportedProduct.current === studio.product.id) return;
    reportedProduct.current = studio.product.id;
    onEvent?.('product:select', { sku: studio.product.id });
  }, [studio.product.id, onEvent]);

  /*
   * What a host can ask for without the visitor pressing anything — the
   * embed's `requestState()`. The same payload a submit produces, so a host
   * never reconciles two descriptions of one configuration.
   */
  useImperativeHandle(apiRef, () => ({ getState: buildPayload }), [buildPayload]);

  return {
    ...studio,
    product,
    texture,
    exportCurrentProof,
    submit,
    commit: () => studio.setTransform({}, true),
    showPicker,
  };
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

function HistoryButtons({ session: s, variant }) {
  const t = useCopy();
  return (
    <>
      <IconButton label={t.undo} variant={variant} mirror onClick={s.undo} disabled={!s.canUndo}>
        <UndoIcon />
      </IconButton>
      <IconButton label={t.redo} variant={variant} mirror onClick={s.redo} disabled={!s.canRedo}>
        <RedoIcon />
      </IconButton>
    </>
  );
}

/**
 * The print area, and the controls that move artwork within it.
 *
 * With no artwork there is nothing to position, so the controls are left out
 * rather than shown disabled — five dead sliders are the tallest possible way
 * of saying "not yet" — and the empty print area says what it is waiting for.
 */
function Placement({ session: s }) {
  const t = useCopy();
  return (
    <>
      <FlatPreview
        product={s.product}
        artwork={s.artwork}
        transform={s.transform}
        baseColor={s.baseColor}
        onTransform={s.setTransform}
        onCommit={s.commit}
      />
      {s.artwork ? (
        <ArtworkControls
          product={s.product}
          artwork={s.artwork}
          transform={s.transform}
          onTransform={s.setTransform}
          onCommit={s.commit}
          onReset={s.resetTransform}
          showGuidance={false}
        />
      ) : (
        <p className={styles.empty}>{t.placementEmpty}</p>
      )}
    </>
  );
}

function ProductSwitcher({ session: s }) {
  return <ProductPicker selectedId={s.product.id} onSelect={s.selectProduct} />;
}

/* --- Pointer layout --------------------------------------------------------- */

function Section({ index, title, meta, children }) {
  return (
    <section className={styles.section}>
      <header className={styles.sectionHeader}>
        <span className={styles.sectionIndex}>{index}</span>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <span className={styles.sectionRule} aria-hidden="true" />
        {meta && <span className={styles.sectionMeta}>{meta}</span>}
      </header>
      {children}
    </section>
  );
}

/**
 * The product beside a panel.
 *
 * The panel is built to fit rather than to scroll. It carries only what a
 * visitor changes — stock, artwork, placement — in that order; which product
 * to look at lives on the stage, history and the proof download sit over the
 * product they act on, and reference material waits behind a disclosure.
 */
function PointerStudio({ session: s, renderCta }) {
  const t = useCopy();
  const stockName = useStockName(s.product, s.baseColor);

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
          header={s.showPicker && <ProductSwitcher session={s} />}
          actions={<HistoryButtons session={s} variant="glass" />}
        />
      </div>

      <aside className={styles.panel} aria-label={t.panelLabel}>
        <div className={styles.panelBody}>
          <Section index="01" title={t.sections.stock} meta={stockName}>
            <StockPicker
              product={s.product}
              value={s.baseColor}
              onChange={s.setBaseColor}
              caption={false}
            />
          </Section>

          <Section index="02" title={t.sections.artwork}>
            <ArtworkDropzone
              artwork={s.artwork}
              status={s.status}
              error={s.error}
              onUpload={s.uploadArtwork}
              onClear={s.clearArtwork}
            />
          </Section>

          <Section index="03" title={t.sections.placement}>
            <Placement session={s} />
          </Section>

          <details className={styles.details}>
            <summary className={styles.detailsSummary}>
              <span>{t.sections.details}</span>
              <ChevronIcon className={styles.detailsChevron} />
            </summary>
            <div className={styles.detailsBody}>
              <ProductDetails product={s.product} />
            </div>
          </details>
        </div>

        {renderCta && (
          <div className={styles.panelFooter}>
            <Cta session={s} renderCta={renderCta} block />
          </div>
        )}
      </aside>
    </div>
  );
}

/* --- Touch layout ----------------------------------------------------------- */

/**
 * The product on the whole stage, with its controls in a drawer at the side.
 * See `StudioDrawer` for the states and why the product gets the screen.
 */
function TouchStudio({ session: s, renderCta }) {
  const t = useCopy();
  const { isRTL } = useStudioLocale();

  // The shell's own shape, since the root is zero pixels tall when pinned.
  const shellRef = useRef(null);
  const shape = useElementShape(shellRef);

  const [section, setSection] = useState('stock');
  const [mode, setMode] = useState('peek');

  /*
   * Uploading is the moment attention moves to placement, so the drawer
   * follows the visitor there rather than making them find the next step.
   * Only on a new upload: arriving in this layout with artwork already placed
   * — a window narrowed past the breakpoint — opens nothing by itself.
   */
  const seenArtwork = useRef(s.artwork);
  useEffect(() => {
    if (s.artwork === seenArtwork.current) return;
    seenArtwork.current = s.artwork;
    if (s.artwork) {
      setSection('placement');
      setMode('open');
    } else {
      setSection((current) => (current === 'placement' ? 'artwork' : current));
    }
  }, [s.artwork]);

  const sections = [
    {
      id: 'stock',
      label: t.rail.stock,
      title: t.sections.stock,
      icon: <span className={styles.railSwatch} style={{ '--swatch': s.baseColor }} />,
    },
    {
      id: 'artwork',
      label: t.rail.artwork,
      title: t.sections.artwork,
      icon: s.artwork ? (
        <img className={styles.railThumb} src={s.artwork.objectUrl} alt="" />
      ) : (
        <UploadIcon />
      ),
    },
    {
      id: 'placement',
      label: t.rail.placement,
      title: t.sections.placement,
      icon: <MoveIcon />,
      disabled: !s.artwork,
    },
    { id: 'details', label: t.rail.details, title: t.sections.details, icon: <InfoIcon /> },
  ];

  const current =
    sections.find((entry) => entry.id === section && !entry.disabled) ?? sections[0];
  const open = mode === 'open';

  const footer =
    current.id === 'placement' ? (
      <Button size="sm" onClick={s.exportCurrentProof}>
        <DownloadIcon />
        {t.downloadProof}
      </Button>
    ) : renderCta ? (
      <Cta session={s} renderCta={renderCta} block size="sm" />
    ) : null;

  return (
    <div ref={shellRef} className={styles.shell}>
      <div className={styles.shellStage}>
        <StudioStage
          compact
          product={s.product}
          texture={s.texture}
          baseColor={s.baseColor}
          autoRotate={s.autoRotate}
          onInteract={() => s.toggleAutoRotate(false)}
          header={s.showPicker && <ProductSwitcher session={s} />}
          // With the panel open its footer carries the call to action instead.
          footer={!open && renderCta ? <Cta session={s} renderCta={renderCta} size="sm" /> : null}
        />
      </div>

      <StudioDrawer
        sections={sections}
        active={current.id}
        onSectionChange={setSection}
        mode={mode}
        onModeChange={setMode}
        orientation={shape.landscape ? 'landscape' : 'portrait'}
        rtl={isRTL}
        labels={t.drawer}
        title={current.title}
        headerActions={
          current.id === 'stock' || current.id === 'placement' ? (
            <HistoryButtons session={s} />
          ) : null
        }
        footer={footer}
      >
        {current.id === 'stock' && (
          <StockPicker product={s.product} value={s.baseColor} onChange={s.setBaseColor} />
        )}
        {current.id === 'artwork' && (
          <ArtworkDropzone
            artwork={s.artwork}
            status={s.status}
            error={s.error}
            onUpload={s.uploadArtwork}
            onClear={s.clearArtwork}
            compact
          />
        )}
        {current.id === 'placement' && <Placement session={s} />}
        {current.id === 'details' && <ProductDetails product={s.product} />}
      </StudioDrawer>
    </div>
  );
}

/** Chooses a layout from the room it has, then renders it. */
function StudioBody({ shape, rootRef, apiRef, renderCta, onSubmit, onEvent, tenant, showPicker }) {
  const session = useStudioSession({ rootRef, apiRef, onSubmit, onEvent, tenant, showPicker });

  // Nothing until the studio knows its size. It is measured before the first
  // paint, so this is never a frame anyone sees — and it means a phone never
  // briefly mounts the desktop layout and a renderer it is about to discard.
  if (!shape.measured) return null;

  return shape.compact ? (
    <TouchStudio session={session} renderCta={renderCta} />
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
 *   ui?: { picker?: boolean },
 *   fullscreen?: boolean,
 *   insetBlockStart?: string,
 *   className?: string,
 *   apiRef?: React.Ref<{ getState: () => object }>,
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
  ui,
  fullscreen = false,
  insetBlockStart,
  className,
  apiRef,
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

  const showPicker = ui?.picker !== false;

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
              <StudioProvider catalogue={catalogue} sku={sku}>
                <StudioBody
                  shape={shape}
                  rootRef={rootRef}
                  apiRef={apiRef}
                  renderCta={renderCta}
                  onSubmit={onSubmit}
                  onEvent={onEvent}
                  tenant={tenant}
                  showPicker={showPicker}
                />
              </StudioProvider>
            </LicenseProvider>
          </AssetProvider>
        </CopyProvider>
      </LocaleContextProvider>
    </StudioRoot>
  );
}

export { COMPACT_WIDTH };
export default Studio;
