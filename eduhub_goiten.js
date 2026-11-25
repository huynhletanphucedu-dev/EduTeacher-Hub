/* EduTeacher Hub – Lịch sử gọi tên LÂU DÀI (dùng chung cho "Gọi Tên Học Sinh" và "Gọi Tên Vui Nhộn")
   - Lưu ở localStorage 'ehub_goiten_hist_v1' → không mất khi đổi lớp, tắt máy, mở lại; được sao lưu cùng dữ liệu Hub.
   - Công bằng: chỉ những em có SỐ LẦN ĐƯỢC GỌI ÍT NHẤT trong lớp mới được gọi tiếp. Gọi đủ cả lớp → tự sang vòng mới.
   - Ưu tiên (tuỳ chọn): trong nhóm chưa gọi, em CHƯA CÓ ĐIỂM thường xuyên và em ĐIỂM THẤP có khả năng được gọi cao hơn
     (vẫn ngẫu nhiên, học sinh không đoán trước được).
   Khóa lớp = tên lớp (vd "6/4") nên Sổ điểm và Lớp chủ nhiệm cùng lớp dùng chung một lịch sử. */
(function () {
  var KEY = 'ehub_goiten_hist_v1', CFG = 'ehub_goiten_cfg';
  function norm(t) { return String(t || '').normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim(); }
  function jget(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : (JSON.parse(v) || d); } catch (e) { return d; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function load() { var d = jget(KEY, {}); return d && typeof d === 'object' ? d : {}; }
  function ck(c) { return norm(c) || '_'; }
  function cls(d, c) { var k = ck(c); if (!d[k]) d[k] = {}; return d[k]; }

  function rec(c, name) {
    var d = load(), C = cls(d, c), k = norm(name); if (!k) return 0;
    var r = C[k] || (C[k] = { n: 0, last: 0 }); r.n++; r.last = Date.now(); jset(KEY, d); return r.n;
  }
  function counts(c, names) {
    var C = load()[ck(c)] || {}, o = {};
    names.forEach(function (n) { var r = C[norm(n)]; o[n] = r ? r.n : 0; }); return o;
  }
  function level(c, names) {
    if (!names.length) return 0; var o = counts(c, names), m = Infinity;
    names.forEach(function (n) { if (o[n] < m) m = o[n]; }); return m;
  }
  /* Các em đã được gọi trong VÒNG hiện tại (số lần > mức thấp nhất của lớp) */
  function calledSet(c, names) {
    var o = counts(c, names), m = level(c, names);
    return names.filter(function (n) { return o[n] > m; });
  }
  function info(c, names) {
    var called = calledSet(c, names);
    return { round: level(c, names) + 1, called: called.length, total: names.length, left: names.length - called.length };
  }
  /* Bỏ qua phần còn lại của vòng: coi như cả lớp đã đủ lượt */
  function newRound(c, names) {
    var d = load(), C = cls(d, c), mx = 0;
    names.forEach(function (n) { var r = C[norm(n)]; if (r && r.n > mx) mx = r.n; });
    names.forEach(function (n) { var k = norm(n); var r = C[k] || (C[k] = { n: 0, last: 0 }); r.n = mx; });
    jset(KEY, d);
  }
  function resetClass(c) { var d = load(); delete d[ck(c)]; jset(KEY, d); }

  function cfg() { var c = jget(CFG, {}); return { prio: c.prio !== false }; }
  function setCfg(o) { var c = jget(CFG, {}); for (var k in o) c[k] = o[k]; jset(CFG, c); }

  function hkNow() { var t = new Date(), m = t.getMonth() + 1; return (m >= 2 && m <= 7) || (m === 1 && t.getDate() >= 15) ? 'hk2' : 'hk1'; }
  function filled(v) { return v !== null && v !== undefined && String(v).trim() !== ''; }
  /* điểm thường xuyên của một học sinh trong sổ điểm */
  function scoreInfo(st, hk) {
    var sc = st && st[hk], tx = (sc && sc.tx) || [];
    var got = tx.filter(filled), nums = got.filter(function (v) { return !isNaN(+v); }).map(Number);
    var avg = nums.length ? nums.reduce(function (a, b) { return a + b; }, 0) / nums.length : null;
    var cd = got.some(function (v) { return String(v).trim().toUpperCase() === 'CĐ'; });
    return { count: got.length, avg: avg, chuaDat: cd };
  }
  function weight(si) {
    if (!si) return 1;
    if (si.count === 0) return 4;               // chưa có cột điểm thường xuyên nào → ưu tiên cao nhất
    if (si.chuaDat) return 4;                   // môn đánh giá bằng nhận xét: có "Chưa đạt"
    if (si.avg != null) { if (si.avg < 5) return 4; if (si.avg < 6.5) return 2.5; }
    return 1;
  }
  function findBook(className, bookId) {
    var books = (jget('etv1_sodiem_v2', { books: [] }).books) || [];
    if (bookId) { var b = books.find(function (x) { return x.id === bookId; }); if (b) return b; }
    var c = norm(className); return books.find(function (x) { return norm(x.lop) === c; }) || null;
  }
  /* trả về {tên: trọng số}; không tìm thấy sổ điểm → tất cả = 1 */
  function weightsFor(className, names, opt) {
    opt = opt || {}; var out = {}; names.forEach(function (n) { out[n] = 1; });
    var b = opt.book || findBook(className, opt.bookId); if (!b) return out;
    var hk = opt.hk || hkNow(), sts = (b[hk] && b[hk].students) || (b.hk1 && b.hk1.students) || [], by = {};
    sts.forEach(function (s) { by[norm(s.ten)] = s; });
    names.forEach(function (n) { var s = by[norm(n)]; if (s) out[n] = weight(scoreInfo(s, hk)); });
    return out;
  }
  /* bốc ngẫu nhiên có trọng số */
  function pick(arr, wfn) {
    if (!arr.length) return null;
    var ws = arr.map(function (x) { return Math.max(0.05, +wfn(x) || 1); }), r = Math.random() * ws.reduce(function (a, b) { return a + b; }, 0);
    for (var i = 0; i < arr.length - 1; i++) { r -= ws[i]; if (r <= 0) return arr[i]; }
    return arr[arr.length - 1];
  }
  window.EHGoiTen = { KEY: KEY, norm: norm, rec: rec, counts: counts, level: level, calledSet: calledSet, info: info, newRound: newRound,
    resetClass: resetClass, cfg: cfg, setCfg: setCfg, hkNow: hkNow, scoreInfo: scoreInfo, weight: weight, findBook: findBook, weightsFor: weightsFor, pick: pick };
})();
