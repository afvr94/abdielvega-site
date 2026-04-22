import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#1A1815',
        color: '#F5EFE4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Georgia, serif',
        fontSize: 26,
        fontWeight: 600,
        letterSpacing: '-0.03em',
        paddingBottom: 2,
      }}
    >
      A
    </div>,
    { ...size }
  );
}
