import { ImageResponse } from 'next/og';
import { GroveScene } from '@/components/site/GroveScene';
import { profile } from '@/lib/portfolio/content';

export const alt = 'Abdiel Vega — Full-stack engineer, Minneola, Florida';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Satori can't read the page's CSS variables, so the crate inks are literal here.
// Keep in step with the --color-* tokens in app/globals.css.
const INK = {
  lake: '#14246a',
  lemon: '#f7c838',
  paper: '#fffcf5',
  grove: '#1d673c',
  sprout: '#74a845',
  reef: '#2d55c4',
  tangelo: '#f0601a',
  mist: '#c9d3f2',
};

const FONT_BASE = 'https://cdn.jsdelivr.net/fontsource/fonts';

async function loadFont(path: string) {
  const res = await fetch(`${FONT_BASE}/${path}`);
  if (!res.ok) throw new Error(`Failed to load font: ${path}`);
  return res.arrayBuffer();
}

export default async function OpenGraphImage() {
  let fonts: Array<{ name: string; data: ArrayBuffer; weight: 400 | 800 }> | undefined;
  try {
    const [ultra, shoulders, yellowtail] = await Promise.all([
      loadFont('ultra@latest/latin-400-normal.ttf'),
      loadFont('big-shoulders@latest/latin-800-normal.ttf'),
      loadFont('yellowtail@latest/latin-400-normal.ttf'),
    ]);
    fonts = [
      { name: 'Ultra', data: ultra, weight: 400 },
      { name: 'Big Shoulders', data: shoulders, weight: 800 },
      { name: 'Yellowtail', data: yellowtail, weight: 400 },
    ];
  } catch {
    // If the CDN blinks, Satori's built-in faces still give a readable card.
    fonts = undefined;
  }

  const gothic = {
    fontFamily: fonts ? 'Big Shoulders' : 'sans-serif',
    fontWeight: 800,
    textTransform: 'uppercase' as const,
  };

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        background: INK.lake,
        padding: 28,
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          border: `5px solid ${INK.lemon}`,
          padding: 7,
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            border: `1.5px solid ${INK.lemon}`,
            padding: '40px 0 0 52px',
          }}
        >
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              paddingBottom: 40,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                fontFamily: fonts ? 'Ultra' : 'serif',
                fontSize: 150,
                lineHeight: 0.86,
                color: INK.paper,
              }}
            >
              <span>Abdiel</span>
              <span>Vega</span>
            </div>
            <div
              style={{
                ...gothic,
                display: 'flex',
                alignSelf: 'flex-start',
                marginTop: 30,
                padding: '8px 18px',
                background: INK.lemon,
                color: INK.lake,
                fontSize: 30,
                letterSpacing: 2.5,
                whiteSpace: 'nowrap',
              }}
            >
              {`${profile.title} · ${profile.town}, Fla.`}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                marginTop: 'auto',
                gap: 14,
              }}
            >
              <span
                style={{
                  fontFamily: fonts ? 'Yellowtail' : 'cursive',
                  fontSize: 36,
                  color: INK.lemon,
                }}
              >
                Packed by
              </span>
              <span style={{ ...gothic, fontSize: 24, letterSpacing: 3, color: INK.paper }}>
                {`${profile.fullName} · `}
              </span>
              <span style={{ ...gothic, fontSize: 24, letterSpacing: 3, color: INK.lemon }}>
                Open to work
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingRight: 28 }}>
            <GroveScene inks={INK} width={372} height={432} />
          </div>
        </div>
      </div>
    </div>,
    { ...size, fonts }
  );
}
