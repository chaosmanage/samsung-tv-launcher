/*
 * Tile configuration. Edit here to change order, names or IDs.
 *
 * ids   : candidate Tizen application IDs, tried in order. At start-up the
 *         launcher reads the TV's installed-app list (tizen.application.getAppsInfo)
 *         and prefers whichever of these is actually installed.
 * match : if none of the ids is installed, the launcher looks for an installed
 *         app whose NAME matches this pattern and uses that app's real ID.
 *
 * Numeric IDs (e.g. 3201907018807) are Samsung app-store IDs; the runtime Tizen
 * ID is usually alphanumeric (e.g. org.tizen.netflix-app). Both are listed.
 *
 * Logos are simple inline SVG drawings (no images, no network).
 */
var TILES = [
  { key: 'hdmi', name: 'HDMI', sub: 'Set-top box / console', type: 'hdmi',
    bg: 'linear-gradient(145deg,#2d3748 0%,#1a202c 100%)', glow: '#8fb3ff',
    logo: '<svg viewBox="0 0 200 120"><g fill="none" stroke="#cfe0ff" stroke-width="7" stroke-linejoin="round">' +
          '<path d="M52 30h96v26l-12 14H64L52 56z"/></g>' +
          '<g fill="#cfe0ff"><rect x="68" y="42" width="8" height="8" rx="1"/><rect x="84" y="42" width="8" height="8" rx="1"/>' +
          '<rect x="100" y="42" width="8" height="8" rx="1"/><rect x="116" y="42" width="8" height="8" rx="1"/></g>' +
          '<text x="100" y="106" text-anchor="middle" font-size="30" font-weight="800" letter-spacing="6" fill="#ffffff">HDMI</text></svg>' },

  { key: 'youtube', name: 'YouTube', bg: 'linear-gradient(145deg,#232323 0%,#0f0f0f 100%)', glow: '#ff3b30',
    ids: ['com.samsung.tv.cobalt-yt', '9Ur5IzDKqV.TizenYouTube', '111299001912'],
    match: /^youtube$/i,
    logo: '<svg viewBox="0 0 200 120"><rect x="58" y="14" width="84" height="58" rx="16" fill="#ff0000"/>' +
          '<path d="M90 30v26l23-13z" fill="#fff"/>' +
          '<text x="100" y="108" text-anchor="middle" font-size="30" font-weight="700" letter-spacing="-1" fill="#fff">YouTube</text></svg>' },

  { key: 'netflix', name: 'Netflix', bg: 'linear-gradient(145deg,#1c1c1c 0%,#000 100%)', glow: '#e50914',
    ids: ['org.tizen.netflix-app', 'org.tizen.netflixapp', '3201907018807', '11101200001'],
    match: /^netflix$/i,
    logo: '<svg viewBox="0 0 200 120"><text x="100" y="78" text-anchor="middle" font-size="50" font-weight="900" ' +
          'font-family="Arial Black,Arial,sans-serif" textLength="176" lengthAdjust="spacingAndGlyphs" ' +
          'transform="translate(0,-26) scale(1,1.35)" fill="#e50914">NETFLIX</text></svg>' },

  { key: 'zee5', name: 'ZEE5', bg: 'linear-gradient(145deg,#8c2fd1 0%,#4a148c 100%)', glow: '#d58bff',
    ids: ['3201810017104'],
    match: /zee\s*5/i,
    logo: '<svg viewBox="0 0 200 120"><circle cx="100" cy="60" r="50" fill="#ffffff" opacity=".12"/>' +
          '<text x="100" y="78" text-anchor="middle" font-size="52" font-weight="900" font-style="italic" fill="#fff">ZEE5</text></svg>' },

  { key: 'prime', name: 'Prime Video', bg: 'linear-gradient(145deg,#1a2b3c 0%,#0b141d 100%)', glow: '#1aa6ff',
    ids: ['org.tizen.primevideo', '3201910019365', '3201512006785', 'org.tizen.ignition'],
    match: /prime\s*video|amazon\s*prime/i,
    logo: '<svg viewBox="0 0 200 120"><text x="100" y="58" text-anchor="middle" font-size="46" font-weight="700" fill="#fff">prime</text>' +
          '<path d="M58 70q42 22 84 0" fill="none" stroke="#1aa6ff" stroke-width="6" stroke-linecap="round"/>' +
          '<path d="M134 64l10 5-6 9" fill="none" stroke="#1aa6ff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>' +
          '<text x="100" y="108" text-anchor="middle" font-size="24" font-weight="500" letter-spacing="2" fill="#c8d6e5">video</text></svg>' },

  { key: 'hotstar', name: 'JioHotstar', bg: 'linear-gradient(145deg,#1d3fb3 0%,#0a1446 100%)', glow: '#5aa0ff',
    ids: [],
    match: /hotstar/i,
    logo: '<svg viewBox="0 0 200 120"><path d="M100 10l9 20 22 2-17 14 5 21-19-11-19 11 5-21-17-14 22-2z" fill="#ffd54a"/>' +
          '<text x="100" y="106" text-anchor="middle" font-size="30" font-weight="800" fill="#fff">JioHotstar</text></svg>' },

  { key: 'sonyliv', name: 'Sony LIV', bg: 'linear-gradient(145deg,#262626 0%,#050505 100%)', glow: '#f5b301',
    ids: [],
    match: /sony\s*liv/i,
    logo: '<svg viewBox="0 0 200 120"><defs><linearGradient id="lg" x1="0" x2="1"><stop offset="0" stop-color="#f7c600"/>' +
          '<stop offset=".5" stop-color="#f36f21"/><stop offset="1" stop-color="#e3125b"/></linearGradient></defs>' +
          '<text x="100" y="34" text-anchor="middle" font-size="20" font-weight="700" letter-spacing="8" fill="#fff">SONY</text>' +
          '<text x="100" y="100" text-anchor="middle" font-size="64" font-weight="900" fill="url(#lg)">LIV</text></svg>' },

  { key: 'internet', name: 'Internet', sub: 'Samsung browser', bg: 'linear-gradient(145deg,#6b5cff 0%,#3b1fa8 100%)', glow: '#b3a6ff',
    ids: ['com.samsung.tv.knox-browser', 'org.tizen.browser', '3202010022079', '3201907018784'],
    match: /^internet$|samsung internet|^browser$/i,
    logo: '<svg viewBox="0 0 200 120"><g transform="translate(30 -6) scale(.7)">' +
          '<ellipse cx="100" cy="60" rx="66" ry="18" fill="none" stroke="#fff" stroke-width="7" opacity=".55" transform="rotate(-18 100 60)"/>' +
          '<circle cx="100" cy="60" r="36" fill="#fff"/><circle cx="100" cy="60" r="27" fill="#5b3fe4"/>' +
          '<path d="M37 77 A66 18 -18 0 0 163 43" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/></g>' +
          '<text x="100" y="108" text-anchor="middle" font-size="30" font-weight="700" fill="#fff">Internet</svg>' }
];

/*
 * HDMI behaviour. Methods are tried in order until one works.
 *   'tvwindow' : show the HDMI input full screen inside this app (official TVWindow API).
 *   'native'   : ask the TV's own Source / TV-viewer app to open (undocumented IDs).
 */
var HDMI_CONFIG = {
  order: ['tvwindow', 'native'],
  nativeApps: ['com.samsung.tv.coba.source', 'org.tizen.tv-viewer', 'org.tizen.SMSourceAPP']
};
