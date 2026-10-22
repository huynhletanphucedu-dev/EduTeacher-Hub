/* EduTeacher Hub – Service Worker (tạo tự động bằng tools/tao_sw.py – không sửa tay)
   • Mở một lần khi có mạng → các trang đã mở dùng được khi mất mạng.
   • Nút “Tải sẵn để dùng offline” → tải toàn bộ công cụ về máy. */
const VERSION = '__VERSION__';
const CACHE = 'eduhub-' + VERSION;
const CORE = __CORE__;
const FILES = __FILES__;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    const old = keys.filter(k => k.startsWith('eduhub-') && k !== CACHE);
    // chép những file đã tải ở phiên bản cũ sang (lấy bản mới từ mạng nếu được)
    const had = new Set();
    for (const k of old) { const c = await caches.open(k); (await c.keys()).forEach(r => had.add(new URL(r.url).pathname)); }
    await Promise.all(old.map(k => caches.delete(k)));
    await self.clients.claim();
    if (had.size > CORE.length + 5) fullDownload(null).catch(() => {});
  })());
});

const isHTML = req => req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (isHTML(req)) {
    // trang: ưu tiên bản mới trên mạng (chờ tối đa 3,5 giây), mất mạng thì dùng bản đã lưu
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const net = await Promise.race([fetch(req), new Promise((_, rj) => setTimeout(() => rj(new Error('timeout')), 3500))]);
        if (net && net.ok) cache.put(req, net.clone());
        return net;
      } catch (_) {
        return (await cache.match(req, { ignoreSearch: true })) || (await cache.match('dashboard.html')) || Response.error();
      }
    })());
  } else {
    // thư viện, ảnh, font: dùng bản đã lưu ngay, đồng thời cập nhật ngầm
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(req, { ignoreSearch: true });
      const net = fetch(req).then(r => { if (r && r.ok) cache.put(req, r.clone()); return r; }).catch(() => null);
      return hit || (await net) || Response.error();
    })());
  }
});

async function fullDownload(port) {
  const cache = await caches.open(CACHE);
  let done = 0, fail = 0;
  const queue = FILES.slice();
  const worker = async () => {
    while (queue.length) {
      const f = queue.shift();
      try {
        if (!(await cache.match(f))) { const r = await fetch(f, { cache: 'reload' }); if (!r.ok) throw 0; await cache.put(f, r); }
        done++;
      } catch (_) { fail++; }
      if (port) port.postMessage({ type: 'progress', done, fail, total: FILES.length });
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
  if (port) port.postMessage({ type: 'done', done, fail, total: FILES.length });
}
self.addEventListener('message', e => {
  if (e.data === 'download-all') fullDownload(e.ports[0]);
  else if (e.data === 'status') caches.open(CACHE).then(c => c.keys()).then(k => e.ports[0].postMessage({ type: 'status', cached: k.length, total: FILES.length, version: VERSION }));
  else if (e.data === 'skip') self.skipWaiting();
});
