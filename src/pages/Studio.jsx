import { useCallback, useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import ArtworkControls from '@/features/studio/components/ArtworkControls';
import ArtworkDropzone from '@/features/studio/components/ArtworkDropzone';
import FlatPreview from '@/features/studio/components/FlatPreview';
import ProductPicker from '@/features/studio/components/ProductPicker';
import StudioStage from '@/features/studio/components/StudioStage';
import StudioSheet, { SNAP_POINTS } from '@/features/studio/components/StudioSheet';
import StudioProvider, { useStudio } from '@/features/studio/state/StudioProvider';
import useArtworkTexture from '@/three/useArtworkTexture';
import exportProof from '@/lib/artwork/exportProof';
import usePageMeta from '@/lib/utils/usePageMeta';
import useMediaQuery, { STUDIO_COMPACT_QUERY } from '@/lib/utils/useMediaQuery';
import { useContent, useLocalizedProduct } from '@/i18n';
import { useAppShell } from '@/app/ShellContext';
import styles from './Studio.module.css';

/**
 * Shared behaviour for both layouts.
 *
 * Texture generation, keyboard shortcuts and proof export belong to the studio
 * regardless of how it is arranged on screen, so they live here and the two
 * layout components below only decide where things sit.
 */
function useStudioSession() {
  const studio = useStudio();
  const product = useLocalizedProduct(studio.product);
  const { texture } = useArtworkTexture(studio.product, studio.artwork, studio.transform);

  useEffect(() => {
    const onKey = (event) => {
      const modifier = event.metaKey || event.ctrlKey;
      if (!modifier || event.key.toLowerCase() !== 'z') return;
      event.preventDefault();
      if (event.shiftKey) studio.redo();
      else studio.undo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [studio]);

  const exportCurrentProof = useCallback(
    () => exportProof(studio.product, studio.artwork, studio.transform),
    [studio.product, studio.artwork, studio.transform]
  );

  return { ...studio, product, texture, exportCurrentProof, commit: () => studio.setTransform({}, true) };
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

/* --- Pointer layout --------------------------------------------------------- */

function PointerStudio() {
  const s = useStudioSession();
  const { ui } = useContent();
  const t = ui.studio;

  return (
    <div className={styles.workspace + ' u-shell'}>
      <div className={styles.viewer}>
        <StudioStage
          product={s.product}
          texture={s.texture}
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

        <Step index="02" title={t.steps.artwork}>
          <ArtworkDropzone
            artwork={s.artwork}
            status={s.status}
            error={s.error}
            onUpload={s.uploadArtwork}
            onClear={s.clearArtwork}
          />
        </Step>

        <Step index="03" title={t.steps.placement}>
          <FlatPreview
            product={s.product}
            artwork={s.artwork}
            transform={s.transform}
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
          <Button to="/contact" variant="primary" block>
            {t.talkToUs}
          </Button>
        </div>
      </aside>
    </div>
  );
}

/* --- Touch layout ----------------------------------------------------------- */

function TouchStudio() {
  const s = useStudioSession();
  const { ui } = useContent();
  const t = ui.studio;

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
    <div className={styles.shell}>
      <div className={styles.shellIntro}>
        <p className="u-label">{t.eyebrow}</p>
        <h1 className={styles.shellTitle}>{t.heading}</h1>
      </div>

      <div className={styles.shellViewer}>
        <StudioStage
          product={s.product}
          texture={s.texture}
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
            <Button to="/contact" variant="primary" block size="sm">
              {t.talkToUs}
            </Button>
          )
        }
      >
        {tab === 'product' && (
          <div className={styles.sheetStep}>
            <ProductPicker selectedId={s.product.id} onSelect={s.selectProduct} />
            <p className={styles.sheetHint}>{s.product.summary}</p>
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
            <p className={styles.sheetHint}>{t.lede}</p>
          </div>
        )}

        {tab === 'placement' && (
          <div className={styles.sheetStep}>
            <FlatPreview
              product={s.product}
              artwork={s.artwork}
              transform={s.transform}
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

/* --- Route ------------------------------------------------------------------ */

function StudioLayout() {
  const compact = useMediaQuery(STUDIO_COMPACT_QUERY);
  return compact ? <TouchStudio /> : <PointerStudio />;
}

export function Studio() {
  const { ui } = useContent();
  const t = ui.studio;
  const compact = useMediaQuery(STUDIO_COMPACT_QUERY);

  usePageMeta({ title: t.title, description: t.description });
  useAppShell(compact);

  // The touch layout is a fixed app shell, so the page behind it must not
  // scroll underneath the sheet.
  useEffect(() => {
    if (!compact) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [compact]);

  if (compact) {
    return (
      <main id="main">
        <StudioProvider>
          <StudioLayout />
        </StudioProvider>
      </main>
    );
  }

  return (
    <main id="main" className={styles.page}>
      <div className={styles.intro}>
        <div className={'u-shell ' + styles.introInner}>
          <div>
            <p className="u-label">{t.eyebrow}</p>
            <h1 className={styles.title}>{t.heading}</h1>
          </div>
          <p className={styles.lede}>{t.lede}</p>
        </div>
      </div>

      <StudioProvider>
        <StudioLayout />
      </StudioProvider>
    </main>
  );
}

export { SNAP_POINTS };
export default Studio;
