/* EduTeacher Hub – Cài như ứng dụng (PWA) + dùng khi mất mạng */
(function () {
  'use strict';
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  var CSS = '' +
    '#ehp-box{width:100%;max-width:620px;margin:0 auto 26px;display:flex;flex-wrap:wrap;gap:10px;justify-content:center;align-items:center}' +
    '.ehp-b{display:inline-flex;align-items:center;gap:7px;padding:9px 15px;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.07);color:#e2e8f0;cursor:pointer;font:600 .84rem "Segoe UI",system-ui,sans-serif}' +
    '.ehp-b[hidden],.ehp-bar[hidden]{display:none!important}.ehp-b:hover{border-color:#34d399;background:rgba(52,211,153,.1)}.ehp-b[disabled]{opacity:.7;cursor:default}' +
    '.ehp-s{width:100%;text-align:center;color:#64748b;font-size:.76rem}' +
    '.ehp-bar{width:100%;max-width:360px;height:6px;border-radius:6px;background:rgba(255,255,255,.1);overflow:hidden;margin:0 auto}.ehp-bar i{display:block;height:100%;width:0;background:#34d399;transition:width .2s}' +
    '.ehp-net{position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:9997;background:#f59e0b;color:#111;padding:7px 14px;border-radius:20px;font:600 .8rem "Segoe UI",system-ui,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.2)}';
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

  var deferred = null, box = null, statusEl = null, bar = null, dlBtn = null;
  function ask(msg) {
    return new Promise(function (res) {
      var c = navigator.serviceWorker.controller; if (!c) return res(null);
      var ch = new MessageChannel(); ch.port1.onmessage = function (e) { res(e.data); }; c.postMessage(msg, [ch.port2]);
      setTimeout(function () { res(null); }, 4000);
    });
  }
  function refresh() {
    ask('status').then(function (s) {
      if (!statusEl) return;
      if (!s) { statusEl.textContent = '📶 Đang chuẩn bị chế độ dùng offline…'; return; }
      var full = s.cached >= s.total;
      statusEl.textContent = full ? '✅ Đã tải đủ ' + s.total + ' tệp – dùng được cả khi mất mạng.' : '📦 Đã lưu trên máy ' + Math.min(s.cached, s.total) + '/' + s.total + ' tệp. Bấm “Tải sẵn” để dùng mọi công cụ khi mất mạng.';
      if (dlBtn) dlBtn.hidden = full;
    });
  }
  function downloadAll() {
    var c = navigator.serviceWorker.controller; if (!c) { alert('Thầy/cô tải lại trang một lần rồi bấm lại nhé.'); return; }
    dlBtn.disabled = true; dlBtn.textContent = '⏳ Đang tải…'; bar.parentNode.hidden = false;
    var ch = new MessageChannel();
    ch.port1.onmessage = function (e) {
      var d = e.data; bar.style.width = Math.round((d.done + d.fail) / d.total * 100) + '%';
      statusEl.textContent = '⏳ Đang tải ' + (d.done + d.fail) + '/' + d.total + ' tệp…';
      if (d.type === 'done') {
        dlBtn.disabled = false; dlBtn.textContent = '📥 Tải sẵn để dùng khi mất mạng';
        statusEl.textContent = d.fail ? '⚠️ Đã tải ' + d.done + '/' + d.total + ' tệp, ' + d.fail + ' tệp lỗi – bấm lại để thử tiếp.' : '✅ Xong! Toàn bộ ' + d.total + ' tệp đã lưu trên máy – dùng được khi mất mạng.';
        if (!d.fail) { dlBtn.hidden = true; setTimeout(function () { bar.parentNode.hidden = true; }, 1500); }
      }
    };
    c.postMessage('download-all', [ch.port2]);
  }
  function mount() {
    box = document.getElementById('ehp-box'); if (!box) return;
    box.innerHTML = '<button class="ehp-b" id="ehp-inst" hidden>📲 Cài EduTeacher Hub như ứng dụng</button>' +
      '<button class="ehp-b" id="ehp-dl">📥 Tải sẵn để dùng khi mất mạng</button>' +
      '<div class="ehp-bar" hidden><i></i></div><div class="ehp-s"></div>';
    statusEl = box.querySelector('.ehp-s'); bar = box.querySelector('.ehp-bar i'); dlBtn = box.querySelector('#ehp-dl');
    dlBtn.onclick = downloadAll;
    var inst = box.querySelector('#ehp-inst');
    inst.onclick = function () {
      if (deferred) { deferred.prompt(); deferred.userChoice.finally(function () { deferred = null; inst.hidden = true; }); }
      else alert('Trên iPhone/iPad: bấm nút Chia sẻ ⬆️ rồi chọn “Thêm vào MH chính”.\nTrên máy tính: bấm biểu tượng cài đặt ⊕ ở cuối thanh địa chỉ Chrome/Edge.');
    };
    var standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    var ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (!standalone && ios) inst.hidden = false;
    refresh();
  }
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; var b = document.getElementById('ehp-inst'); if (b) b.hidden = false; });
  window.addEventListener('appinstalled', function () { var b = document.getElementById('ehp-inst'); if (b) b.hidden = true; });

  var netEl = null;
  function net() {
    if (navigator.onLine) { if (netEl) { netEl.remove(); netEl = null; } return; }
    if (!netEl) { netEl = document.createElement('div'); netEl.className = 'ehp-net'; netEl.textContent = '📴 Đang mất mạng – vẫn dùng được các công cụ đã lưu trên máy'; document.body.appendChild(netEl); }
  }
  window.addEventListener('online', net); window.addEventListener('offline', net);

  navigator.serviceWorker.register('sw.js').then(function () { return navigator.serviceWorker.ready; }).then(function () { setTimeout(refresh, 600); }).catch(function (e) { console.warn('[PWA]', e); });
  navigator.serviceWorker.addEventListener('controllerchange', function () { setTimeout(refresh, 300); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { mount(); net(); }); else { mount(); net(); }
})();
