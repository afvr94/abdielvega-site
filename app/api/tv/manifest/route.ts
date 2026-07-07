// PWA manifest for The Marquee (tv.abdielvega.com). Served under /api so it's
// reachable past the auth gate; referenced only from the TV layout.
export async function GET() {
  const manifest = {
    name: 'The Marquee',
    short_name: 'Marquee',
    description: 'Personal TV tracker',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F5EFE4',
    theme_color: '#1A1815',
    icons: [
      { src: '/api/tv/icon/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/api/tv/icon/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/api/tv/icon/512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  return Response.json(manifest, {
    headers: { 'content-type': 'application/manifest+json' },
  });
}
