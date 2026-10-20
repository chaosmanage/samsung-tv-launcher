"""Check that the widget manifest and its referenced files are present."""
from pathlib import Path
import json
import xml.etree.ElementTree as XML
import re

root = Path(__file__).resolve().parents[1]
app = root / 'app'
manifest = XML.parse(app / 'config.xml').getroot()
ns = {'w': 'http://www.w3.org/ns/widgets', 't': 'http://tizen.org/ns/widgets'}
identity = manifest.find('t:application', ns)
assert identity is not None, 'Missing application identity'
assert identity.get('package') == 'KsHome0001', 'Keep the installed package identity stable'
assert identity.get('id') == 'KsHome0001.CleanHome', 'Keep the installed application ID stable'
assert manifest.get('version') == json.loads((root / 'package.json').read_text())['version'], 'Manifest/package versions differ'
for tag in ['content', 'icon']:
    node = manifest.find('w:' + tag, ns)
    assert node is not None and (app / node.get('src', '')).is_file(), 'Missing ' + tag + ' file'
assert all((app / name).is_file() for name in ['main.js', 'style.css'])
for reference in ['assets/wallpapers/catalog.js', 'assets/adaptive-ink.js', 'assets/font-catalog.js']:
    assert (app / reference).is_file(), 'Missing runtime catalogue: ' + reference
for filename in ['index.html']:
    source = (app / filename).read_text()
    pattern = r'(?:src|href)=[\"\']([^\"\']+)' if filename.endswith('.html') else r'from\s+[\"\']([^\"\']+)'
    for reference in re.findall(pattern, source):
        if ':' in reference or reference.startswith('$'):
            continue
        assert (app / reference).is_file(), 'Missing bundled resource: ' + reference
        if filename.endswith('.js'):
            assert reference.startswith(('./', '../')), 'Module imports must be relative paths'
for css in app.rglob('*.css'):
    for reference in re.findall(r'url\([\"\']?([^\)\"\']+)', css.read_text()):
        if ':' not in reference:
            assert (css.parent / reference.split('?')[0]).is_file(), 'Missing CSS resource: ' + reference
# These resource names are constructed at runtime, so HTML/CSS reference checks cannot find them.
walls = json.loads((app / 'assets/wallpapers/SOURCES.json').read_text())
for wall in walls:
    for field in ['src', 'thumb']:
        assert (app / wall[field]).is_file(), 'Missing wallpaper: ' + wall[field]
    wall_id = wall['id']
    assert not (app / ('assets/wallpapers/' + wall_id + '-panel.jpg')).exists(), 'Stale pre-blurred panel: ' + wall_id
# Streaming tiles use the TV's installed iconPath at runtime; only utility outline SVGs are required.
for icon in ['apps', 'settings', 'home']:
    assert (app / ('assets/icons/' + icon + '.svg')).is_file(), 'Missing util icon: ' + icon
# device.js must use Kunal's app identity and confirmed app IDs
device = (app / 'device.js').read_text()
assert "SELF = 'KsHome0001.CleanHome'" in device
for app_id in ['9Ur5IzDKqV.TizenYouTube', 'org.tizen.netflix-app', 'wKDM33Rods.ZEE5',
               'org.tizen.primevideo', 'fiZNCxMH9Y.Hotstar', 'EUKHUxrGQA.SonyLIV',
               'org.tizen.browser']:
    assert app_id in device, 'Missing app id in device.js: ' + app_id
main = (app / 'main.js').read_text()
assert "id: 'hdmi'" in main and "id: 'samsunghome'" not in main and "utils() { return ['samsunghome', 'apps', 'settings']; }" in main, 'Samsung Home must be a header control, not a dock app'
for f in ['mono/hdmi.png', 'mono/zee5.png', 'sonyliv.svg', 'smartthings.svg', 'mono/hotstar.png', 'mono/browser.png', 'youtube.svg', 'netflix.svg', 'primevideo.svg', 'tizen-placeholder-ref.png']:
    assert (app / 'assets/icons' / f).is_file(), 'Missing dock mark: ' + f
assert 'Wakad, Pune' in main
assert 'api.open-meteo.com' in main
for dock_icon in ['hdmi','youtube','netflix','zee5','primevideo','hotstar','sonyliv','browser','samsunghome']:
    assert (app / ('assets/icons/dock/' + dock_icon + '.png')).is_file(), 'Missing dock PNG icon: ' + dock_icon
assert 'function maybeHandOffHome' in main and 'function useAsHome' in main
assert 'isHomeTriggeredLaunch' in main and 'maybeHandOffHome' in main
assert 'samsung.useAsHome' in main
# Soft handoff must never redirect an app-list (default) launch.
assert "org.tizen.tv-viewer" in (app / 'device.js').read_text()
print('Widget identity, version and bundled resources are valid.')

_js = (app / 'main.js').read_text()
assert 'assets/materials' not in _js and '-panel.jpg' not in _js, 'Stock pre-blurred wallpaper materials must not be used'
assert 'function applyWallpaperEverywhere' in _js, 'Single wallpaper source missing'
