import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
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
        fontSize: 136,
        fontWeight: 600,
        letterSpacing: '-0.04em',
        paddingBottom: 10,
      }}
    >
      A
    </div>,
    { ...size }
  );
}
