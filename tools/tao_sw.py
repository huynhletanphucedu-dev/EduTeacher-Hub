"""Tạo lại sw.js (danh sách file dùng offline) sau khi thêm/bớt file.
Chạy:  python tools/tao_sw.py   (trong thư mục EduTeacher Hub)"""
import os, hashlib, json, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
SKIP_DIR = {'.git', '_to_delete', 'tools', 'node_modules', '.vscode', '_rieng_tu', 'Claude outputs'}
SKIP_EXT = {'.docx', '.doc', '.sh', '.gs', '.md', '.py', '.map', '.txt'}
files, h = [], hashlib.sha1()
# Chỉ lấy các file sẽ thật sự đưa lên web: bỏ mọi thứ nằm trong .gitignore (dữ liệu riêng, hồ sơ…)
try:
    import subprocess
    out = subprocess.run(['git', 'ls-files', '--cached', '--others', '--exclude-standard', '-z'],
                         cwd=ROOT, capture_output=True, check=True).stdout.decode('utf-8')
    CANDIDATES = [ROOT / f for f in out.split('\0') if f]
except Exception:
    CANDIDATES = list(ROOT.rglob('*'))
for p in sorted(CANDIDATES):
    if not p.exists(): continue
    rel = p.relative_to(ROOT).as_posix()
    if p.is_dir() or any(part in SKIP_DIR for part in p.relative_to(ROOT).parts): continue
    if rel.startswith('lib/tesseract/'): continue  # bộ OCR ~9MB: chỉ tải khi dùng lần đầu
    if p.suffix.lower() in SKIP_EXT or p.name.startswith('.') or rel == 'sw.js' or '.tmp.' in p.name: continue
    files.append(rel); h.update(rel.encode()); h.update(p.read_bytes())
core = ['./', 'index.html', 'dashboard.html', 'manifest.webmanifest', 'eduhub_backup.js', 'eduhub_search.js', 'eduhub_pwa.js', 'icons/icon-192.png']
tpl = (ROOT / 'tools' / 'sw_template.js').read_text(encoding='utf-8')
out = tpl.replace('__VERSION__', h.hexdigest()[:10]).replace('__CORE__', json.dumps(core)).replace('__FILES__', json.dumps(files, ensure_ascii=False, indent=0))
(ROOT / 'sw.js').write_text(out, encoding='utf-8')
print(f'sw.js: {len(files)} file, phiên bản {h.hexdigest()[:10]}')
