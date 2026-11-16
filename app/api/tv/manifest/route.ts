// PWA manifest for cliffo (tv.abdielvega.com). Served under /api so it's
// reachable past the auth gate; referenced only from the TV layout.
export async function GET() {
  const manifest = {
    name: 'cliffo',
    short_name: 'cliffo',
    description: 'Personal TV tracker',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#16121B',
    theme_color: '#16121B',
    icons: [
      { src: '/cliffo/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/cliffo/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
  return Response.json(manifest, {
    headers: { 'content-type': 'application/manifest+json' },
  });
}
