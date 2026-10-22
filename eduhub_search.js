/* ═══════════════════════════════════════════════════════════════
   EduTeacher Hub – Tìm kiếm nhanh (Ctrl+K) · Yêu thích · Dùng gần đây
   Tự đọc toàn bộ công cụ / mô phỏng / trò chơi có trên trang chính.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var FAV = 'ehs_favs', REC = 'ehs_recent', MAX_REC = 8;
  function lsGet(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/\s+/g, ' ').trim(); }

  /* ---------- lập chỉ mục ---------- */
  var ITEMS = [];
  function sectionName(el) {
    var page = el.closest('.page'); if (!page) return '';
    var h = page.querySelector('.tool-hub-title'); var grp = '';
    // tiêu đề nhóm (h3) gần nhất phía trước lưới
    var grid = el.closest('.tool-hub-grid'), prev = grid && grid.previousElementSibling;
    while (prev && prev.tagName !== 'H3' && !prev.classList.contains('tool-hub-grid')) prev = prev.previousElementSibling;
    if (prev && prev.tagName === 'H3') grp = prev.textContent.trim();
    var t = h ? h.textContent.trim() : '';
    return grp ? t.replace(/^[^\wÀ-ỹ]+/, '') + ' · ' + grp : t;
  }
  function iconOf(sec) {
    var n = norm(sec);
    if (n.indexOf('tro choi') >= 0) return '🎮';
    if (n.indexOf('mo phong') >= 0) return '🔬';
    if (n.indexOf('cong cu') >= 0) return '🛠️';
    return '📌';
  }
  function build() {
    ITEMS = [];
    document.querySelectorAll('.tool-card[onclick]').forEach(function (c) {
      var m = (c.getAttribute('onclick') || '').match(/window\.open\('([^']+)'/);
      if (!m) return;
      var t = c.querySelector('.tool-card-title'), d = c.querySelector('.tool-card-desc'), sec = sectionName(c);
      ITEMS.push({ id: m[1], url: m[1], title: t ? t.textContent.trim() : m[1], desc: d ? d.textContent.trim() : '', sec: sec, icon: iconOf(sec), el: c });
    });
    document.querySelectorAll('.nav-sub-item[onclick]').forEach(function (n) {
      var title = n.textContent.replace(/\s+/g, ' ').trim(), grp = n.closest('.nav-group');
      var g = grp && grp.querySelector('.gh-label') ? grp.querySelector('.gh-label').textContent.trim() : '';
      ITEMS.push({ id: 'nav:' + title, nav: n, title: title.replace(/^[^\wÀ-ỹ]+/, ''), desc: 'Mục trong trang chính', sec: g, icon: '📂' });
    });
    ITEMS.forEach(function (it) { it.key = norm(it.title + ' ' + it.desc + ' ' + it.sec); });
  }
  function byId(id) { for (var i = 0; i < ITEMS.length; i++) if (ITEMS[i].id === id) return ITEMS[i]; return null; }

  /* ---------- mở & ghi nhận gần đây ---------- */
  function pushRecent(id) { var r = lsGet(REC, []).filter(function (x) { return x !== id; }); r.unshift(id); lsSet(REC, r.slice(0, MAX_REC)); renderQuick(); }
  function openItem(it) {
    pushRecent(it.id); close();
    if (it.nav) it.nav.click(); else window.open(it.url, '_blank');
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest('.ehs-star')) return;
    var c = e.target.closest('.tool-card[onclick]'); if (!c) return;
    var m = (c.getAttribute('onclick') || '').match(/window\.open\('([^']+)'/); if (m) pushRecent(m[1]);
  }, true);

  /* ---------- yêu thích (ngôi sao trên mỗi thẻ) ---------- */
  function isFav(id) { return lsGet(FAV, []).indexOf(id) >= 0; }
  function toggleFav(id) { var f = lsGet(FAV, []), i = f.indexOf(id); if (i >= 0) f.splice(i, 1); else f.unshift(id); lsSet(FAV, f); paintStars(); renderQuick(); }
  function addStars() {
    ITEMS.forEach(function (it) {
      if (!it.el || it.el.querySelector('.ehs-star')) return;
      var b = document.createElement('button'); b.type = 'button'; b.className = 'ehs-star'; b.dataset.id = it.id;
      b.onclick = function (e) { e.stopPropagation(); e.preventDefault(); toggleFav(it.id); };
      if (getComputedStyle(it.el).position === 'static') it.el.style.position = 'relative';
      it.el.appendChild(b);
    });
    paintStars();
  }
  function paintStars() {
    document.querySelectorAll('.ehs-star').forEach(function (b) { var on = isFav(b.dataset.id); b.classList.toggle('on', on); b.textContent = on ? '★' : '☆'; b.title = on ? 'Bỏ khỏi Yêu thích' : 'Thêm vào Yêu thích'; });
  }

  /* ---------- khu “Yêu thích & Gần đây” trên trang chào ---------- */
  function chip(it) { return '<button class="ehs-qc" data-id="' + esc(it.id) + '"><span>' + it.icon + '</span>' + esc(it.title) + '</button>'; }
  function renderQuick() {
    var box = document.getElementById('ehs-quick'); if (!box) return;
    var favs = lsGet(FAV, []).map(byId).filter(Boolean), rec = lsGet(REC, []).map(byId).filter(Boolean).slice(0, 6);
    var h = '';
    if (favs.length) h += '<div class="ehs-qrow"><div class="ehs-qt">⭐ Yêu thích</div><div class="ehs-qlist">' + favs.map(chip).join('') + '</div></div>';
    if (rec.length) h += '<div class="ehs-qrow"><div class="ehs-qt">🕘 Dùng gần đây</div><div class="ehs-qlist">' + rec.map(chip).join('') + '</div></div>';
    if (!h) h = '<div class="ehs-qempty">💡 Bấm ☆ trên mỗi công cụ để ghim vào mục <b>Yêu thích</b> – lần sau mở là thấy ngay.</div>';
    box.innerHTML = h;
    box.querySelectorAll('.ehs-qc').forEach(function (b) { b.onclick = function () { var it = byId(b.dataset.id); if (it) openItem(it); }; });
  }

  /* ---------- bảng tìm kiếm ---------- */
  var ov = null, sel = 0, shown = [];
  function open(q) {
    if (!ITEMS.length) build();
    if (ov) { ov.querySelector('input').focus(); return; }
    ov = document.createElement('div'); ov.className = 'ehs-ov';
    ov.innerHTML = '<div class="ehs-box" role="dialog" aria-label="Tìm kiếm công cụ"><div class="ehs-in"><span>🔍</span><input type="text" placeholder="Gõ tên công cụ, môn học… (vd: pdf, điểm, phân số, tiếng anh)" autocomplete="off"><kbd>Esc</kbd></div><div class="ehs-res"></div><div class="ehs-foot"><span>↑↓ chọn</span><span>Enter mở</span><span>Ctrl + K để mở nhanh</span></div></div>';
    document.body.appendChild(ov);
    var inp = ov.querySelector('input');
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    inp.addEventListener('input', function () { sel = 0; list(inp.value); });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { sel = Math.min(shown.length - 1, sel + 1); paint(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); paint(); e.preventDefault(); }
      else if (e.key === 'Enter') { if (shown[sel]) openItem(shown[sel]); }
      else if (e.key === 'Escape') close();
    });
    inp.value = q || ''; list(inp.value); inp.focus(); setTimeout(function () { inp.focus(); }, 30);
  }
  function close() { if (ov) { ov.remove(); ov = null; } }
  function score(it, words) {
    var s = 0;
    for (var i = 0; i < words.length; i++) {
      var w = words[i], k = it.key.indexOf(w); if (k < 0) return -1;
      var tn = norm(it.title); s += tn.indexOf(w) === 0 ? 30 : tn.indexOf(w) >= 0 ? 20 : 5;
    }
    if (isFav(it.id)) s += 3;
    return s;
  }
  function list(q) {
    var words = norm(q).split(' ').filter(Boolean), res, suggest = false;
    if (!words.length) {
      var favs = lsGet(FAV, []).map(byId).filter(Boolean), rec = lsGet(REC, []).map(byId).filter(Boolean);
      var seen = {}; res = favs.concat(rec).filter(function (x) { if (seen[x.id]) return false; seen[x.id] = 1; return true; });
      if (!res.length) { suggest = true; res = ITEMS.filter(function (x) { return x.url; }).slice(0, 8); }
    } else {
      res = ITEMS.map(function (it) { return { it: it, s: score(it, words) }; }).filter(function (x) { return x.s >= 0; })
        .sort(function (a, b) { return b.s - a.s; }).map(function (x) { return x.it; });
    }
    shown = res.slice(0, 40);
    var box = ov.querySelector('.ehs-res');
    box.innerHTML = shown.length ? (!words.length ? '<div class="ehs-gt">' + (suggest ? '💡 Gợi ý' : '⭐ Yêu thích & gần đây') + '</div>' : '') + shown.map(function (it, i) {
      return '<div class="ehs-r" data-i="' + i + '"><span class="ehs-ic">' + it.icon + '</span><div class="ehs-tx"><b>' + esc(it.title) + (isFav(it.id) ? ' <i>★</i>' : '') + '</b><span>' + esc(it.desc) + '</span></div><em>' + esc(it.sec) + '</em></div>';
    }).join('') : '<div class="ehs-none">Không tìm thấy “' + esc(q) + '”. Thử từ khóa khác nhé.</div>';
    box.querySelectorAll('.ehs-r').forEach(function (r) {
      r.onclick = function () { openItem(shown[+r.dataset.i]); };
      r.onmousemove = function () { if (sel !== +r.dataset.i) { sel = +r.dataset.i; paint(); } };
    });
    paint();
  }
  function paint() {
    if (!ov) return;
    ov.querySelectorAll('.ehs-r').forEach(function (r) { r.classList.toggle('on', +r.dataset.i === sel); });
    var on = ov.querySelector('.ehs-r.on'); if (on) on.scrollIntoView({ block: 'nearest' });
  }
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); open(); }
    else if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '') && !(document.activeElement || {}).isContentEditable) { e.preventDefault(); open(); }
  });

  /* ---------- CSS & nút trên thanh trên cùng ---------- */
  var CSS = '' +
    '.ehs-tb{display:flex;align-items:center;gap:8px;height:36px;padding:0 12px;border-radius:18px;border:1px solid var(--border,#e2e8f0);background:var(--white,#fff);color:var(--muted,#64748b);cursor:pointer;font-size:.82rem;min-width:210px}' +
    '.ehs-tb:hover{border-color:var(--blue,#3b7de9)}.ehs-tb kbd,.ehs-in kbd{margin-left:auto;font-size:.7rem;border:1px solid var(--border,#e2e8f0);border-radius:5px;padding:1px 6px;font-family:inherit}' +
    '@media(max-width:900px){.ehs-tb{min-width:0}.ehs-tb .t,.ehs-tb kbd{display:none}}' +
    '.ehs-star{position:absolute;top:8px;right:8px;width:28px;height:28px;border-radius:50%;border:none;background:rgba(255,255,255,.85);color:#94a3b8;font-size:1rem;cursor:pointer;z-index:2;opacity:0;transition:.15s;box-shadow:0 1px 4px rgba(0,0,0,.12)}' +
    '.tool-card:hover .ehs-star,.ehs-star.on{opacity:1}.ehs-star.on{color:#f59e0b}.ehs-star:hover{transform:scale(1.15)}' +
    '@media(hover:none){.ehs-star{opacity:1}}' +
    '.ehs-ov{position:fixed;inset:0;background:rgba(15,23,42,.5);z-index:9990;display:flex;justify-content:center;align-items:flex-start;padding:10vh 16px 16px;font-family:"Segoe UI",system-ui,sans-serif}' +
    '.ehs-box{width:100%;max-width:640px;background:#fff;color:#0f172a;border-radius:16px;box-shadow:0 24px 80px rgba(0,0,0,.35);overflow:hidden;display:flex;flex-direction:column;max-height:75vh}' +
    'body.dark .ehs-box{background:#1e293b;color:#e2e8f0}' +
    '.ehs-in{display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid rgba(100,116,139,.2);font-size:1.1rem}' +
    '.ehs-in input{flex:1;border:none;outline:none;background:none;font-size:1.02rem;color:inherit;font-family:inherit}' +
    '.ehs-res{overflow:auto;padding:6px}' +
    '.ehs-gt{font-size:.72rem;font-weight:700;color:#64748b;text-transform:uppercase;padding:8px 12px 4px}' +
    '.ehs-r{display:flex;align-items:center;gap:12px;padding:9px 12px;border-radius:10px;cursor:pointer}' +
    '.ehs-r.on{background:rgba(59,125,233,.12)}' +
    '.ehs-ic{font-size:1.2rem;width:28px;text-align:center}.ehs-tx{flex:1;min-width:0}.ehs-tx b{display:block;font-size:.92rem}.ehs-tx b i{color:#f59e0b;font-style:normal}' +
    '.ehs-tx span{display:block;font-size:.78rem;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.ehs-r em{font-style:normal;font-size:.7rem;color:#64748b;white-space:nowrap;max-width:170px;overflow:hidden;text-overflow:ellipsis}' +
    '.ehs-none{padding:24px;text-align:center;color:#64748b}' +
    '.ehs-foot{display:flex;gap:16px;padding:8px 16px;border-top:1px solid rgba(100,116,139,.2);font-size:.72rem;color:#64748b}' +
    '.ehs-hero{display:flex;align-items:center;gap:10px;width:100%;max-width:560px;margin:0 auto 28px;padding:14px 20px;border-radius:14px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#94a3b8;cursor:pointer;font-size:.95rem;font-family:inherit;transition:.2s}' +
    '.ehs-hero:hover{border-color:#38bdf8;background:rgba(56,189,248,.08)}.ehs-hero kbd{margin-left:auto;font-size:.72rem;border:1px solid rgba(255,255,255,.2);border-radius:5px;padding:2px 7px;font-family:inherit}' +
    '#ehs-quick{width:100%;max-width:760px;margin:0 auto 30px;display:flex;flex-direction:column;gap:12px}' +
    '.ehs-qrow{display:flex;flex-direction:column;gap:8px;align-items:center}.ehs-qt{font-size:.78rem;font-weight:700;color:#94a3b8;letter-spacing:.04em}' +
    '.ehs-qlist{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}' +
    '.ehs-qc{display:inline-flex;align-items:center;gap:6px;padding:7px 13px;border-radius:20px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#e2e8f0;cursor:pointer;font-size:.82rem;font-family:inherit}' +
    '.ehs-qc:hover{border-color:#fbbf24;background:rgba(251,191,36,.1)}' +
    '.ehs-qempty{color:#64748b;font-size:.82rem}';
  function init() {
    var s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s);
    build(); addStars(); renderQuick();
    var host = document.querySelector('.tb-right');
    if (host) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'ehs-tb'; b.title = 'Tìm công cụ (Ctrl + K)';
      b.innerHTML = '🔍 <span class="t">Tìm công cụ…</span><kbd>Ctrl K</kbd>'; b.onclick = function () { open(); };
      host.insertBefore(b, host.firstChild);
    }
    var hero = document.getElementById('ehs-hero'); if (hero) hero.onclick = function () { open(); };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.EHSearch = { open: open, rebuild: function () { build(); addStars(); renderQuick(); } };
})();
