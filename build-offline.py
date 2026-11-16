from pathlib import Path
import json
import re

root = Path(__file__).parent

def read(name):
    return (root / name).read_text(encoding="utf-8")

def script(name):
    return re.sub(r"^import .*?;\n|^export ", "", read(name), flags=re.M)

rules = script("rules.mjs")
worker = "\n".join([rules, script("engine.mjs"), script("worker.mjs")])
app = script("app.mjs").replace(
    "new Worker(new URL('./worker.mjs', import.meta.url), { type: 'module' })",
    "new Worker(URL.createObjectURL(new Blob([workerCode], { type: 'text/javascript' })))",
)
app = app.split("if ('serviceWorker' in navigator)")[0]
page = read("index.html")
page = page.replace('<link rel="stylesheet" href="./style.css">', '<style>' + read("style.css") + '</style>')
page = re.sub(r'<script id="web-bootstrap">.*?</script>', "", page, flags=re.S)
bundle = "\n".join(["const workerCode = " + json.dumps(worker) + ";", rules, script("lessons.mjs"), app])
page = re.sub(r'<script id="web-app">.*?</script>', lambda _: '<script>' + bundle + '</script>', page, flags=re.S)
(root / "Xiangqi-Offline.html").write_text(page, encoding="utf-8")
