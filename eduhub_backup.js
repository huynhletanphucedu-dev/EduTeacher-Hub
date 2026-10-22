/* ═══════════════════════════════════════════════════════════════
   EduTeacher Hub – Sao lưu & Khôi phục dữ liệu (chạy hoàn toàn offline)
   - Dữ liệu chỉ nằm trên máy giáo viên (localStorage), KHÔNG gửi lên mạng.
   - Tự động tạo 1 bản sao lưu mỗi ngày (nếu dữ liệu có thay đổi),
     giữ lại 30 ngày gần nhất trong IndexedDB của trình duyệt.
   - Tùy chọn: tự ghi file .json vào một thư mục trên máy
     (OneDrive / Google Drive / USB…) – Chrome & Edge.
   - Khôi phục từ bản sao lưu trong máy hoặc từ file .json.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.EHBackup) return;

  var DB_NAME = 'eduhub_backup', DB_VER = 1, KEEP_DAYS = 30;
  var OWN_PREFIX = 'ehb_';                 // khóa nội bộ, không sao lưu
  var APP_ID = 'EduTeacher Hub';
  var FILE_PREFIX = 'EduTeacherHub_saoluu_';
  var isTop = window === window.top;

  /* ---------- tiện ích ---------- */
  function pad(n) { return String(n).padStart(2, '0'); }
  function todayStr(d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function fmtDate(iso) { var d = new Date(iso); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function fmtSize(b) { return b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(2) + ' MB'; }
  function hash(str) { var h = 0x811c9dc5; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(16); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }

  /* ---------- IndexedDB ---------- */
  var dbP = null;
  function db() {
    if (dbP) return dbP;
    dbP = new Promise(function (res, rej) {
      var r = indexedDB.open(DB_NAME, DB_VER);
      r.onupgradeneeded = function () {
        var d = r.result;
        if (!d.objectStoreNames.contains('snaps')) d.createObjectStore('snaps', { keyPath: 'id' });
        if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv');
      };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
    return dbP;
  }
  function req(store, mode, fn) {
    return db().then(function (d) {
      return new Promise(function (res, rej) {
        var t = d.transaction(store, mode), s = t.objectStore(store), out = fn(s);
        t.oncomplete = function () { res(out && 'result' in out ? out.result : undefined); };
        t.onerror = function () { rej(t.error); };
      });
    });
  }
  var snaps = {
    put: function (v) { return req('snaps', 'readwrite', function (s) { return s.put(v); }); },
    get: function (id) { return req('snaps', 'readonly', function (s) { return s.get(id); }); },
    all: function () { return req('snaps', 'readonly', function (s) { return s.getAll(); }); },
    del: function (id) { return req('snaps', 'readwrite', function (s) { return s.delete(id); }); }
  };
  var kv = {
    get: function (k) { return req('kv', 'readonly', function (s) { return s.get(k); }); },
    set: function (k, v) { return req('kv', 'readwrite', function (s) { return s.put(v, k); }); },
    del: function (k) { return req('kv', 'readwrite', function (s) { return s.delete(k); }); }
  };

  /* ---------- thu thập dữ liệu ---------- */
  function collect() {
    var data = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(OWN_PREFIX) !== 0) data[k] = localStorage.getItem(k);
      }
    } catch (e) { }
    var sorted = {};
    Object.keys(data).sort().forEach(function (k) { sorted[k] = data[k]; });
    return sorted;
  }
  function makeFile(snap) {
    return JSON.stringify({ app: APP_ID, version: 1, created: snap.date, type: snap.type, keys: snap.keys, data: snap.data }, null, 1);
  }

  /* ---------- sao lưu ---------- */
  var busy = false;
  function snapshot(type, force) {
    if (busy) return Promise.resolve(null);
    var data = collect(), keys = Object.keys(data).length;
    if (!keys) return Promise.resolve(null);              // không có dữ liệu → bỏ qua
    var str = JSON.stringify(data), h = hash(str), today = todayStr();
    var id = type === 'daily' ? today : type + '-' + Date.now();
    busy = true;
    var p = (type === 'daily' && !force)
      ? snaps.get(today).then(function (old) { return old && old.hash === h ? null : true; })
      : Promise.resolve(true);
    return p.then(function (go) {
      if (!go) return null;
      var snap = { id: id, type: type, date: new Date().toISOString(), day: today, hash: h, keys: keys, size: str.length, data: data };
      return snaps.put(snap).then(function () {
        lsSet(OWN_PREFIX + 'last', snap.date);
        return prune().then(function () { return writeFolder(snap); }).then(function () { return snap; });
      });
    }).catch(function (e) { console.warn('[Sao lưu]', e); return null; })
      .then(function (r) { busy = false; refreshBadge(); return r; });
  }
  function prune() {
    var limit = new Date(); limit.setDate(limit.getDate() - KEEP_DAYS);
    var lim = todayStr(limit);
    return snaps.all().then(function (list) {
      var ps = [];
      list.forEach(function (s) { if (s.day < lim) ps.push(snaps.del(s.id)); });
      // giữ tối đa 10 bản thủ công / trước-khôi-phục
      var extra = list.filter(function (s) { return s.type !== 'daily' && s.day >= lim; })
        .sort(function (a, b) { return b.date.localeCompare(a.date); }).slice(10);
      extra.forEach(function (s) { ps.push(snaps.del(s.id)); });
      return Promise.all(ps);
    });
  }

  /* ---------- thư mục sao lưu (File System Access API) ---------- */
  var fsSupported = isTop && 'showDirectoryPicker' in window;
  var folderState = 'none';   // none | granted | prompt | unsupported
  function getDir() { return kv.get('dir').catch(function () { return null; }); }
  function checkFolder() {
    if (!('showDirectoryPicker' in window)) { folderState = 'unsupported'; return Promise.resolve(folderState); }
    return getDir().then(function (dir) {
      if (!dir) { folderState = 'none'; return folderState; }
      return dir.queryPermission({ mode: 'readwrite' }).then(function (p) { folderState = p === 'granted' ? 'granted' : 'prompt'; return folderState; });
    }).catch(function () { folderState = 'none'; return folderState; });
  }
  function writeFolder(snap) {
    return getDir().then(function (dir) {
      if (!dir) return;
      return dir.queryPermission({ mode: 'readwrite' }).then(function (p) {
        if (p !== 'granted') { folderState = 'prompt'; return; }
        folderState = 'granted';
        var name = FILE_PREFIX + (snap.type === 'daily' ? snap.day : snap.day + '_' + snap.type + '_' + snap.date.slice(11, 19).replace(/:/g, '')) + '.json';
        return dir.getFileHandle(name, { create: true }).then(function (fh) { return fh.createWritable(); })
          .then(function (w) { return w.write(makeFile(snap)).then(function () { return w.close(); }); })
          .then(function () { lsSet(OWN_PREFIX + 'folder_last', new Date().toISOString()); return pruneFolder(dir); });
      });
    }).catch(function (e) { console.warn('[Sao lưu thư mục]', e); });
  }
  function pruneFolder(dir) {
    if (!dir.entries) return;
    var limit = new Date(); limit.setDate(limit.getDate() - KEEP_DAYS);
    var lim = todayStr(limit), olds = [];
    var it = dir.entries();
    function step() {
      return it.next().then(function (r) {
        if (r.done) return Promise.all(olds.map(function (n) { return dir.removeEntry(n).catch(function () { }); }));
        var n = r.value[0], m = n.match(/^EduTeacherHub_saoluu_(\d{4}-\d{2}-\d{2})/);
        if (m && m[1] < lim) olds.push(n);
        return step();
      });
    }
    return step().catch(function () { });
  }
  function chooseFolder() {
    return window.showDirectoryPicker({ id: 'eduhub-backup', mode: 'readwrite', startIn: 'documents' })
      .then(function (dir) { return kv.set('dir', dir).then(function () { folderState = 'granted'; lsSet(OWN_PREFIX + 'folder_name', dir.name); return snapshot('manual', true); }); })
      .then(function () { toast('✅ Đã chọn thư mục sao lưu. Từ nay hệ thống tự ghi file mỗi ngày.'); render(); })
      .catch(function (e) { if (e && e.name !== 'AbortError') toast('⚠️ Không chọn được thư mục: ' + e.message); });
  }
  function regrant() {
    return getDir().then(function (dir) {
      if (!dir) return;
      return dir.requestPermission({ mode: 'readwrite' }).then(function (p) {
        folderState = p === 'granted' ? 'granted' : 'prompt';
        if (p === 'granted') return snapshot('daily', true).then(function () { toast('✅ Đã cấp quyền – đã ghi bản sao lưu vào thư mục.'); });
      });
    }).then(function () { refreshBadge(); render(); });
  }
  function forgetFolder() {
    return kv.del('dir').then(function () { folderState = 'none'; try { localStorage.removeItem(OWN_PREFIX + 'folder_name'); } catch (e) { } render(); refreshBadge(); });
  }

  /* ---------- tải file / khôi phục ---------- */
  function download(snap) {
    var blob = new Blob([makeFile(snap)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = FILE_PREFIX + snap.day + (snap.type === 'daily' ? '' : '_' + snap.type) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    lsSet(OWN_PREFIX + 'export_last', new Date().toISOString());
    refreshBadge();
  }
  function downloadNow() {
    var data = collect(), str = JSON.stringify(data);
    download({ type: 'thucong', day: todayStr(), date: new Date().toISOString(), keys: Object.keys(data).length, data: data, size: str.length });
  }
  function applyData(data, label) {
    var n = Object.keys(data).length;
    if (!confirm('Khôi phục dữ liệu từ ' + label + '?\n\n• ' + n + ' mục dữ liệu sẽ thay thế dữ liệu hiện tại.\n• Dữ liệu hiện tại sẽ được tự động sao lưu trước (loại "Trước khôi phục") để có thể quay lại.\n\nTiếp tục?')) return Promise.resolve(false);
    return snapshot('truockhoiphuc', true).then(function () {
      var cur = [];
      for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf(OWN_PREFIX) !== 0) cur.push(k); }
      cur.forEach(function (k) { localStorage.removeItem(k); });
      Object.keys(data).forEach(function (k) { if (k.indexOf(OWN_PREFIX) !== 0) localStorage.setItem(k, data[k]); });
      alert('✅ Đã khôi phục ' + n + ' mục dữ liệu. Trang sẽ tải lại.');
      location.reload();
      return true;
    }).catch(function (e) { alert('Lỗi khôi phục: ' + e.message); });
  }
  function restoreSnap(id) { return snaps.get(id).then(function (s) { if (s) return applyData(s.data, 'bản sao lưu ' + fmtDate(s.date)); }); }
  function restoreFile(file) {
    var r = new FileReader();
    r.onload = function () {
      try {
        var j = JSON.parse(r.result);
        if (!j || j.app !== APP_ID || typeof j.data !== 'object') throw new Error('File không phải bản sao lưu EduTeacher Hub.');
        applyData(j.data, 'file "' + file.name + '" (tạo lúc ' + fmtDate(j.created) + ')');
      } catch (e) { alert('⚠️ ' + e.message); }
    };
    r.readAsText(file);
  }

  /* ---------- giao diện ---------- */
  var CSS = '' +
    '.ehb-btn{position:relative;width:36px;height:36px;border-radius:50%;border:none;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#10b981,#0ea5e9);color:#fff;box-shadow:0 2px 8px rgba(16,185,129,.3);transition:transform .15s}' +
    '.ehb-btn:hover{transform:scale(1.08)}' +
    '.ehb-dot{position:absolute;top:-2px;right:-2px;width:12px;height:12px;border-radius:50%;border:2px solid #fff;background:#10b981}' +
    '.ehb-dot.warn{background:#f59e0b}.ehb-dot.bad{background:#ef4444}' +
    '.ehb-ov{position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;font-family:"Segoe UI",system-ui,sans-serif}' +
    '.ehb-m{background:#fff;color:#0f172a;width:100%;max-width:680px;max-height:92vh;overflow:auto;border-radius:16px;box-shadow:0 20px 70px rgba(0,0,0,.35)}' +
    'body.dark .ehb-m{background:#1e293b;color:#e2e8f0}' +
    '.ehb-h{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid rgba(100,116,139,.2);position:sticky;top:0;background:inherit;z-index:1}' +
    '.ehb-h b{font-size:1.1rem}.ehb-x{border:none;background:none;font-size:1.3rem;cursor:pointer;color:inherit}' +
    '.ehb-b{padding:18px 22px;display:flex;flex-direction:column;gap:16px;font-size:14px}' +
    '.ehb-note{background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.35);border-radius:10px;padding:10px 14px;line-height:1.5}' +
    '.ehb-card{border:1px solid rgba(100,116,139,.25);border-radius:12px;padding:14px 16px}' +
    '.ehb-card h4{margin:0 0 8px;font-size:.95rem}' +
    '.ehb-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}' +
    '.ehb-bt{border:none;border-radius:8px;padding:8px 14px;font-size:.85rem;font-weight:600;cursor:pointer;background:#3b7de9;color:#fff}' +
    '.ehb-bt.g{background:#10b981}.ehb-bt.o{background:#f59e0b}.ehb-bt.l{background:rgba(100,116,139,.15);color:inherit}.ehb-bt.s{padding:5px 10px;font-size:.78rem}' +
    '.ehb-muted{color:#64748b;font-size:.82rem;line-height:1.5}body.dark .ehb-muted{color:#94a3b8}' +
    '.ehb-tbl{width:100%;border-collapse:collapse;font-size:.83rem}.ehb-tbl td,.ehb-tbl th{padding:7px 6px;border-bottom:1px solid rgba(100,116,139,.18);text-align:left}' +
    '.ehb-tbl th{font-size:.75rem;text-transform:uppercase;color:#64748b}' +
    '.ehb-tag{display:inline-block;padding:2px 8px;border-radius:20px;font-size:.72rem;font-weight:700;background:rgba(59,125,233,.15);color:#3b7de9}' +
    '.ehb-tag.m{background:rgba(16,185,129,.15);color:#059669}.ehb-tag.r{background:rgba(245,158,11,.18);color:#b45309}' +
    '.ehb-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#0f172a;color:#fff;padding:10px 18px;border-radius:10px;z-index:10000;font-size:.88rem;box-shadow:0 8px 30px rgba(0,0,0,.3);font-family:"Segoe UI",system-ui,sans-serif;max-width:90vw}' +
    '.ehb-banner{position:fixed;right:16px;bottom:16px;z-index:9998;background:#fffbeb;color:#78350f;border:1px solid #f59e0b;border-radius:12px;padding:12px 14px;max-width:330px;font-size:.85rem;box-shadow:0 8px 30px rgba(0,0,0,.15);font-family:"Segoe UI",system-ui,sans-serif;line-height:1.45}' +
    '.ehb-banner .ehb-row{margin-top:8px}';
  function injectCSS() { if (document.getElementById('ehb-css')) return; var s = document.createElement('style'); s.id = 'ehb-css'; s.textContent = CSS; document.head.appendChild(s); }
  function toast(msg) { injectCSS(); var t = document.createElement('div'); t.className = 'ehb-toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3500); }

  var btn = null, ov = null;
  function mountButton() {
    var host = document.querySelector('.tb-right');
    if (!host || !isTop) return;
    injectCSS();
    btn = document.createElement('button');
    btn.className = 'ehb-btn'; btn.type = 'button'; btn.title = 'Sao lưu & Khôi phục dữ liệu';
    btn.innerHTML = '💾<span class="ehb-dot"></span>';
    btn.onclick = open;
    var settings = host.querySelector('.tb-setting-btn');
    host.insertBefore(btn, settings || null);
    refreshBadge();
  }
  function daysSince(iso) { return iso ? (Date.now() - new Date(iso).getTime()) / 864e5 : Infinity; }
  function refreshBadge() {
    if (!btn) return;
    var dot = btn.querySelector('.ehb-dot'), last = lsGet(OWN_PREFIX + 'last');
    var lastOff = folderState === 'granted' ? lsGet(OWN_PREFIX + 'folder_last') : lsGet(OWN_PREFIX + 'export_last');
    var cls = '', tip = 'Sao lưu & Khôi phục';
    if (!last) { cls = 'warn'; tip += ' – chưa có bản sao lưu'; }
    else tip += ' – bản gần nhất: ' + fmtDate(last);
    if (folderState === 'prompt') { cls = 'warn'; tip += ' – cần cấp lại quyền thư mục'; }
    else if (daysSince(lastOff) > 7) { cls = cls || 'warn'; tip += ' – nên lưu bản sao ra ngoài trình duyệt'; }
    dot.className = 'ehb-dot ' + cls; btn.title = tip;
  }
  function open() { injectCSS(); checkFolder().then(render); }
  function close() { if (ov) { ov.remove(); ov = null; } }
  var TYPE_LABEL = { daily: ['Hằng ngày', ''], manual: ['Thủ công', 'm'], truockhoiphuc: ['Trước khôi phục', 'r'] };
  function render() {
    if (!ov) {
      ov = document.createElement('div'); ov.className = 'ehb-ov';
      ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
      document.body.appendChild(ov);
    }
    snaps.all().then(function (list) {
      list.sort(function (a, b) { return b.date.localeCompare(a.date); });
      var cur = collect(), curN = Object.keys(cur).length, curSize = JSON.stringify(cur).length;
      var folderName = lsGet(OWN_PREFIX + 'folder_name') || '';
      var folderHTML;
      if (folderState === 'unsupported') folderHTML = '<div class="ehb-muted">Trình duyệt này chưa hỗ trợ tự ghi vào thư mục. Hãy dùng <b>Google Chrome</b> hoặc <b>Microsoft Edge</b> trên máy tính, hoặc bấm “Tải file sao lưu” định kỳ.</div>';
      else if (folderState === 'granted') folderHTML = '<div>📁 Đang tự động ghi vào thư mục: <b>' + esc(folderName) + '</b></div><div class="ehb-muted">Lần ghi gần nhất: ' + (lsGet(OWN_PREFIX + 'folder_last') ? fmtDate(lsGet(OWN_PREFIX + 'folder_last')) : 'chưa có') + '</div><div class="ehb-row" style="margin-top:8px"><button class="ehb-bt l s" data-a="choose">Đổi thư mục</button><button class="ehb-bt l s" data-a="forget">Ngừng ghi vào thư mục</button></div>';
      else if (folderState === 'prompt') folderHTML = '<div>📁 Thư mục: <b>' + esc(folderName) + '</b> – trình duyệt cần thầy/cô <b>cấp lại quyền</b> sau khi mở lại.</div><div class="ehb-row" style="margin-top:8px"><button class="ehb-bt o" data-a="regrant">🔓 Cấp quyền & sao lưu ngay</button><button class="ehb-bt l s" data-a="choose">Đổi thư mục</button></div>';
      else folderHTML = '<div class="ehb-muted">Bản sao lưu trong trình duyệt sẽ mất nếu xóa lịch sử duyệt web hoặc cài lại máy. Nên chọn thêm một thư mục (ví dụ thư mục <b>OneDrive / Google Drive</b> hoặc <b>USB</b>) để hệ thống tự ghi file sao lưu mỗi ngày.</div><div class="ehb-row" style="margin-top:8px"><button class="ehb-bt g" data-a="choose">📁 Chọn thư mục sao lưu</button></div>';

      var rows = list.length ? list.map(function (s) {
        var t = TYPE_LABEL[s.type] || [s.type, ''];
        return '<tr><td>' + fmtDate(s.date) + '</td><td><span class="ehb-tag ' + t[1] + '">' + t[0] + '</span></td><td>' + s.keys + ' mục · ' + fmtSize(s.size) + '</td><td style="text-align:right;white-space:nowrap"><button class="ehb-bt o s" data-a="restore" data-id="' + esc(s.id) + '">Khôi phục</button> <button class="ehb-bt l s" data-a="dl" data-id="' + esc(s.id) + '">Tải về</button></td></tr>';
      }).join('') : '<tr><td colspan="4" class="ehb-muted">Chưa có bản sao lưu nào.</td></tr>';

      ov.innerHTML = '<div class="ehb-m" role="dialog" aria-label="Sao lưu và khôi phục">' +
        '<div class="ehb-h"><b>💾 Sao lưu &amp; Khôi phục dữ liệu</b><button class="ehb-x" data-a="close" title="Đóng">✕</button></div>' +
        '<div class="ehb-b">' +
        '<div class="ehb-note">🔒 <b>Dữ liệu chỉ lưu trên máy này</b> – thông tin học sinh và điểm số không được gửi lên Internet. Hệ thống <b>tự sao lưu mỗi ngày</b> khi có thay đổi và giữ lại <b>' + KEEP_DAYS + ' ngày</b> gần nhất.</div>' +
        '<div class="ehb-card"><h4>📊 Dữ liệu hiện tại</h4><div>' + curN + ' mục dữ liệu · ' + fmtSize(curSize) + '</div><div class="ehb-muted">Bản sao lưu gần nhất: ' + (lsGet(OWN_PREFIX + 'last') ? fmtDate(lsGet(OWN_PREFIX + 'last')) : 'chưa có') + '</div>' +
        '<div class="ehb-row" style="margin-top:10px"><button class="ehb-bt" data-a="now">💾 Sao lưu ngay</button><button class="ehb-bt g" data-a="export">⬇️ Tải file sao lưu (.json)</button><button class="ehb-bt o" data-a="import">⬆️ Khôi phục từ file…</button><input type="file" accept=".json,application/json" data-a="file" hidden></div></div>' +
        '<div class="ehb-card"><h4>📁 Tự động sao lưu ra thư mục</h4>' + folderHTML + '</div>' +
        '<div class="ehb-card"><h4>🗂️ Các bản sao lưu trên máy</h4><div style="overflow-x:auto"><table class="ehb-tbl"><thead><tr><th>Thời gian</th><th>Loại</th><th>Nội dung</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '<div class="ehb-muted" style="margin-top:8px">💡 Khi khôi phục, dữ liệu hiện tại được tự lưu thành bản “Trước khôi phục”, nên thầy/cô luôn quay lại được.</div></div>' +
        '</div></div>';
      ov.querySelectorAll('[data-a]').forEach(function (el) {
        var a = el.getAttribute('data-a');
        if (a === 'file') { el.onchange = function () { if (el.files[0]) restoreFile(el.files[0]); }; return; }
        el.onclick = function () {
          var id = el.getAttribute('data-id');
          if (a === 'close') close();
          else if (a === 'now') snapshot('manual', true).then(function (s) { toast(s ? '✅ Đã tạo bản sao lưu.' : 'Chưa có dữ liệu để sao lưu.'); render(); });
          else if (a === 'export') downloadNow();
          else if (a === 'import') ov.querySelector('[data-a="file"]').click();
          else if (a === 'choose') chooseFolder();
          else if (a === 'forget') forgetFolder();
          else if (a === 'regrant') regrant();
          else if (a === 'restore') restoreSnap(id);
          else if (a === 'dl') snaps.get(id).then(function (s) { if (s) download(s); });
        };
      });
    });
  }
  function showRegrantBanner() {
    if (!isTop || document.getElementById('ehb-banner') || lsGet(OWN_PREFIX + 'banner_day') === todayStr()) return;
    injectCSS();
    var b = document.createElement('div'); b.className = 'ehb-banner'; b.id = 'ehb-banner';
    b.innerHTML = '💾 <b>Sao lưu tự động</b>: bấm “Cho phép” để hệ thống ghi bản sao lưu hôm nay vào thư mục <b>' + esc(lsGet(OWN_PREFIX + 'folder_name') || '') + '</b>.<div class="ehb-row"><button class="ehb-bt o s" id="ehb-ok">Cho phép</button><button class="ehb-bt l s" id="ehb-no">Để sau</button></div>';
    document.body.appendChild(b);
    b.querySelector('#ehb-ok').onclick = function () { b.remove(); regrant(); };
    b.querySelector('#ehb-no').onclick = function () { b.remove(); lsSet(OWN_PREFIX + 'banner_day', todayStr()); };
  }

  /* ---------- khởi động ---------- */
  function autoRun() { return snapshot('daily', false); }
  function init() {
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { }
    mountButton();
    checkFolder().then(function (st) {
      refreshBadge();
      setTimeout(function () {
        autoRun().then(function () { if (folderState === 'prompt') showRegrantBanner(); });
      }, 1500);
    });
    setInterval(autoRun, 5 * 60 * 1000);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') autoRun(); });
  }
  if (!('indexedDB' in window)) return;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  window.EHBackup = { open: open, snapshotNow: function () { return snapshot('manual', true); }, autoRun: autoRun, collect: collect };
})();
