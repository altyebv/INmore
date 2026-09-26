import Button from '@/components/ui/Button';
import { useContent } from '@/i18n';
import usePageMeta from '@/lib/utils/usePageMeta';

export function NotFound() {
  const { ui } = useContent();
  const c = ui.notFound;

  usePageMeta({ title: c.title });

  return (
    <main
      id="main"
      className="u-shell"
      style={{
        minHeight: '100svh',
        display: 'grid',
        alignContent: 'center',
        gap: 'var(--space-5)',
        paddingTop: 'var(--header-h)',
      }}
    >
      <p className="u-label">{c.code}</p>
      <h1 style={{ fontSize: 'var(--step-4)', maxWidth: '16ch' }}>{c.heading}</h1>
      <p style={{ color: 'var(--fg-muted)', maxWidth: '42ch' }}>{c.body}</p>
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <Button to="/" variant="primary">
          {c.back}
        </Button>
        <Button to="/studio">{ui.common.testYourProduct}</Button>
      </div>
    </main>
  );
}

export default NotFound;
