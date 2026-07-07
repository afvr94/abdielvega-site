import { ImageResponse } from 'next/og';

// Generates the PWA / apple-touch icons for The Marquee at any size.
export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const n = Math.min(1024, Math.max(48, Number(size) || 192));
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1A1815',
        color: '#F5EFE4',
        fontFamily: 'Georgia, serif',
        fontSize: Math.round(n * 0.5),
        fontWeight: 600,
        letterSpacing: '-0.03em',
      }}
    >
      M
    </div>,
    { width: n, height: n }
  );
}
