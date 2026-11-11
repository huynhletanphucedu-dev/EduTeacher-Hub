/* eduhub_qbank.js – NGÂN HÀNG CÂU HỎI CỦA GIÁO VIÊN (Môn → Bài → Câu hỏi), lưu trên máy (localStorage "etv1_qbank").
   Dùng chung cho: Quản lý câu hỏi (tienphong/soan-cau-hoi.html), 20 trò Toán 6, 5 trò ôn tập, Thẻ Hiệp Sĩ.
   • Câu hỏi trắc nghiệm: { id, bai, q, a (đáp án đúng), w: [đáp án sai…], g (giải thích) }
   • Tự chuyển dữ liệu cũ "tp_custom_q" (câu hỏi tự soạn trước đây) vào môn Toán – bài "Câu hỏi của tôi".
   • Vẫn ghi lại "tp_custom_q" (= tất cả câu hỏi) để các phần cũ chưa cập nhật vẫn dùng được.          */
(function () {
  var KEY = 'etv1_qbank';
  var MON_GOI_Y = ['Toán', 'Ngữ văn', 'Tiếng Anh', 'Khoa học tự nhiên', 'Lịch sử và Địa lí', 'Giáo dục công dân', 'Tin học', 'Công nghệ',
    'Hoạt động trải nghiệm', 'Âm nhạc', 'Mĩ thuật', 'Giáo dục thể chất', 'Tiếng Việt', 'Vật lí', 'Hóa học', 'Sinh học', 'Lịch sử', 'Địa lí'];
  function get(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function uid(p) { return (p || '') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function norm(t) { return String(t || '').normalize('NFC').trim(); }
  function slug(t) { return norm(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'mon'; }
  function okQ(x) { return x && norm(x.q) && norm(x.a) && Array.isArray(x.w) && x.w.filter(function (s) { return norm(s); }).length; }

  function empty() { return { v: 1, mon: [], bai: [], cau: [] }; }
  function load() {
    var db = get(KEY, null);
    if (!db || !Array.isArray(db.mon)) {
      db = empty();
      var old = (get('tp_custom_q', []) || []).filter(okQ);
      if (old.length) {   // chuyển câu hỏi tự soạn cũ
        db.mon.push({ id: 'toan', ten: 'Toán' });
        var b = { id: uid('b'), mon: 'toan', khoi: 6, ten: 'Câu hỏi của tôi', t: Date.now() };
        db.bai.push(b);
        old.forEach(function (x) { db.cau.push({ id: uid('q'), bai: b.id, q: norm(x.q), a: norm(x.a), w: x.w.map(norm).filter(Boolean).slice(0, 5), g: norm(x.g) }); });
        save(db);
      }
    }
    db.mon = db.mon || []; db.bai = db.bai || []; db.cau = db.cau || [];
    return db;
  }
  function save(db) {
    var ok = set(KEY, db);
    // tương thích: phần cũ đọc "tp_custom_q"
    set('tp_custom_q', db.cau.filter(okQ).map(function (x) { return { q: x.q, a: x.a, w: x.w, g: x.g || '' }; }));
    return ok;
  }
  var QB = {
    KEY: KEY, MON_GOI_Y: MON_GOI_Y, load: load, save: save, uid: uid, okQ: okQ,
    /* các môn đang có (kèm số bài, số câu) */
    subjects: function (db) { db = db || load(); return db.mon.map(function (m) { var bs = db.bai.filter(function (b) { return b.mon === m.id; });
      return { id: m.id, ten: m.ten, soBai: bs.length, soCau: db.cau.filter(function (c) { return bs.some(function (b) { return b.id === c.bai; }); }).length }; }); },
    lessons: function (monId, db) { db = db || load(); return db.bai.filter(function (b) { return !monId || b.mon === monId; })
      .sort(function (a, b) { return (a.khoi || 0) - (b.khoi || 0) || a.ten.localeCompare(b.ten, 'vi', { numeric: true }); })
      .map(function (b) { return Object.assign({}, b, { soCau: db.cau.filter(function (c) { return c.bai === b.id; }).length }); }); },
    questions: function (baiIds, db) { db = db || load(); var S = Array.isArray(baiIds) ? baiIds : [baiIds];
      return db.cau.filter(function (c) { return S.indexOf(c.bai) >= 0 && okQ(c); }); },
    monName: function (id, db) { db = db || load(); var m = db.mon.filter(function (x) { return x.id === id; })[0]; return m ? m.ten : ''; },
    lesson: function (id, db) { db = db || load(); return db.bai.filter(function (x) { return x.id === id; })[0] || null; },
    addSubject: function (ten, db) { db = db || load(); ten = norm(ten); if (!ten) return null;
      var ex = db.mon.filter(function (m) { return m.ten.toLowerCase() === ten.toLowerCase(); })[0]; if (ex) return ex;
      var id = slug(ten), n = 2; while (db.mon.some(function (m) { return m.id === id; })) id = slug(ten) + '-' + (n++);
      var m = { id: id, ten: ten }; db.mon.push(m); save(db); return m; },
    /* gói chia sẻ: { app:'EduTeacher Hub', loai:'cau-hoi', mon:[], bai:[], cau:[] } */
    exportPack: function (opt, db) { db = db || load(); opt = opt || {};
      var bai = db.bai.filter(function (b) { return opt.bai ? opt.bai.indexOf(b.id) >= 0 : (!opt.mon || b.mon === opt.mon); });
      var monIds = bai.map(function (b) { return b.mon; });
      return { app: 'EduTeacher Hub', loai: 'cau-hoi', v: 1, mon: db.mon.filter(function (m) { return monIds.indexOf(m.id) >= 0; }), bai: bai,
        cau: db.cau.filter(function (c) { return bai.some(function (b) { return b.id === c.bai; }); }) }; },
    /* nhập gói: gộp theo TÊN môn + TÊN bài + khối, bỏ câu trùng nội dung */
    importPack: function (p, db) { db = db || load(); var added = { bai: 0, cau: 0 };
      if (!p || !Array.isArray(p.bai) || !Array.isArray(p.cau)) throw new Error('File không đúng định dạng câu hỏi EduTeacher Hub');
      var monMap = {}; (p.mon || []).forEach(function (m) { monMap[m.id] = QB.addSubject(m.ten, db).id; });
      var baiMap = {};
      p.bai.forEach(function (b) { var mon = monMap[b.mon] || QB.addSubject('Toán', db).id;
        var ex = db.bai.filter(function (x) { return x.mon === mon && x.ten === b.ten && (x.khoi || '') == (b.khoi || ''); })[0];
        if (!ex) { ex = { id: uid('b'), mon: mon, khoi: b.khoi || '', ten: norm(b.ten) || 'Bài', t: Date.now() }; db.bai.push(ex); added.bai++; }
        baiMap[b.id] = ex.id; });
      p.cau.forEach(function (c) { var bai = baiMap[c.bai]; if (!bai || !okQ(c)) return;
        if (db.cau.some(function (x) { return x.bai === bai && x.q === norm(c.q); })) return;
        db.cau.push({ id: uid('q'), bai: bai, q: norm(c.q), a: norm(c.a), w: c.w.map(norm).filter(Boolean).slice(0, 5), g: norm(c.g) }); added.cau++; });
      save(db); return added; }
  };
  window.QB = QB;
})();
