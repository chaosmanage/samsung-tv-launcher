#!/usr/bin/env python3
"""Regenerate docs/INSTALL.html and docs/INSTALL.pdf from INSTALL.md."""
import markdown, re, os, subprocess
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
md = open(os.path.join(root, 'INSTALL.md'), encoding='utf-8').read().replace('](docs/img/', '](img/')
body = markdown.markdown(md, extensions=['tables', 'fenced_code', 'sane_lists'])
body = re.sub(r'<p><img ([^>]+)/>\s*(<em>.*?</em>)</p>', r'<figure><img \1/><figcaption>\2</figcaption></figure>', body, flags=re.S)
css = """
@page { size: A4; margin: 16mm 14mm 18mm; }
body { font-family: 'Segoe UI', 'Noto Sans', 'DejaVu Sans', Arial, sans-serif; font-size: 10.5pt; line-height: 1.5; color: #1d2330; }
h1 { font-size: 22pt; color: #12306b; border-bottom: 3px solid #2f6fdb; padding-bottom: 6px; margin-top: 0; }
h2 { font-size: 15pt; color: #fff; background: #2f6fdb; padding: 6px 12px; border-radius: 6px; margin-top: 26px; break-after: avoid; }
h3 { break-after: avoid; font-size: 12pt; color: #12306b; margin-top: 18px; }
hr { display: none; }
table { border-collapse: collapse; width: 100%; font-size: 9.5pt; margin: 10px 0; }
th, td { border: 1px solid #c9d3e6; padding: 5px 7px; vertical-align: top; text-align: left; }
th { background: #eef3fc; }
tr { break-inside: avoid; }
code { background: #eef1f6; padding: 1px 4px; border-radius: 3px; font-family: Consolas, 'DejaVu Sans Mono', monospace; font-size: 9.5pt; }
blockquote { margin: 10px 0; padding: 8px 12px; background: #fff8e1; border-left: 4px solid #f2b600; border-radius: 4px; }
blockquote p { margin: 0; }
figure { margin: 10px 0 14px; text-align: center; break-inside: avoid; }
figure img { max-width: 92%; max-height: 95mm; border: 1px solid #c9d3e6; border-radius: 4px; }
figcaption { font-size: 8.5pt; color: #5b6578; margin-top: 4px; }
li { margin: 3px 0; }
strong { color: #0d1b3d; }
a { color: #1f5bd0; word-break: break-all; }
"""
html = f"<!DOCTYPE html><html><head><meta charset='utf-8'><title>Clean Home – Install guide</title><style>{css}</style></head><body>{body}</body></html>"
out_html = os.path.join(root, 'docs', 'INSTALL.html')
open(out_html, 'w', encoding='utf-8').write(html)
chrome = os.environ.get('CHROME', 'google-chrome')
subprocess.run([chrome, '--headless=new', '--no-sandbox', '--disable-gpu', '--no-pdf-header-footer',
                '--print-to-pdf=' + os.path.join(root, 'docs', 'INSTALL.pdf'), 'file://' + out_html], check=True)
