/* eduhub_demo.js – LỚP MẪU (dữ liệu giả) để giáo viên mới xem thử mọi tính năng.
   • Học sinh, phụ huynh, số điện thoại, điểm… đều là dữ liệu bịa ngẫu nhiên, không phải người thật.
   • Chỉ nạp khi máy CHƯA có dữ liệu lớp thật (không bao giờ ghi đè dữ liệu của thầy/cô).
   • Bấm "Xóa lớp mẫu" là xóa sạch, trở về trạng thái trống để nhập lớp của mình.
   Dùng: EHDemo.load(), EHDemo.clear(), EHDemo.active(), EHDemo.hasReal(), EHDemo.box(el)            */
(function () {
  var LS = window.localStorage;
  function get(k, d) { try { var v = LS.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function set(k, v) { try { LS.setItem(k, JSON.stringify(v)); } catch (e) { } }
  // số ngẫu nhiên có hạt giống → lớp mẫu lần nào cũng giống nhau
  var seed = 20261;
  function R() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function pick(a) { return a[Math.floor(R() * a.length)]; }
  function pad(n, l) { n = String(n); while (n.length < l) n = '0' + n; return n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1, 2) + '-' + pad(d.getDate(), 2); }

  var HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Huỳnh', 'Phan', 'Ngô', 'Dương', 'Lý', 'Trương', 'Mai'];
  var DEM_NAM = ['Văn', 'Minh', 'Gia', 'Quốc', 'Đức', 'Thành', 'Hoàng', 'Anh', 'Tuấn', 'Nhật'];
  var DEM_NU = ['Thị', 'Ngọc', 'Bảo', 'Thanh', 'Khánh', 'Thảo', 'Hoài', 'Minh', 'Phương', 'Kim'];
  var TEN_NAM = ['An', 'Bảo', 'Duy', 'Dũng', 'Huy', 'Khang', 'Khoa', 'Kiệt', 'Long', 'Minh', 'Nam', 'Phúc', 'Quân', 'Sơn', 'Tài', 'Thịnh', 'Trí', 'Vinh', 'Hưng', 'Phát'];
  var TEN_NU = ['Anh', 'Châu', 'Giang', 'Hà', 'Hân', 'Lan', 'Linh', 'My', 'Ngân', 'Nhi', 'Như', 'Quỳnh', 'Tâm', 'Thư', 'Trang', 'Uyên', 'Vy', 'Yến', 'Hương', 'Thảo'];
  var NGHE = ['Công nhân', 'Nông dân', 'Buôn bán', 'Giáo viên', 'Tài xế', 'Nội trợ', 'Kỹ sư', 'Thợ may', 'Kế toán'];
  function makeNames(n, used) {
    var out = [];
    while (out.length < n) {
      var nam = R() < .5, nm = pick(HO) + ' ' + pick(nam ? DEM_NAM : DEM_NU) + ' ' + pick(nam ? TEN_NAM : TEN_NU);
      if (used[nm]) continue; used[nm] = 1; out.push({ hoTen: nm, gioiTinh: nam ? 'Nam' : 'Nữ' });
    }
    return out.sort(function (a, b) { var x = a.hoTen.split(' ').pop(), y = b.hoTen.split(' ').pop(); return x.localeCompare(y, 'vi') || a.hoTen.localeCompare(b.hoTen, 'vi'); });
  }
  function sc(base) { var v = base + (R() + R() + R() - 1.5) * 1.6; return Math.max(2, Math.min(10, Math.round(v * 2) / 2)); }
  function weekdays(n) { var out = [], d = new Date(); d.setHours(12); while (out.length < n) { var w = d.getDay(); if (w > 0 && w < 6) out.push(iso(d)); d.setDate(d.getDate() - 1); } return out; }

  function build() {
    seed = 20261; var used = {}, data = {};
    var cls = '6A1 (lớp mẫu)';
    var kids = makeNames(40, used);
    var stu = kids.map(function (k, i) {
      var ho = k.hoTen.split(' ')[0];
      return {
        id: 5001 + i, stt: String(i + 1), maLop: '6A1', hoTen: k.hoTen, gioiTinh: k.gioiTinh,
        ngaySinh: pad(1 + Math.floor(R() * 28), 2) + '/' + pad(1 + Math.floor(R() * 12), 2) + '/2015', danToc: 'Kinh',
        tinhTp: 'Tỉnh Mẫu', noiSinh: 'Tỉnh Mẫu', choO: 'Số ' + (i + 1) + ', Ấp Mẫu, xã Mẫu',
        sdtLienHe: '0000 000 ' + pad(i + 1, 3), soDinhDanh: '000000000' + pad(i + 1, 3),
        hoTenCha: ho + ' ' + pick(DEM_NAM) + ' ' + pick(TEN_NAM), ngheNghiepCha: pick(NGHE), namSinhCha: String(1980 + Math.floor(R() * 10)), sdtCha: '0000 111 ' + pad(i + 1, 3),
        hoTenMe: pick(HO) + ' ' + pick(DEM_NU) + ' ' + pick(TEN_NU), ngheNghiepMe: pick(NGHE), namSinhMe: String(1982 + Math.floor(R() * 10)), sdtMe: '0000 222 ' + pad(i + 1, 3)
      };
    });
    // vài em có sinh nhật đúng hôm nay / ngày mai → tab Sinh Nhật luôn có nội dung khi trình diễn
    var _t = new Date(), _m = new Date(); _m.setDate(_m.getDate() + 1);
    [[3, _t], [17, _t], [26, _m]].forEach(function (x) { if (stu[x[0]]) stu[x[0]].ngaySinh = pad(x[1].getDate(), 2) + '/' + pad(x[1].getMonth() + 1, 2) + '/2015'; });
    data.cn_students = stu; data.cn_className = cls;
    // học lực "ẩn" của từng em để điểm số, thi đua… có quy luật hợp lí
    var abil = {}; stu.forEach(function (s) { abil[s.id] = 4.8 + R() * 4.4; });
    // điểm danh 15 ngày học gần nhất (buổi sáng)
    var att = {}, days = weekdays(15);
    days.forEach(function (d) { var a = {}; stu.forEach(function (s) { var r = R(); a[String(s.id)] = r < .03 ? 'absent' : r < .06 ? 'late' : 'present'; }); att[d + '_sang'] = a; });
    data.cn_attendance = att;
    // nề nếp: khen / vi phạm
    var NOTE_V = ['Nói chuyện riêng', 'Không làm bài tập', 'Đi học trễ', 'Quên mang sách vở', 'Sai đồng phục'], NOTE_K = ['Phát biểu tốt', 'Giúp đỡ bạn', 'Điểm 10 kiểm tra miệng', 'Nhặt được của rơi trả lại', 'Trực nhật sạch sẽ'];
    var disc = []; for (var i = 0; i < 22; i++) { var s = pick(stu), v = R() < .45; disc.push({ id: 900000 + i, date: pick(days), studentId: String(s.id), type: v ? 'violation' : 'commend', points: v ? -1 : 1, note: v ? pick(NOTE_V) : pick(NOTE_K) }); }
    data.cn_discipline = disc;
    // sơ đồ lớp: 4 dãy, 5 hàng, 2 em/bàn
    var seat = {}, order = stu.map(function (s) { return s.id; }).sort(function () { return R() - .5; });
    order.forEach(function (id, k) { seat[Math.floor(k / 8) + '_' + (k % 8)] = String(id); });
    data.cn_curSeating = seat; data.cn_seatLayout = { layout: '4day', rows: 5, ds: 4 };
    // sổ điểm: lớp chủ nhiệm + 1 lớp dạy bộ môn (cũng là học sinh giả)
    function book(id, lop, list, ab) {
      var sts = list.map(function (s, i) { var b = ab(s, i); return { id: 'd' + id + '_' + i, ten: s.hoTen, thuong: 0, hk1: { tx: [sc(b), sc(b), sc(b), sc(b)], gk: sc(b), ck: sc(b - .3) }, hk2: { tx: [null, null, null, null], gk: null, ck: null } }; });
      var hk2 = sts.map(function (x) { return { id: x.id, ten: x.ten, thuong: 0, hk1: x.hk1, hk2: { tx: [null, null, null, null], gk: null, ck: null } }; });
      return { id: 'demo_' + id, mon: 'Toán', lop: lop, khoi: 6, namhoc: '2026-2027', history: [], hk1: { students: sts }, hk2: { students: hk2 } };
    }
    var kids2 = makeNames(38, used);
    data.etv1_sodiem_v2 = { books: [book('a1', '6A1', stu, function (s) { return abil[s.id]; }), book('a2', '6A2', kids2, function () { return 4.6 + R() * 4.6; })] };
    // thi đua tuần: 4 tổ
    var CRIT = [{ id: 'pb', icon: '🙋', name: 'Phát biểu xây dựng bài', pts: 1, scope: 'hs' }, { id: 'd9', icon: '⭐', name: 'Điểm 9 – 10', pts: 2, scope: 'hs' }, { id: 'gb', icon: '🤝', name: 'Giúp đỡ bạn / việc tốt', pts: 2, scope: 'hs' }, { id: 'bt', icon: '📗', name: 'Làm bài tập đầy đủ', pts: 1, scope: 'hs' }, { id: 'nc', icon: '💬', name: 'Nói chuyện riêng', pts: -1, scope: 'hs' }, { id: 'tr', icon: '⏰', name: 'Đi học trễ', pts: -1, scope: 'hs' }, { id: 'kb', icon: '📚', name: 'Không làm bài tập', pts: -2, scope: 'hs' }, { id: 'dp', icon: '👕', name: 'Sai đồng phục', pts: -1, scope: 'hs' }, { id: 'vp', icon: '⚠️', name: 'Vi phạm nội quy', pts: -3, scope: 'hs' }, { id: 'tn', icon: '🧹', name: 'Trực nhật sạch sẽ', pts: 2, scope: 'to' }, { id: 'tt', icon: '🏆', name: 'Tiết học tốt', pts: 3, scope: 'to' }, { id: 'tx', icon: '🗑️', name: 'Trực nhật chưa sạch', pts: -2, scope: 'to' }, { id: 'on', icon: '🔊', name: 'Tổ mất trật tự', pts: -2, scope: 'to' }];
    var assign = {}; stu.forEach(function (s, i) { assign[String(s.id)] = Math.floor(i / 10); });
    var ev = [], wk = weekdays(8);
    for (var j = 0; j < 46; j++) { var st = pick(stu), c = R() < .7 ? pick(CRIT.slice(0, 4)) : pick(CRIT.slice(4, 9)); ev.push({ id: 'dm' + j, ts: Date.now() - j * 3600e3, date: pick(wk), sid: String(st.id), to: assign[String(st.id)], cid: c.id, name: c.name, pts: c.pts, note: '' }); }
    for (var t = 0; t < 6; t++) { var cc = pick(CRIT.slice(9)); ev.push({ id: 'dt' + t, ts: Date.now() - t * 7200e3, date: pick(wk), sid: null, to: t % 4, cid: cc.id, name: cc.name, pts: cc.pts, note: '' }); }
    data.td_v1 = { teams: [['Tổ 1', '#2563eb'], ['Tổ 2', '#dc2626'], ['Tổ 3', '#059669'], ['Tổ 4', '#7c3aed']].map(function (x) { return { name: x[0], color: x[1] }; }), assign: assign, crit: CRIT, events: ev, sync: false };

    // ===== Trực nhật · Liên lạc PH · Nhật ký & việc cần làm (dữ liệu giả) =====
    function addD(n) { var d = new Date(); d.setHours(12); d.setDate(d.getDate() + n); return d; }
    function wdRange(from, to) { var out = []; for (var n = from; n <= to; n++) { var d = addD(n), w = d.getDay(); if (w > 0 && w < 6) out.push(iso(d)); } return out; }
    var DT = [{ id: 7001, name: 'Quét lớp', count: 2, note: 'Đầu giờ & cuối buổi' }, { id: 7002, name: 'Lau bảng', count: 1, note: 'Sau mỗi tiết' }, { id: 7003, name: 'Đổ rác – kê bàn ghế', count: 1, note: 'Cuối buổi học' }];
    data.cn_dutyTasks = DT;
    var rot = 0, roster = [];
    wdRange(-14, 21).forEach(function (dt) {
      roster.push({ date: dt, tasks: DT.map(function (t) { var g = []; for (var j = 0; j < t.count; j++) { g.push(stu[rot % stu.length].id); rot++; } return { taskId: t.id, students: g }; }) });
    });
    data.cn_duty = roster;
    var CT = [
      [-12, 4, 'Zalo', 'Mẹ', 'Thông báo em nghỉ học 1 buổi không phép.', 'Mẹ cho biết em bị sốt, sẽ viết giấy phép bổ sung.'],
      [-10, 9, 'Gọi điện', 'Cha', 'Em quên làm bài tập Toán 3 lần trong tuần.', 'Cha hứa kèm em làm bài mỗi tối.'],
      [-9, 15, 'Gặp trực tiếp', 'Mẹ', 'Trao đổi kết quả học tập giữa kỳ, em tiến bộ môn Toán.', 'Phụ huynh vui, đề nghị GV tiếp tục động viên.'],
      [-7, 21, 'Nhắn tin', 'Mẹ', 'Nhắc em mang đồng phục thể dục đúng lịch.', 'Đã nhận tin, sẽ nhắc em.'],
      [-6, 2, 'Zalo', 'Cha', 'Khen em nhặt được của rơi trả lại bạn.', 'Gia đình cảm ơn cô/thầy đã tuyên dương.'],
      [-5, 30, 'Gọi điện', 'Người thân khác', 'Em đi học trễ 2 buổi liên tiếp.', 'Bà ngoại đưa đón, hứa cho em đi sớm hơn.'],
      [-3, 12, 'Gặp trực tiếp', 'Cha', 'Em nói chuyện riêng nhiều trong giờ học.', 'Thống nhất theo dõi qua sổ liên lạc mỗi tuần.'],
      [-2, 35, 'Zalo', 'Mẹ', 'Mời phụ huynh họp Ban đại diện CMHS.', 'Mẹ xác nhận sẽ tham dự.'],
      [-1, 26, 'Nhắn tin', 'Mẹ', 'Báo em đạt điểm 10 bài kiểm tra 15 phút.', 'Mẹ rất vui, sẽ khen thưởng em.'],
      [0, 7, 'Gọi điện', 'Cha', 'Hỏi thăm tình hình sức khỏe sau khi em nghỉ ốm.', 'Em đã khỏe, đi học lại bình thường.']
    ];
    data.cn_contacts = CT.map(function (c, i) { return { id: 800000 + i, date: iso(addD(c[0])), studentId: String(stu[c[1]].id), method: c[2], 'with': c[3], note: c[4], result: c[5] }; });
    var DI = [
      [0, 'Sinh hoạt lớp đầu tuần', 'Phổ biến kế hoạch thi đua chào mừng 20/11. Tổ 2 dẫn đầu tuần trước, tuyên dương trước lớp.'],
      [-2, 'Hoạt động trải nghiệm', 'Lớp tham gia trang trí báo tường chủ đề "Tri ân thầy cô". Các em hào hứng, phân công theo tổ.'],
      [-4, 'Theo dõi học sinh', 'Một số em còn quên bài tập về nhà, đã nhắc nhở và liên hệ phụ huynh 2 trường hợp.'],
      [-7, 'Họp tổ chuyên môn', 'Thống nhất ma trận đề kiểm tra cuối kỳ I theo Công văn 7991, phân công ra đề.'],
      [-9, 'Kiểm tra giữa kỳ', 'Lớp hoàn thành kiểm tra giữa kỳ, không có học sinh vi phạm quy chế.'],
      [-13, 'Lao động vệ sinh', 'Cả lớp lao động vệ sinh khuôn viên, trồng thêm cây xanh ở góc lớp.']
    ];
    data.cn_diary = DI.map(function (d, i) { return { id: 810000 + i, date: iso(addD(d[0])), title: d[1], content: d[2] }; });
    var TK = [
      ['Nộp kế hoạch chủ nhiệm tháng 11', 1, 'high', false],
      ['Tổng hợp điểm thi đua tuần gửi Đội', 2, 'normal', false],
      ['Chuẩn bị tiết mục văn nghệ 20/11', 5, 'high', false],
      ['Nhập điểm thường xuyên lên hệ thống', 7, 'normal', false],
      ['Gửi tin nhắn kết quả học tập cho phụ huynh', -1, 'normal', true],
      ['Họp Ban đại diện CMHS', -3, 'normal', true]
    ];
    data.cn_tasks = TK.map(function (t, i) { return { id: 820000 + i, text: t[0], deadline: iso(addD(t[1])), priority: t[2], done: t[3] }; });
    return data;
  }

  var PREFIX = ['cn_', 'cnhom_', 'gtv_used_'], KEYS = ['etv1_sodiem_v2', 'td_v1', 'ths_v1', 'ths_class', 'etv1_gt_stats', 'cnhom_paste', 'goiten_vuinhon_v3', 'goiten_vuinhon_v2', 'gtvn_manual', 'gtvn_cfg'];
  var DEMO_VER = 2;
  var EHDemo = {
    active: function () { return !!get('etv1_demo', null); },
    hasReal: function () {
      if (EHDemo.active()) return false;
      var cn = get('cn_students', []) || [], sd = get('etv1_sodiem_v2', { books: [] }) || { books: [] };
      return (cn.length > 0) || ((sd.books || []).length > 0);
    },
    load: function () {
      if (EHDemo.hasReal()) { alert('Máy này đã có dữ liệu lớp thật nên không nạp lớp mẫu (để tránh ghi đè dữ liệu của thầy/cô).'); return false; }
      var d = build(); Object.keys(d).forEach(function (k) { set(k, d[k]); });
      set('etv1_demo', { ts: Date.now(), v: DEMO_VER }); return true;
    },
    clear: function () {
      if (!EHDemo.active()) return false;
      var del = [];
      for (var i = 0; i < LS.length; i++) { var k = LS.key(i); if (PREFIX.some(function (p) { return k.indexOf(p) === 0; }) || KEYS.indexOf(k) >= 0) del.push(k); }
      del.forEach(function (k) { LS.removeItem(k); }); LS.removeItem('etv1_demo'); return true;
    },
    /* hộp giới thiệu trên trang chính */
    box: function (el) {
      if (!el) return;
      var css = 'max-width:620px;width:100%;margin:0 auto 26px;border-radius:16px;padding:16px 20px;text-align:left;';
      var btn = 'border:0;border-radius:11px;padding:10px 16px;font-weight:800;font-size:.9rem;cursor:pointer;font-family:inherit;';
      if (EHDemo.active()) {
        el.innerHTML = '<div style="' + css + 'background:rgba(251,191,36,.12);border:1.5px solid rgba(251,191,36,.45);color:#fde68a">' +
          '<b style="font-size:1rem">🧪 Đang dùng LỚP MẪU</b><div style="font-size:.86rem;color:#fef3c7;margin:6px 0 12px;line-height:1.5">Lớp 6A1 với 40 học sinh <b>giả</b> (tên, điểm, điểm danh, sơ đồ chỗ ngồi, thi đua…) để thầy/cô xem thử mọi tính năng. Khi muốn dùng thật, bấm xóa lớp mẫu rồi nhập lớp của mình.</div>' +
          '<button type="button" id="ehd-clear" style="' + btn + 'background:#f59e0b;color:#111">🗑️ Xóa lớp mẫu – nhập lớp của tôi</button></div>';
        el.querySelector('#ehd-clear').onclick = function () { if (confirm('Xóa toàn bộ dữ liệu lớp mẫu (học sinh giả, điểm, điểm danh, thi đua…)?')) { EHDemo.clear(); location.reload(); } };
      } else if (!EHDemo.hasReal()) {
        el.innerHTML = '<div style="' + css + 'background:rgba(56,189,248,.08);border:1.5px solid rgba(56,189,248,.35);color:#e0f2fe">' +
          '<b style="font-size:1rem">👋 Lần đầu dùng EduTeacher Hub?</b><div style="font-size:.86rem;color:#cbd5e1;margin:6px 0 12px;line-height:1.5">Máy này chưa có lớp nào. Thầy/cô có thể <b>xem thử với lớp mẫu</b> (học sinh giả) để biết các công cụ hoạt động thế nào, hoặc nhập ngay lớp của mình. Mọi dữ liệu chỉ lưu trên máy này.</div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="ehd-load" style="' + btn + 'background:#38bdf8;color:#0f172a">🧪 Dùng thử với lớp mẫu</button>' +
          '<button type="button" id="ehd-own" style="' + btn + 'background:rgba(255,255,255,.1);color:#e2e8f0;border:1px solid rgba(255,255,255,.25)">✍️ Nhập lớp của tôi</button></div></div>';
        el.querySelector('#ehd-load').onclick = function () { if (EHDemo.load()) location.reload(); };
        el.querySelector('#ehd-own').onclick = function () { if (typeof showPage === 'function') showPage('cn-main', null, 'Chủ Nhiệm', 'Hệ Thống Chủ Nhiệm'); else location.href = 'chunhiem.html'; };
      } else el.innerHTML = '';
    }
  };
  window.EHDemo = EHDemo;
  // lớp mẫu cũ (phiên bản trước) → tự làm mới để có đủ dữ liệu mới (chỉ đụng dữ liệu GIẢ, không đụng lớp thật)
  try { var _dm = get('etv1_demo', null); if (_dm && _dm.v !== DEMO_VER) { EHDemo.clear(); var _d = build(); Object.keys(_d).forEach(function (k) { set(k, _d[k]); }); set('etv1_demo', { ts: Date.now(), v: DEMO_VER }); } } catch (e) { }
  // mở link có ?demo=1 (mã QR cho BGK / người dùng thử) → tự nạp lớp mẫu nếu máy chưa có lớp thật
  try { if (/[?&]demo=1(&|$)/.test(location.search) && !EHDemo.active() && !EHDemo.hasReal()) EHDemo.load(); } catch (e) { }
  // nhãn nhỏ "Lớp mẫu" ở mọi trang khi đang dùng dữ liệu giả
  function pill() {
    if (!EHDemo.active() || document.getElementById('ehd-pill')) return;
    var p = document.createElement('div'); p.id = 'ehd-pill'; p.title = 'Đang dùng lớp mẫu (học sinh giả). Xóa ở trang chính EduTeacher Hub.';
    p.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99990;background:#f59e0b;color:#111;font:800 12px/1 "Segoe UI",system-ui,sans-serif;padding:6px 10px;border-radius:999px;box-shadow:0 3px 10px rgba(0,0,0,.3);pointer-events:none;opacity:.92';
    p.textContent = '🧪 Lớp mẫu – học sinh giả'; document.body.appendChild(p);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', pill); else pill();
})();
