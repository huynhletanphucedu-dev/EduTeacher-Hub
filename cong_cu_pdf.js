/* ═══════════ EduTeacher Hub – Bộ công cụ PDF (xử lý 100% trên máy) ═══════════ */
'use strict';
const { PDFDocument, rgb, degrees } = PDFLib;
pdfjsLib.GlobalWorkerOptions.workerSrc = 'lib/pdf.worker.min.js';
try { if (localStorage.getItem('etv1_theme') === 'dark') document.body.classList.add('dark'); } catch (e) { }

/* ───────── tiện ích chung ───────── */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const P = id => document.getElementById('p-' + id);
const fmtSize = b => b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(0) + ' KB' : (b / 1048576).toFixed(2) + ' MB';
const baseName = f => (f.name || 'file').replace(/\.[^.]+$/, '');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const hexRGB = h => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
const MM = 72 / 25.4;
const wait = ms => new Promise(r => setTimeout(r, ms));

function msg(id, type, html) { const m = $('.msg', P(id)); m.className = 'msg ' + (type || ''); m.innerHTML = html || ''; }
function prog(id, v) { const p = $('.prog', P(id)); if (v == null) { p.style.display = 'none'; return; } p.style.display = 'block'; p.firstElementChild.style.width = Math.round(v * 100) + '%'; }
async function busy(id, btn, fn) {
  const b = typeof btn === 'string' ? document.getElementById(btn) : btn;
  b.disabled = true; msg(id, 'info', '⏳ Đang xử lý, thầy/cô chờ một chút…'); prog(id, 0.02);
  try { await fn(); }
  catch (e) { console.error(e); msg(id, 'err', '❌ Có lỗi: ' + esc(e.message || e) + (String(e.message).includes('encrypt') ? '<br>File có thể đang đặt mật khẩu – hãy gỡ mật khẩu trước.' : '')); }
  finally { b.disabled = false; prog(id, null); }
}
function download(data, name, type = 'application/pdf') {
  const blob = data instanceof Blob ? data : new Blob([data], { type });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return blob.size;
}
async function downloadMany(outs, zipName) {
  if (outs.length === 1) return download(outs[0].bytes, outs[0].name, outs[0].type);
  const zip = new JSZip(); const used = {};
  outs.forEach(o => { let n = o.name; while (used[n]) n = n.replace(/(\.[^.]+)$/, '_' + (++used[o.name]) + '$1'); used[n] = 1; zip.file(n, o.bytes); });
  return download(await zip.generateAsync({ type: 'blob' }), zipName, 'application/zip');
}
const loadLib = buf => PDFDocument.load(buf, { ignoreEncryption: true });
const loadJs = buf => pdfjsLib.getDocument({ data: new Uint8Array(buf.slice(0)) }).promise;

async function renderPage(pdf, n, { scale, maxW } = {}) {
  const page = await pdf.getPage(n);
  let vp = page.getViewport({ scale: 1 });
  const s = maxW ? maxW / vp.width : (scale || 1);
  vp = page.getViewport({ scale: s });
  const c = document.createElement('canvas'); c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
  const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
  await page.render({ canvasContext: ctx, viewport: vp }).promise;
  page.cleanup();
  return c;
}
const canvasBlob = (c, type, q) => new Promise(r => c.toBlob(r, type, q));

/* font tiếng Việt (Be Vietnam Pro – OFL) */
const fontCache = {};
async function vnFont(doc, bold) {
  doc.registerFontkit(fontkit);
  const k = bold ? 'lib/BeVietnamPro-Bold.ttf' : 'lib/BeVietnamPro-Regular.ttf';
  if (!fontCache[k]) {
    const r = await fetch(k);
    if (!r.ok) throw new Error('Không tải được font tiếng Việt (' + k + ')');
    fontCache[k] = await r.arrayBuffer();
  }
  return doc.embedFont(fontCache[k], { subset: true });
}

/* Trang có thuộc tính xoay (/Rotate): quy đổi toạ độ “nhìn thấy” → toạ độ gốc */
function vis(page) {
  const r = (((page.getRotation().angle || 0) % 360) + 360) % 360;
  const { width: W0, height: H0 } = page.getSize();
  return { r, W0, H0, W: r % 180 ? H0 : W0, H: r % 180 ? W0 : H0 };
}
function mapPt(v, vx, vy) {
  switch (v.r) {
    case 90: return { x: v.W0 - vy, y: vx };
    case 180: return { x: v.W0 - vx, y: v.H0 - vy };
    case 270: return { x: vy, y: v.H0 - vx };
    default: return { x: vx, y: vy };
  }
}
function drawT(page, text, vx, vy, o) {
  const v = vis(page), p = mapPt(v, vx, vy);
  page.drawText(text, { font: o.font, size: o.size, color: o.color, opacity: o.opacity == null ? 1 : o.opacity, x: p.x, y: p.y, rotate: degrees(v.r + (o.rot || 0)) });
}
function drawI(page, img, vx, vy, w, h, opacity = 1) {
  const v = vis(page), p = mapPt(v, vx, vy);
  page.drawImage(img, { x: p.x, y: p.y, width: w, height: h, opacity, rotate: degrees(v.r) });
}
/* vị trí trong khung 3×3 */
function place(where, W, H, w, h, m) {
  const vr = where === 'c' ? 'm' : where[0], hz = where === 'c' ? 'c' : where[1];
  const x = hz === 'l' ? m : hz === 'r' ? W - w - m : (W - w) / 2;
  const y = vr === 't' ? H - m - h : vr === 'b' ? m : (H - h) / 2;
  return { x, y, hz };
}
/* khoảng trang “1-3, 5” → [[1,3],[5,5]] */
function parseRanges(str, total) {
  const out = [];
  String(str || '').split(/[,;]+/).map(s => s.trim()).filter(Boolean).forEach(part => {
    const m = part.match(/^(\d+)\s*[-–]\s*(\d+)$/), one = part.match(/^\d+$/);
    let a, b;
    if (m) { a = +m[1]; b = +m[2]; } else if (one) { a = b = +part; } else throw new Error('Khoảng trang không hợp lệ: “' + part + '”');
    if (a > b) [a, b] = [b, a];
    a = Math.max(1, a); b = Math.min(total, b);
    if (a <= b) out.push([a, b]);
  });
  return out;
}
function rangesToStr(nums) {
  nums = [...new Set(nums)].sort((a, b) => a - b); const out = [];
  for (let i = 0; i < nums.length; i++) { let j = i; while (j + 1 < nums.length && nums[j + 1] === nums[j] + 1) j++; out.push(i === j ? '' + nums[i] : nums[i] + '-' + nums[j]); i = j; }
  return out.join(', ');
}
function loadImage(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Không đọc được ảnh')); i.src = src; }); }
const fileURL = f => URL.createObjectURL(f);

/* ───────── chuyển công cụ ───────── */
$$('.tbtn').forEach(b => b.onclick = () => {
  $$('.tbtn').forEach(x => x.classList.toggle('active', x === b));
  $$('.panel').forEach(p => p.classList.toggle('active', p.id === 'p-' + b.dataset.t));
  try { localStorage.setItem('pdf_last_tool', b.dataset.t); } catch (e) { }
  if (innerWidth < 820) P(b.dataset.t).scrollIntoView({ behavior: 'smooth' });
});
try { const lt = localStorage.getItem('pdf_last_tool'); const b = lt && $('.tbtn[data-t="' + lt + '"]'); if (b) b.click(); } catch (e) { }

/* ───────── vùng kéo thả ───────── */
const handlers = {};
$$('[data-drop]').forEach(z => {
  const inp = document.createElement('input'); inp.type = 'file'; inp.hidden = true;
  inp.accept = z.dataset.accept || ''; inp.multiple = !!z.dataset.multi; z.after(inp);
  const go = files => { files = [...files]; if (!files.length) return; if (!z.dataset.multi) files = files.slice(0, 1); handlers[z.dataset.drop](files); };
  z.onclick = () => inp.click();
  inp.onchange = () => { go(inp.files); inp.value = ''; };
  z.ondragover = e => { e.preventDefault(); z.classList.add('over'); };
  z.ondragleave = () => z.classList.remove('over');
  z.ondrop = e => { e.preventDefault(); z.classList.remove('over'); go(e.dataTransfer.files); };
});

/* ───────── ô chọn vị trí 3×3 ───────── */
const POS = ['tl', 'tc', 'tr', 'ml', 'c', 'mr', 'bl', 'bc', 'br'];
const POS_LB = { tl: '↖', tc: '↑', tr: '↗', ml: '←', c: '●', mr: '→', bl: '↙', bc: '↓', br: '↘' };
$$('.posgrid').forEach(g => {
  g.innerHTML = POS.map(p => `<button type="button" data-v="${p}" title="${p}">${POS_LB[p]}</button>`).join('');
  const set = v => { g.dataset.val = v; $$('button', g).forEach(b => b.classList.toggle('on', b.dataset.v === v)); };
  $$('button', g).forEach(b => b.onclick = () => set(b.dataset.v));
  set(g.dataset.val);
});
const posOf = name => $('[data-pos="' + name + '"]').dataset.val;

/* ───────── danh sách file (kéo thả để sắp xếp) ───────── */
const lists = {};
function makeList(id, { onChange } = {}) {
  const st = { items: [], el: document.getElementById(id + '-list'), onChange };
  lists[id] = st;
  st.add = async files => {
    for (const f of files) {
      const it = { file: f, info: fmtSize(f.size), thumb: '' };
      st.items.push(it);
      if (f.type.startsWith('image/')) it.thumb = fileURL(f);
    }
    st.render();
    for (const it of st.items) if (!it.thumb && !it.loading && /pdf$/i.test(it.file.type || it.file.name)) {
      it.loading = true;
      try {
        const buf = await it.file.arrayBuffer(); const pdf = await loadJs(buf);
        it.pages = pdf.numPages; it.info = pdf.numPages + ' trang · ' + fmtSize(it.file.size);
        it.thumb = (await renderPage(pdf, 1, { maxW: 90 })).toDataURL('image/jpeg', .7); pdf.destroy();
      } catch (e) { it.info = '⚠️ Không đọc được file'; it.bad = true; }
      st.render();
    }
  };
  st.render = () => {
    st.el.innerHTML = st.items.map((it, i) => `<div class="fitem" draggable="true" data-i="${i}">
      ${it.thumb ? `<img src="${it.thumb}" alt="">` : '<img alt="">'}
      <div class="nm"><b>${i + 1}. ${esc(it.file.name)}</b><span>${esc(it.info)}</span></div>
      <div class="ops"><button class="ib" data-m="-1" title="Lên">▲</button><button class="ib" data-m="1" title="Xuống">▼</button><button class="ib" data-x title="Bỏ">✕</button></div></div>`).join('');
    $$('.fitem', st.el).forEach(row => {
      const i = +row.dataset.i;
      $$('[data-m]', row).forEach(b => b.onclick = () => { const j = i + +b.dataset.m; if (j < 0 || j >= st.items.length) return; [st.items[i], st.items[j]] = [st.items[j], st.items[i]]; st.render(); });
      $('[data-x]', row).onclick = () => { st.items.splice(i, 1); st.render(); };
      row.ondragstart = e => { st.drag = i; row.classList.add('drag'); e.dataTransfer.effectAllowed = 'move'; };
      row.ondragend = () => row.classList.remove('drag');
      row.ondragover = e => e.preventDefault();
      row.ondrop = e => { e.preventDefault(); e.stopPropagation(); if (st.drag == null || st.drag === i) return; const [m] = st.items.splice(st.drag, 1); st.items.splice(i, 0, m); st.drag = null; st.render(); };
    });
    st.onChange && st.onChange(st.items);
  };
  return st;
}
const okFiles = st => st.items.filter(i => !i.bad).map(i => i.file);

/* ───────── lưới trang có thể chọn (dùng cho Tách & PDF→Ảnh) ───────── */
function selectableGrid(id, inputId) {
  const g = { sel: new Set(), total: 0, el: document.getElementById(id + '-grid'), input: document.getElementById(inputId) };
  g.sync = () => { $$('.pg', g.el).forEach(c => c.classList.toggle('sel', g.sel.has(+c.dataset.n))); g.input.value = rangesToStr([...g.sel]); };
  g.load = async (pdf) => {
    g.total = pdf.numPages; g.sel.clear(); g.input.value = '';
    g.el.innerHTML = Array.from({ length: g.total }, (_, i) => `<div class="pg" data-n="${i + 1}"><div class="th"><img alt=""></div><div class="no">Trang ${i + 1}</div></div>`).join('');
    $$('.pg', g.el).forEach(c => c.onclick = () => { const n = +c.dataset.n; g.sel.has(n) ? g.sel.delete(n) : g.sel.add(n); g.sync(); });
    for (let n = 1; n <= g.total; n++) {
      const img = $(`.pg[data-n="${n}"] img`, g.el); if (!img) return;
      img.src = (await renderPage(pdf, n, { maxW: 150 })).toDataURL('image/jpeg', .7);
    }
  };
  g.input.addEventListener('input', () => { try { g.sel = new Set(parseRanges(g.input.value, g.total).flatMap(([a, b]) => Array.from({ length: b - a + 1 }, (_, k) => a + k))); $$('.pg', g.el).forEach(c => c.classList.toggle('sel', g.sel.has(+c.dataset.n))); } catch (e) { } });
  return g;
}

/* ═════════════ 1. GHÉP PDF ═════════════ */
const mergeL = makeList('merge', { onChange: it => $('#merge-go').disabled = it.filter(i => !i.bad).length < 1 });
handlers.merge = f => { mergeL.add(f); msg('merge'); };
$('#merge-clear').onclick = () => { mergeL.items = []; mergeL.render(); msg('merge'); };
$('#merge-go').onclick = () => busy('merge', 'merge-go', async () => {
  const files = okFiles(mergeL); const out = await PDFDocument.create(); let n = 0;
  for (const f of files) {
    if (f.type.startsWith('image/')) await addImagePage(out, f, { size: 'a4', margin: 20, q: .85 });
    else { const src = await loadLib(await f.arrayBuffer()); const pages = await out.copyPages(src, src.getPageIndices()); pages.forEach(p => out.addPage(p)); }
    prog('merge', ++n / files.length);
  }
  const bytes = await out.save();
  download(bytes, ($('#merge-name').value.trim() || 'tai_lieu_ghep') + '.pdf');
  msg('merge', 'ok', `✅ Đã ghép <b>${files.length}</b> file thành <b>${out.getPageCount()}</b> trang (${fmtSize(bytes.length)}). File đã được tải xuống.`);
});

/* ═════════════ 2. SẮP XẾP · XÓA · XOAY ═════════════ */
const PG = { buf: null, file: null, order: [] };
handlers.pages = async ([f]) => {
  msg('pages', 'info', '⏳ Đang đọc file…');
  PG.file = f; PG.buf = await f.arrayBuffer();
  const pdf = await loadJs(PG.buf);
  PG.order = Array.from({ length: pdf.numPages }, (_, i) => ({ i, rot: 0, del: false, thumb: '' }));
  $('#pages-info').hidden = false; $('#pages-bar').hidden = false; $('#pages-go').disabled = false;
  pagesRender(); msg('pages');
  for (const o of PG.order) { o.thumb = (await renderPage(pdf, o.i + 1, { maxW: 150 })).toDataURL('image/jpeg', .7); const img = $(`.pg[data-i="${o.i}"] img`); if (img) img.src = o.thumb; }
  pdf.destroy();
};
function pagesRender() {
  const kept = PG.order.filter(o => !o.del).length;
  $('#pages-info').innerHTML = `📄 <b>${esc(PG.file.name)}</b> · ${PG.order.length} trang · giữ lại <b>${kept}</b> trang`;
  const g = $('#pages-grid');
  g.innerHTML = PG.order.map((o, k) => `<div class="pg ${o.del ? 'del' : ''}" draggable="true" data-k="${k}" data-i="${o.i}">
    <div class="th"><img src="${o.thumb}" alt="" style="transform:rotate(${o.rot}deg)"></div>
    <div class="no">Trang ${o.i + 1}${k !== o.i ? ' → vị trí ' + (k + 1) : ''}</div>
    <div class="tools"><button data-a="l" title="Đưa lên trước">◀</button><button data-a="rl" title="Xoay trái">↺</button><button data-a="d" title="Xóa / giữ lại">🗑</button><button data-a="rr" title="Xoay phải">↻</button><button data-a="r" title="Đưa ra sau">▶</button></div></div>`).join('');
  $$('.pg', g).forEach(c => {
    const k = +c.dataset.k, o = PG.order[k];
    $$('button', c).forEach(b => b.onclick = e => {
      e.stopPropagation(); const a = b.dataset.a;
      if (a === 'rl') o.rot = (o.rot + 270) % 360; else if (a === 'rr') o.rot = (o.rot + 90) % 360; else if (a === 'd') o.del = !o.del;
      else { const j = k + (a === 'l' ? -1 : 1); if (j < 0 || j >= PG.order.length) return; [PG.order[k], PG.order[j]] = [PG.order[j], PG.order[k]]; }
      pagesRender();
    });
    c.ondragstart = e => { PG.drag = k; c.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; };
    c.ondragend = () => { c.classList.remove('dragging'); $$('.pg', g).forEach(x => x.classList.remove('dropL', 'dropR')); };
    c.ondragover = e => { e.preventDefault(); const r = c.getBoundingClientRect(), right = e.clientX > r.left + r.width / 2; c.classList.toggle('dropR', right); c.classList.toggle('dropL', !right); };
    c.ondragleave = () => c.classList.remove('dropL', 'dropR');
    c.ondrop = e => {
      e.preventDefault(); if (PG.drag == null) return;
      const r = c.getBoundingClientRect(), right = e.clientX > r.left + r.width / 2;
      const [m] = PG.order.splice(PG.drag, 1); let to = k + (right ? 1 : 0); if (PG.drag < to) to--;
      PG.order.splice(to, 0, m); PG.drag = null; pagesRender();
    };
  });
}
$$('[data-pa]').forEach(b => b.onclick = () => {
  const a = b.dataset.pa;
  if (a === 'rotL') PG.order.forEach(o => o.rot = (o.rot + 270) % 360);
  if (a === 'rotR') PG.order.forEach(o => o.rot = (o.rot + 90) % 360);
  if (a === 'rev') PG.order.reverse();
  if (a === 'reset') { PG.order.sort((x, y) => x.i - y.i); PG.order.forEach(o => { o.rot = 0; o.del = false; }); }
  pagesRender();
});
$('#pages-go').onclick = () => busy('pages', 'pages-go', async () => {
  const keep = PG.order.filter(o => !o.del);
  if (!keep.length) throw new Error('Thầy/cô đang xóa hết tất cả các trang.');
  const src = await loadLib(PG.buf), out = await PDFDocument.create();
  const pages = await out.copyPages(src, keep.map(o => o.i));
  pages.forEach((p, k) => { if (keep[k].rot) p.setRotation(degrees(((p.getRotation().angle || 0) + keep[k].rot) % 360)); out.addPage(p); });
  const bytes = await out.save();
  download(bytes, baseName(PG.file) + '_da_sap_xep.pdf');
  msg('pages', 'ok', `✅ Đã lưu file mới gồm <b>${keep.length}</b> trang (${fmtSize(bytes.length)}).`);
});

/* ═════════════ 3. TÁCH & TRÍCH TRANG ═════════════ */
const SP = { buf: null, file: null };
const spGrid = selectableGrid('split', 'split-range');
handlers.split = async ([f]) => {
  SP.file = f; SP.buf = await f.arrayBuffer(); const pdf = await loadJs(SP.buf);
  $('#split-info').hidden = false; $('#split-info').innerHTML = `📄 <b>${esc(f.name)}</b> · ${pdf.numPages} trang · ${fmtSize(f.size)}`;
  $('#split-go').disabled = false; await spGrid.load(pdf); pdf.destroy();
};
$('#split-mode').onchange = e => $('#split-n-wrap').style.display = e.target.value === 'everyN' ? '' : 'none';
$('#split-all').onclick = () => { spGrid.sel = new Set(Array.from({ length: spGrid.total }, (_, i) => i + 1)); spGrid.sync(); };
$('#split-none').onclick = () => { spGrid.sel.clear(); spGrid.sync(); };
$('#split-odd').onclick = () => { spGrid.sel = new Set(Array.from({ length: spGrid.total }, (_, i) => i + 1).filter(n => n % 2)); spGrid.sync(); };
$('#split-even').onclick = () => { spGrid.sel = new Set(Array.from({ length: spGrid.total }, (_, i) => i + 1).filter(n => !(n % 2))); spGrid.sync(); };
$('#split-go').onclick = () => busy('split', 'split-go', async () => {
  const src = await loadLib(SP.buf), total = src.getPageCount(), mode = $('#split-mode').value, base = baseName(SP.file);
  let groups = [];
  const ranges = parseRanges($('#split-range').value, total);
  if (mode === 'everyN') { const n = Math.max(1, +$('#split-n').value || 1); for (let a = 1; a <= total; a += n) groups.push([a, Math.min(total, a + n - 1)]); groups = groups.map(([a, b]) => ({ pages: rng(a, b), name: `${base}_trang_${a}-${b}.pdf` })); }
  else {
    if (!ranges.length && mode !== 'each') throw new Error('Thầy/cô chưa chọn trang nào (bấm vào trang hoặc gõ khoảng trang).');
    if (mode === 'one') groups = [{ pages: ranges.flatMap(([a, b]) => rng(a, b)), name: `${base}_trich_trang.pdf` }];
    if (mode === 'ranges') groups = ranges.map(([a, b]) => ({ pages: rng(a, b), name: `${base}_trang_${a === b ? a : a + '-' + b}.pdf` }));
    if (mode === 'each') { const list = ranges.length ? ranges.flatMap(([a, b]) => rng(a, b)) : rng(1, total); groups = list.map(n => ({ pages: [n], name: `${base}_trang_${String(n).padStart(2, '0')}.pdf` })); }
  }
  const outs = []; let k = 0;
  for (const g of groups) {
    const d = await PDFDocument.create(); (await d.copyPages(src, g.pages.map(n => n - 1))).forEach(p => d.addPage(p));
    outs.push({ name: g.name, bytes: await d.save() }); prog('split', ++k / groups.length);
  }
  await downloadMany(outs, base + '_tach.zip');
  msg('split', 'ok', `✅ Đã tạo <b>${outs.length}</b> file${outs.length > 1 ? ' (nén chung trong 1 file ZIP)' : ''}.`);
});
function rng(a, b) { return Array.from({ length: b - a + 1 }, (_, i) => a + i); }

/* ═════════════ xử lý hàng loạt ═════════════ */
async function batchRun(id, files, suffix, fn) {
  const outs = []; let k = 0;
  for (const f of files) {
    const doc = await loadLib(await f.arrayBuffer());
    await fn(doc, f);
    outs.push({ name: baseName(f) + suffix + '.pdf', bytes: await doc.save() });
    prog(id, ++k / files.length);
  }
  await downloadMany(outs, 'ket_qua' + suffix + '.zip');
  msg(id, 'ok', `✅ Đã xử lý <b>${outs.length}</b> file${outs.length > 1 ? ' – tải về chung trong 1 file ZIP' : ''}.`);
}
const enableWhen = (id, btn) => makeList(id, { onChange: it => $('#' + btn).disabled = !it.filter(i => !i.bad).length });

/* ═════════════ 4. ĐÁNH SỐ TRANG ═════════════ */
const pnL = enableWhen('pagenum', 'pagenum-go');
handlers.pagenum = f => pnL.add(f);
$('#pagenum-go').onclick = () => busy('pagenum', 'pagenum-go', () => batchRun('pagenum', okFiles(pnL), '_so_trang', async doc => {
  const font = await vnFont(doc, false), size = +$('#pn-size').value || 11, color = hexRGB($('#pn-color').value);
  const fmt = $('#pn-fmt').value, start = +$('#pn-start').value || 1, skip = $('#pn-skip').checked, where = posOf('pn-pos');
  const pages = doc.getPages(), t = pages.length - (skip ? 1 : 0) + start - 1;
  pages.forEach((pg, i) => {
    if (skip && i === 0) return;
    const n = start + i - (skip ? 1 : 0), text = fmt.replace('{n}', n).replace('{t}', t);
    const v = vis(pg), w = font.widthOfTextAtSize(text, size), pos = place(where, v.W, v.H, w, size, 22);
    drawT(pg, text, pos.x, pos.y, { font, size, color });
  });
}));

/* ═════════════ 5. CHÈN CHỮ ═════════════ */
const txL = enableWhen('text', 'text-go');
handlers.text = f => txL.add(f);
$('#tx-fill').onclick = () => {
  let s = {}; try { s = JSON.parse(localStorage.getItem('etv1_settings') || '{}'); } catch (e) { }
  const lines = [];
  if (s.name) lines.push('Giáo viên: ' + s.name);
  if (s.school) lines.push(s.school);
  if (!lines.length) { msg('text', 'info', 'Chưa có hồ sơ – thầy/cô vào ⚙️ Cài đặt hồ sơ ở trang chính để điền họ tên, trường.'); return; }
  $('#tx-content').value = lines.join('\n');
};
$$('[data-ins]').forEach(c => c.onclick = () => { const t = $('#tx-content'); t.value = (t.value ? t.value.replace(/\s+$/, '') + '\n' : '') + c.dataset.ins; });
$('#text-go').onclick = () => busy('text', 'text-go', async () => {
  const lines = $('#tx-content').value.split('\n').map(s => s.trimEnd()).filter(s => s.trim());
  if (!lines.length) throw new Error('Thầy/cô chưa nhập nội dung cần chèn.');
  await batchRun('text', okFiles(txL), '_chen_chu', async doc => {
    const font = await vnFont(doc, $('#tx-bold').value === '1'), size = +$('#tx-size').value || 11, color = hexRGB($('#tx-color').value);
    const where = posOf('tx-pos'), apply = $('#tx-apply').value, pages = doc.getPages();
    const targets = apply === 'first' ? [pages[0]] : apply === 'last' ? [pages[pages.length - 1]] : pages;
    const lh = size * 1.35, widths = lines.map(l => font.widthOfTextAtSize(l, size)), bw = Math.max(...widths), bh = lh * (lines.length - 1) + size;
    targets.forEach(pg => {
      const v = vis(pg), box = place(where, v.W, v.H, bw, bh, 22);
      lines.forEach((l, i) => {
        const x = box.hz === 'l' ? box.x : box.hz === 'r' ? box.x + bw - widths[i] : box.x + (bw - widths[i]) / 2;
        const y = box.y + bh - size - i * lh;
        drawT(pg, l, x, y, { font, size, color });
      });
    });
  });
});

/* ═════════════ 6. LOGO ═════════════ */
const lgL = makeList('logo', { onChange: () => lgCheck() });
const LG = { png: null, ratio: 1 };
function lgCheck() { $('#logo-go').disabled = !(LG.png && okFiles(lgL).length); }
async function toPNG(src, maxSide = 1200) {
  const img = await loadImage(src), s = Math.min(1, maxSide / Math.max(img.width, img.height));
  const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); return c.toDataURL('image/png');
}
async function setLogo(dataURL) {
  LG.png = dataURL; const img = await loadImage(dataURL); LG.ratio = img.height / img.width;
  $('#logo-prev').innerHTML = `<img src="${dataURL}" style="max-height:70px;max-width:100%"><div class="hint">Bấm để đổi logo</div>`; lgCheck();
}
handlers.logoimg = async ([f]) => { const d = await toPNG(fileURL(f), 800); await setLogo(d); try { localStorage.setItem('pdf_logo', d); } catch (e) { } };
handlers.logo = f => lgL.add(f);
try { const d = localStorage.getItem('pdf_logo'); if (d) setLogo(d); } catch (e) { }
$('#lg-w').oninput = e => $('#lg-wv').textContent = e.target.value;
$('#lg-o').oninput = e => $('#lg-ov').textContent = e.target.value;
$('#logo-go').onclick = () => busy('logo', 'logo-go', () => batchRun('logo', okFiles(lgL), '_logo', async doc => {
  const img = await doc.embedPng(LG.png), w = +$('#lg-w').value * MM, h = w * LG.ratio, op = +$('#lg-o').value / 100, where = posOf('lg-pos');
  const pages = doc.getPages(), targets = $('#lg-apply').value === 'first' ? [pages[0]] : pages;
  targets.forEach(pg => { const v = vis(pg), p = place(where, v.W, v.H, w, h, 18); drawI(pg, img, p.x, p.y, w, h, op); });
}));

/* ═════════════ 7. CHỮ KÝ ═════════════ */
const SG = { srcImg: null, png: null, ratio: .4, buf: null, file: null, pdf: null, fx: null, fy: null };
$$('[data-sigmode]').forEach(c => c.onclick = () => {
  $$('[data-sigmode]').forEach(x => x.classList.toggle('on', x === c));
  $('#sig-img-wrap').hidden = c.dataset.sigmode !== 'img'; $('#sig-draw-wrap').hidden = c.dataset.sigmode !== 'draw';
});
function processSig() {
  if (!SG.srcImg) return;
  const img = SG.srcImg, s = Math.min(1, 1400 / Math.max(img.width, img.height));
  const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
  const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, c.width, c.height);
  const d = ctx.getImageData(0, 0, c.width, c.height), px = d.data, th = +$('#sig-th').value, col = $('#sig-color').value;
  const cr = col === 'keep' ? null : [parseInt(col.slice(1, 3), 16), parseInt(col.slice(3, 5), 16), parseInt(col.slice(5, 7), 16)];
  let minX = c.width, minY = c.height, maxX = -1, maxY = -1;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
    const i = (y * c.width + x) * 4, a0 = px[i + 3] / 255, lum = (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) * a0 + 255 * (1 - a0);
    if (lum >= th) { px[i + 3] = 0; continue; }
    const a = Math.min(1, (th - lum) / (th * 0.55));
    px[i + 3] = Math.round(255 * a);
    if (cr) { px[i] = cr[0]; px[i + 1] = cr[1]; px[i + 2] = cr[2]; }
    if (a > .15) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  }
  ctx.putImageData(d, 0, 0);
  if (maxX < 0) { SG.png = null; $('#sig-prev').innerHTML = '<span class="hint">Không thấy nét ký – thử tăng “độ nhạy”.</span>'; signCheck(); return; }
  const pad = 6; minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad); maxX = Math.min(c.width - 1, maxX + pad); maxY = Math.min(c.height - 1, maxY + pad);
  const o = document.createElement('canvas'); o.width = maxX - minX + 1; o.height = maxY - minY + 1;
  o.getContext('2d').drawImage(c, minX, minY, o.width, o.height, 0, 0, o.width, o.height);
  SG.png = o.toDataURL('image/png'); SG.ratio = o.height / o.width;
  $('#sig-prev').innerHTML = `<img src="${SG.png}" alt="Chữ ký">`; $('#sg-sig').src = SG.png; signPreview(); signCheck();
}
handlers.sigimg = async ([f]) => { SG.srcImg = await loadImage(fileURL(f)); processSig(); };
$('#sig-th').oninput = e => { $('#sig-thv').textContent = e.target.value; processSig(); };
$('#sig-color').onchange = processSig;
(function pad() {
  const c = $('#sig-pad'), ctx = c.getContext('2d'); let drawing = false, last = null;
  const clear = () => { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }; clear();
  const pt = e => { const r = c.getBoundingClientRect(); return { x: (e.clientX - r.left) * c.width / r.width, y: (e.clientY - r.top) * c.height / r.height }; };
  c.onpointerdown = e => { drawing = true; last = pt(e); c.setPointerCapture(e.pointerId); };
  c.onpointermove = e => { if (!drawing) return; const p = pt(e); ctx.strokeStyle = '#111'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last = p; };
  c.onpointerup = () => drawing = false;
  $('#sig-clear').onclick = clear;
  $('#sig-use').onclick = async () => { SG.srcImg = await loadImage(c.toDataURL('image/png')); processSig(); };
})();
$('#sig-save').onclick = () => { if (!SG.png) return; try { localStorage.setItem('pdf_sig', SG.png); msg('sign', 'ok', '✅ Đã lưu chữ ký trên máy này – lần sau tự hiện lại.'); } catch (e) { msg('sign', 'err', 'Không lưu được (ảnh quá lớn).'); } };
try { const s = localStorage.getItem('pdf_sig'); if (s) loadImage(s).then(i => { SG.png = s; SG.ratio = i.height / i.width; $('#sig-prev').innerHTML = `<img src="${s}" alt="">`; $('#sg-sig').src = s; }); } catch (e) { }
handlers.sign = async ([f]) => {
  SG.file = f; SG.buf = await f.arrayBuffer(); if (SG.pdf) SG.pdf.destroy(); SG.pdf = await loadJs(SG.buf);
  const sel = $('#sg-page'); sel.innerHTML = Array.from({ length: SG.pdf.numPages }, (_, i) => `<option value="${i + 1}">Trang ${i + 1}</option>`).join('');
  sel.value = SG.pdf.numPages; // chữ ký thường ở trang cuối
  $('#sign-ctl').hidden = false; $('#sign-hint').hidden = false; $('#sg-stage').hidden = false; SG.fx = null; await signShowPage();
};
async function signShowPage() {
  const c = await renderPage(SG.pdf, +$('#sg-page').value, { maxW: 760 }), cv = $('#sg-canvas');
  cv.width = c.width; cv.height = c.height; cv.getContext('2d').drawImage(c, 0, 0); signPreview();
}
$('#sg-page').onchange = signShowPage;
$('#sg-w').oninput = e => { $('#sg-wv').textContent = e.target.value; signPreview(); };
$('#sg-stage').onclick = e => { const r = $('#sg-canvas').getBoundingClientRect(); SG.fx = (e.clientX - r.left) / r.width; SG.fy = (e.clientY - r.top) / r.height; signPreview(); signCheck(); };
function signPreview() {
  const s = $('#sg-sig'), cv = $('#sg-canvas');
  if (SG.fx == null || !SG.png) { s.hidden = true; return; }
  const cw = cv.clientWidth, ch = cv.clientHeight, w = cw * (+$('#sg-w').value / 100), h = w * SG.ratio;
  Object.assign(s.style, { width: w + 'px', height: h + 'px', left: (SG.fx * cw - w / 2) + 'px', top: (SG.fy * ch - h / 2) + 'px' }); s.hidden = false;
}
function signCheck() { $('#sign-go').disabled = !(SG.png && SG.buf && SG.fx != null); }
addEventListener('resize', signPreview);
$('#sign-go').onclick = () => busy('sign', 'sign-go', async () => {
  const doc = await loadLib(SG.buf), img = await doc.embedPng(SG.png), pages = doc.getPages(), ap = $('#sg-apply').value;
  const targets = ap === 'all' ? pages : ap === 'last' ? [pages[pages.length - 1]] : [pages[+$('#sg-page').value - 1]];
  targets.forEach(pg => { const v = vis(pg), w = v.W * (+$('#sg-w').value / 100), h = w * SG.ratio; drawI(pg, img, SG.fx * v.W - w / 2, v.H - SG.fy * v.H - h / 2, w, h); });
  const bytes = await doc.save(); download(bytes, baseName(SG.file) + '_da_ky.pdf');
  msg('sign', 'ok', `✅ Đã chèn chữ ký vào <b>${targets.length}</b> trang.`);
});

/* ═════════════ 8. ĐÓNG DẤU CHÌM ═════════════ */
const stL = enableWhen('stamp', 'stamp-go');
handlers.stamp = f => stL.add(f);
$$('[data-st]').forEach(c => c.onclick = () => $('#st-text').value = c.dataset.st);
$('#st-size').oninput = e => $('#st-sv').textContent = e.target.value;
$('#st-op').oninput = e => $('#st-ov').textContent = e.target.value;
$('#stamp-go').onclick = () => busy('stamp', 'stamp-go', async () => {
  const text = $('#st-text').value.trim(); if (!text) throw new Error('Thầy/cô chưa nhập nội dung dấu.');
  await batchRun('stamp', okFiles(stL), '_dong_dau', async doc => {
    const font = await vnFont(doc, true), size = +$('#st-size').value, opacity = +$('#st-op').value / 100, color = hexRGB($('#st-color').value), mode = $('#st-mode').value;
    const tw = font.widthOfTextAtSize(text, size);
    doc.getPages().forEach(pg => {
      const v = vis(pg);
      const stampAt = (cx, cy, deg) => {
        const a = deg * Math.PI / 180, ox = Math.cos(a) * tw / 2 - Math.sin(a) * size * .35, oy = Math.sin(a) * tw / 2 + Math.cos(a) * size * .35;
        drawT(pg, text, cx - ox, cy - oy, { font, size, color, opacity, rot: deg });
      };
      if (mode === 'tile') {
        const stepX = tw + size * 2, stepY = size * 4;
        for (let y = -v.H * .2, r = 0; y < v.H * 1.2; y += stepY, r++) for (let x = (r % 2) * stepX / 2 - v.W * .2; x < v.W * 1.2; x += stepX) stampAt(x, y, 30);
      } else {
        const deg = mode === 'flat' ? 0 : Math.atan2(v.H, v.W) * 180 / Math.PI;
        stampAt(v.W / 2, v.H / 2, deg);
      }
    });
  });
});

/* ═════════════ 9. ẢNH → PDF ═════════════ */
const ipL = enableWhen('img2pdf', 'img2pdf-go');
handlers.img2pdf = f => ipL.add(f.filter(x => x.type.startsWith('image/')));
$('#img2pdf-clear').onclick = () => { ipL.items = []; ipL.render(); msg('img2pdf'); };
async function addImagePage(doc, file, { size, margin, q }) {
  const img = await loadImage(fileURL(file)), s = Math.min(1, 2400 / Math.max(img.width, img.height));
  const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
  const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
  const jpg = await doc.embedJpg(await (await canvasBlob(c, 'image/jpeg', q)).arrayBuffer());
  let PW, PH;
  if (size === 'fit') { PW = c.width * 72 / 96 / s; PH = c.height * 72 / 96 / s; const k = Math.min(1, 1440 / Math.max(PW, PH)); PW *= k; PH *= k; PW += margin * 2; PH += margin * 2; }
  else { const land = c.width > c.height; PW = land ? 841.89 : 595.28; PH = land ? 595.28 : 841.89; }
  const page = doc.addPage([PW, PH]), k = Math.min((PW - margin * 2) / c.width, (PH - margin * 2) / c.height);
  const w = c.width * k, h = c.height * k; page.drawImage(jpg, { x: (PW - w) / 2, y: (PH - h) / 2, width: w, height: h });
}
$('#img2pdf-go').onclick = () => busy('img2pdf', 'img2pdf-go', async () => {
  const files = okFiles(ipL), doc = await PDFDocument.create(), opt = { size: $('#ip-size').value, margin: +$('#ip-margin').value, q: +$('#ip-q').value };
  let k = 0; for (const f of files) { await addImagePage(doc, f, opt); prog('img2pdf', ++k / files.length); }
  const bytes = await doc.save(); download(bytes, ($('#ip-name').value.trim() || 'anh_sang_pdf') + '.pdf');
  msg('img2pdf', 'ok', `✅ Đã tạo PDF <b>${files.length}</b> trang (${fmtSize(bytes.length)}).`);
});

/* ═════════════ 10. PDF → ẢNH ═════════════ */
const PI = { buf: null, file: null };
const piGrid = selectableGrid('pdf2img', 'pi-range');
handlers.pdf2img = async ([f]) => {
  PI.file = f; PI.buf = await f.arrayBuffer(); const pdf = await loadJs(PI.buf);
  $('#pdf2img-info').hidden = false; $('#pdf2img-info').innerHTML = `📄 <b>${esc(f.name)}</b> · ${pdf.numPages} trang · bấm vào trang để chọn (không chọn = tất cả)`;
  $('#pdf2img-go').disabled = false; await piGrid.load(pdf); pdf.destroy();
};
$('#pdf2img-go').onclick = () => busy('pdf2img', 'pdf2img-go', async () => {
  const pdf = await loadJs(PI.buf), total = pdf.numPages, type = $('#pi-fmt').value, ext = type === 'image/png' ? 'png' : 'jpg', scale = +$('#pi-scale').value;
  const ranges = parseRanges($('#pi-range').value, total), list = ranges.length ? [...new Set(ranges.flatMap(([a, b]) => rng(a, b)))] : rng(1, total);
  const outs = []; let k = 0;
  for (const n of list) {
    const c = await renderPage(pdf, n, { scale }); const b = await canvasBlob(c, type, .9);
    outs.push({ name: `${baseName(PI.file)}_trang_${String(n).padStart(2, '0')}.${ext}`, bytes: b, type }); prog('pdf2img', ++k / list.length);
  }
  pdf.destroy(); await downloadMany(outs, baseName(PI.file) + '_anh.zip');
  msg('pdf2img', 'ok', `✅ Đã chuyển <b>${outs.length}</b> trang thành ảnh ${ext.toUpperCase()}${outs.length > 1 ? ' (trong 1 file ZIP)' : ''}.`);
});

/* ═════════════ 11. NÉN PDF ═════════════ */
const CP = { buf: null, file: null, lv: 'mid' };
const LV = { light: { s: 1.7, q: .72 }, mid: { s: 1.35, q: .6 }, strong: { s: 1.0, q: .45 } };
$$('#cp-level .chip').forEach(c => c.onclick = () => { CP.lv = c.dataset.lv; $$('#cp-level .chip').forEach(x => x.classList.toggle('on', x === c)); });
handlers.compress = async ([f]) => {
  CP.file = f; CP.buf = await f.arrayBuffer(); const pdf = await loadJs(CP.buf);
  $('#compress-info').hidden = false; $('#compress-info').innerHTML = `📄 <b>${esc(f.name)}</b> · ${pdf.numPages} trang · <b>${fmtSize(f.size)}</b>`;
  $('#cp-cmp').hidden = false; $('#cp-before').textContent = fmtSize(f.size); $('#cp-after').textContent = '–';
  $('#compress-go').disabled = false; pdf.destroy(); msg('compress');
};
$('#compress-go').onclick = () => busy('compress', 'compress-go', async () => {
  const pdf = await loadJs(CP.buf), out = await PDFDocument.create(), lv = LV[CP.lv];
  for (let n = 1; n <= pdf.numPages; n++) {
    const pg = await pdf.getPage(n), vp = pg.getViewport({ scale: 1 }); pg.cleanup();
    const c = await renderPage(pdf, n, { scale: lv.s });
    const jpg = await out.embedJpg(await (await canvasBlob(c, 'image/jpeg', lv.q)).arrayBuffer());
    out.addPage([vp.width, vp.height]).drawImage(jpg, { x: 0, y: 0, width: vp.width, height: vp.height });
    prog('compress', n / pdf.numPages); if (n % 5 === 0) await wait(0);
  }
  pdf.destroy();
  const bytes = await out.save(), before = CP.file.size, after = bytes.length;
  $('#cp-after').textContent = fmtSize(after);
  if (after >= before * 0.95) { msg('compress', 'info', 'ℹ️ File gốc đã khá nhẹ, nén thêm không giảm được dung lượng. Thầy/cô có thể dùng luôn file gốc.'); return; }
  download(bytes, baseName(CP.file) + '_da_nen.pdf');
  msg('compress', 'ok', `✅ Đã nén từ <b>${fmtSize(before)}</b> xuống <b>${fmtSize(after)}</b> (giảm ${Math.round((1 - after / before) * 100)}%).`);
});
