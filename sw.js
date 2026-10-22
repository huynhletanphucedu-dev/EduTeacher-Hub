/* EduTeacher Hub – Service Worker (tạo tự động bằng tools/tao_sw.py – không sửa tay)
   • Mở một lần khi có mạng → các trang đã mở dùng được khi mất mạng.
   • Nút “Tải sẵn để dùng offline” → tải toàn bộ công cụ về máy. */
const VERSION = 'd13193c20a';
const CACHE = 'eduhub-' + VERSION;
const CORE = ["./", "index.html", "dashboard.html", "manifest.webmanifest", "eduhub_backup.js", "eduhub_search.js", "eduhub_pwa.js", "icons/icon-192.png"];
const FILES = [
"_rieng_tu/EduTeacherHub_saoluu_GV_Phuc_2026-2027.json",
"bangdiem.html",
"chianhom.html",
"chunhiem.html",
"cn_nhanxet.html",
"cn_thidua.html",
"cn_tinnhan.html",
"cong_cu_anh.html",
"cong_cu_baocao.html",
"cong_cu_bieumau.html",
"cong_cu_congviec.html",
"cong_cu_danhsach.html",
"cong_cu_excel.html",
"cong_cu_lichbaogiang.html",
"cong_cu_lichday.html",
"cong_cu_matran.html",
"cong_cu_ocr.html",
"cong_cu_pdf.html",
"cong_cu_pdf.js",
"cong_cu_phongthi.html",
"cong_cu_qr.html",
"cong_cu_rutgon.html",
"cong_cu_scan.html",
"cong_cu_taode.html",
"cong_cu_thetenban.html",
"cong_cu_thongke.html",
"cong_cu_tronde.html",
"cong_cu_tronthu.html",
"dashboard.html",
"dongho.html",
"eduhub_backup.js",
"eduhub_data.js",
"eduhub_pwa.js",
"eduhub_search.js",
"eduhub_sheet.js",
"eduhub_ui.css",
"game_balloon_toan.html",
"game_diendau_toan.html",
"game_duathuyen_toan.html",
"game_fillin_eng.html",
"game_flashcard_eng.html",
"game_fracmatch_toan.html",
"game_hangman_eng.html",
"game_ipa_eng.html",
"game_meteor_eng.html",
"game_nhaccu_am.html",
"game_noidoi_eng.html",
"game_notnhac_am.html",
"game_phantai_tin.html",
"game_quiz_gdcd.html",
"game_quiz_tin.html",
"game_reading_eng.html",
"game_scramble_eng.html",
"game_sentence_eng.html",
"game_sortit_toan.html",
"game_speedmath.html",
"game_sudoku_toan.html",
"game_tinhhuo_gdcd.html",
"game_tracker.js",
"game_tucngu_van.html",
"game_tuloai_van.html",
"game_wordsearch_eng.html",
"giaobai.html",
"goiten.html",
"haihoa.html",
"icons/apple-touch-icon.png",
"icons/favicon-48.png",
"icons/icon-192.png",
"icons/icon-512.png",
"icons/icon-maskable-512.png",
"index.html",
"lib/BeVietnamPro-Bold.ttf",
"lib/BeVietnamPro-Regular.ttf",
"lib/FileSaver.min.js",
"lib/docx.min.js",
"lib/fontkit.umd.min.js",
"lib/html2canvas.min.js",
"lib/jszip.min.js",
"lib/pdf-lib.min.js",
"lib/pdf.min.js",
"lib/pdf.worker.min.js",
"lib/qrcode.min.js",
"lib/xlsx.full.min.js",
"manifest.webmanifest",
"may_ngau_nhien.html",
"mophong_camung.html",
"mophong_chiahet.html",
"mophong_chuvi_dientich.html",
"mophong_diahinhvn.html",
"mophong_ditung.html",
"mophong_doikhi.html",
"mophong_doixung.html",
"mophong_duongthang.html",
"mophong_goc.html",
"mophong_grammar_eng.html",
"mophong_hemattroi.html",
"mophong_hinhdeu.html",
"mophong_khucxa.html",
"mophong_luythua.html",
"mophong_machien.html",
"mophong_pH.html",
"mophong_phanso.html",
"mophong_phantinhphanso.html",
"mophong_solama.html",
"mophong_songam.html",
"mophong_songuyento.html",
"mophong_taphop.html",
"mophong_tenses_eng.html",
"mophong_thechat.html",
"mophong_thuasont.html",
"mophong_trieudai.html",
"mophong_trucso.html",
"mophong_ucln_bcnn.html",
"mophong_uocboi.html",
"mophong_vminhhoa.html",
"ochu.html",
"sodiem.html",
"tiengon.html",
"tienphong/games/ban-bong.html",
"tienphong/games/cau-ca.html",
"tienphong/games/chay-truc-so.html",
"tienphong/games/chem-dap-an.html",
"tienphong/games/chim-bay.html",
"tienphong/games/dan-vit.html",
"tienphong/games/dap-chuot.html",
"tienphong/games/duong-ve-nha.html",
"tienphong/games/ghep-so.html",
"tienphong/games/hung-trung.html",
"tienphong/games/keo-co.html",
"tienphong/games/kho-bau.html",
"tienphong/games/lat-the.html",
"tienphong/games/leo-nui.html",
"tienphong/games/me-cung.html",
"tienphong/games/nguoi-tuyet.html",
"tienphong/games/phi-thuyen.html",
"tienphong/games/qua-cau.html",
"tienphong/games/quan-pho.html",
"tienphong/games/xep-thap.html",
"tienphong/img/cat-banbong.png",
"tienphong/img/cat-cau.png",
"tienphong/img/cat-cauca.png",
"tienphong/img/cat-chay.png",
"tienphong/img/cat-chem.png",
"tienphong/img/cat-chim.png",
"tienphong/img/cat-dapchuot.png",
"tienphong/img/cat-duong.png",
"tienphong/img/cat-ghep.png",
"tienphong/img/cat-keoco.png",
"tienphong/img/cat-khobau.png",
"tienphong/img/cat-latthe.png",
"tienphong/img/cat-leonui.png",
"tienphong/img/cat-mecung.png",
"tienphong/img/cat-phithuyen.png",
"tienphong/img/cat-pho.png",
"tienphong/img/cat-thap.png",
"tienphong/img/cat-trung.png",
"tienphong/img/cat-tuyet.png",
"tienphong/img/cat-vit.png",
"tienphong/img/favicon-48.png",
"tienphong/js/bai-tap.js",
"tienphong/js/bank-toan6.js",
"tienphong/js/lessons.js",
"tienphong/js/math-fmt.js",
"tienphong/js/tp-gate.js",
"tienphong/js/tp-journey.js",
"tienphong/soan-cau-hoi.html",
"vongquay.html"
];

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
