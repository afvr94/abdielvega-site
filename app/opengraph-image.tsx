import { ImageResponse } from 'next/og';

export const alt = 'Abdiel Vega — Full-stack engineer';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

async function loadFont(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load font: ${url}`);
  return res.arrayBuffer();
}

export default async function OpenGraphImage() {
  let fonts:
    | Array<{ name: string; data: ArrayBuffer; style: 'normal' | 'italic'; weight: 400 | 600 }>
    | undefined;

  try {
    const [regular, italic] = await Promise.all([
      loadFont('https://cdn.jsdelivr.net/fontsource/fonts/fraunces@latest/latin-600-normal.ttf'),
      loadFont('https://cdn.jsdelivr.net/fontsource/fonts/fraunces@latest/latin-600-italic.ttf'),
    ]);
    fonts = [
      { name: 'Fraunces', data: regular, style: 'normal', weight: 600 },
      { name: 'Fraunces', data: italic, style: 'italic', weight: 600 },
    ];
  } catch {
    // If the CDN blinks, fall back to Satori's built-in serif — still readable.
    fonts = undefined;
  }

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#F5EFE4',
        color: '#1A1815',
        padding: '64px 80px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: fonts ? 'Fraunces' : 'serif',
      }}
    >
      {/* ── Masthead strapline ──────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'ui-monospace, monospace',
          fontSize: 14,
          letterSpacing: 4,
          textTransform: 'uppercase',
          color: '#8A8178',
        }}
      >
        <span>Vol. MMXXVI</span>
        <span style={{ color: '#1A1815' }}>Abdiel Vega &nbsp;·&nbsp; Portfolio</span>
        <span>The Standing Card</span>
      </div>

      {/* ── Hero ────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          fontSize: 132,
          lineHeight: 0.95,
          letterSpacing: '-0.035em',
          fontWeight: 600,
        }}
      >
        <span>Abdiel Vega,</span>
        <span>
          <span style={{ fontStyle: 'italic' }}>full-stack</span>
        </span>
        <span>engineer.</span>
      </div>

      {/* ── Footer rule ──────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'ui-monospace, monospace',
          fontSize: 14,
          letterSpacing: 4,
          textTransform: 'uppercase',
          color: '#8A8178',
          borderTop: '1px solid #1A181533',
          paddingTop: 18,
        }}
      >
        <span>abdielvega.com</span>
        <span style={{ color: '#1A1815' }}>— § —</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4A6741' }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              backgroundColor: '#4A6741',
            }}
          />
          Open to work
        </span>
      </div>
    </div>,
    { ...size, fonts }
  );
}
