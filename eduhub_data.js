/* ═══════════════════════════════════════════════════════════════
   EduTeacher Hub – thư viện dữ liệu dùng chung (chỉ đọc/ghi trên máy)
   Đọc danh sách học sinh lớp chủ nhiệm, sổ điểm, hồ sơ giáo viên…
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var ED = {};
  ED.get = function (k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  ED.set = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { ED.toast('⚠️ Không lưu được (bộ nhớ trình duyệt đầy?)'); return false; } };
  ED.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  ED.$ = function (s, r) { return (r || document).querySelector(s); };
  ED.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  ED.pad = function (n) { return String(n).padStart(2, '0'); };
  ED.today = function (d) { d = d || new Date(); return d.getFullYear() + '-' + ED.pad(d.getMonth() + 1) + '-' + ED.pad(d.getDate()); };
  ED.vnDate = function (iso) { if (!iso) return ''; var p = String(iso).slice(0, 10).split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso; };
  ED.longDate = function (d) { d = d || new Date(); return 'ngày ' + d.getDate() + ' tháng ' + (d.getMonth() + 1) + ' năm ' + d.getFullYear(); };
  ED.uid = function () { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); };
  ED.norm = function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/\s+/g, ' ').trim(); };

  /* giao diện sáng/tối + nhúng trong dashboard */
  try { if (localStorage.getItem('etv1_theme') === 'dark') document.documentElement.classList.add('ed-dark'); } catch (e) { }
  document.addEventListener('DOMContentLoaded', function () {
    if (document.documentElement.classList.contains('ed-dark')) document.body.classList.add('dark');
    if (window !== window.top) document.body.classList.add('embedded');
  });

  /* ---------- hồ sơ giáo viên ---------- */
  ED.teacher = function () {
    var s = ED.get('etv1_settings', {}) || {};
    return { name: s.name || '', gender: s.gender || 'Thầy', school: s.school || '', dept: s.dept || '', phone: s.phone || '' };
  };
  ED.className = function () { return ED.get('cn_className', '') || ''; };

  /* ---------- học sinh lớp chủ nhiệm ---------- */
  function lastName(full) { var p = String(full || '').trim().split(/\s+/); return p[p.length - 1] || ''; }
  ED.students = function () {
    var list = ED.get('cn_students', []) || [];
    return list.filter(function (s) { return s && s.hoTen; }).map(function (s, i) {
      var ph = s.hoTenMe || s.hoTenCha || '';
      return {
        id: String(s.id), stt: +s.stt || i + 1, hoTen: s.hoTen.trim(), ten: lastName(s.hoTen),
        gioiTinh: s.gioiTinh || '', ngaySinh: s.ngaySinh || '', choO: s.choO || '',
        phone: (s.sdtLienHe || s.sdtMe || s.sdtCha || '').replace(/[^\d+]/g, ''),
        phName: ph, phRole: s.hoTenMe ? 'mẹ' : s.hoTenCha ? 'bố' : '', raw: s
      };
    }).sort(function (a, b) { return a.stt - b.stt; });
  };
  ED.attendance = function () { return ED.get('cn_attendance', {}) || {}; };   // { "YYYY-MM-DD_session": { sid: 'present'|'late'|'absent' } }
  ED.discipline = function () { return ED.get('cn_discipline', []) || []; };   // [{date, studentId, type:'violation'|'commend', points, note}]
  ED.statsFor = function (sid, from, to) {
    var att = ED.attendance(), abs = 0, late = 0, v = 0, c = 0, notesV = [], notesC = [];
    Object.keys(att).forEach(function (k) {
      var d = k.slice(0, 10); if ((from && d < from) || (to && d > to)) return;
      var st = att[k][sid]; if (st === 'absent') abs++; else if (st === 'late') late++;
    });
    ED.discipline().forEach(function (e) {
      if (String(e.studentId) !== String(sid)) return;
      if ((from && e.date < from) || (to && e.date > to)) return;
      if (e.type === 'commend') { c++; if (e.note) notesC.push(e.note); } else { v++; if (e.note) notesV.push(e.note); }
    });
    return { vang: abs, tre: late, viPham: v, khen: c, notesV: notesV, notesC: notesC };
  };
  ED.weekRange = function (d) {
    d = d ? new Date(d) : new Date(); var day = (d.getDay() + 6) % 7;
    var mon = new Date(d); mon.setDate(d.getDate() - day); var sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return { from: ED.today(mon), to: ED.today(sun), mon: mon, sun: sun };
  };

  /* ---------- sổ điểm ---------- */
  var TX = { 'Toán': 4, 'Ngữ văn': 4, 'Tiếng Anh': 4, 'KHTN': 4, 'Lịch sử & Địa lý': 4, 'Tin': 2, 'GDCD': 2, 'Nghệ thuật': 2, 'GDTC': 2, 'GDĐP': 2, 'HĐTN-HN': 2 };
  ED.nTX = function (mon, khoi) { if (mon === 'Công nghệ') return [8, 9].indexOf(+khoi) >= 0 ? 3 : 2; return TX[mon] || 2; };
  ED.books = function () { var d = ED.get('etv1_sodiem_v2', { books: [] }) || { books: [] }; return d.books || []; };
  ED.tbm = function (hk, n) {
    if (!hk || !hk.tx) return null;
    var tx = hk.tx.slice(0, n);
    if (tx.length < n || tx.some(function (v) { return v === null || v === '' || v === undefined || isNaN(+v); })) return null;
    if ([hk.gk, hk.ck].some(function (v) { return v === null || v === '' || v === undefined || isNaN(+v); })) return null;
    var s = tx.reduce(function (a, b) { return a + (+b); }, 0);
    return Math.round((s + 2 * hk.gk + 3 * hk.ck) / (n + 5) * 10) / 10;
  };
  /* Danh sách điểm của một sổ: [{ten, tx[], gk, ck, tbm}] ; hk = 'hk1'|'hk2'|'cn' */
  ED.bookScores = function (book, hk) {
    // HK I lấy ở book.hk1.students[].hk1, HK II lấy ở book.hk2.students[].hk2 (cùng id)
    var n = ED.nTX(book.mon, book.khoi), list = (book.hk1 && book.hk1.students) || [], m2 = {};
    ((book.hk2 && book.hk2.students) || []).forEach(function (s) { m2[s.id] = s; });
    return list.map(function (s) {
      var s2 = m2[s.id] || s, h1 = s.hk1 || {}, h2 = s2.hk2 || {};
      var a = ED.tbm(h1, n), b = ED.tbm(h2, n), h = hk === 'hk1' ? h1 : hk === 'hk2' ? h2 : null;
      var t = hk === 'cn' ? (a != null && b != null ? Math.round((a + 2 * b) / 3 * 10) / 10 : null) : (hk === 'hk1' ? a : b);
      return { ten: s.ten, tx: h ? (h.tx || []) : [], gk: h ? h.gk : null, ck: h ? h.ck : null, tbm: t };
    });
  };
  ED.level = function (x) { if (x == null || isNaN(x)) return ''; return x >= 8 ? 'T' : x >= 6.5 ? 'K' : x >= 5 ? 'D' : 'C'; };
  ED.LV = { T: 'Tốt', K: 'Khá', D: 'Đạt', C: 'Chưa đạt' };
  ED.lvBadge = function (l) { return l ? '<span class="badge lv-' + l + '">' + ED.LV[l] + '</span>' : '—'; };


  /* ---------- LỚP DÙNG CHUNG: lớp chủ nhiệm + các sổ điểm ---------- */
  // Mỗi lớp: { id, name, kind:'cn'|'book', book?, students:[{id, stt, hoTen, ten, gioiTinh}] }
  ED.classes = function () {
    var out = [], cn = ED.students(), cnMap = {};
    cn.forEach(function (s) { cnMap[ED.norm(s.hoTen)] = s; });
    if (cn.length) out.push({ id: 'cn', kind: 'cn', name: 'Lớp ' + (ED.className() || 'chủ nhiệm') + ' (chủ nhiệm)', short: ED.className() || 'Chủ nhiệm',
      students: cn.map(function (s) { return { id: s.id, stt: s.stt, hoTen: s.hoTen, ten: s.ten, gioiTinh: s.gioiTinh }; }) });
    ED.books().forEach(function (b) {
      var list = ((b.hk1 && b.hk1.students) || []).filter(function (s) { return s && s.ten; });
      if (!list.length) return;
      out.push({ id: 'b:' + b.id, kind: 'book', book: b, name: (b.mon || 'Sổ điểm') + ' – Lớp ' + (b.lop || '?') + (b.namhoc ? ' (' + b.namhoc + ')' : ''), short: b.lop || '',
        students: list.map(function (s, i) { var m = cnMap[ED.norm(s.ten)]; return { id: String(s.id), stt: i + 1, hoTen: s.ten.trim(), ten: lastName(s.ten), gioiTinh: m ? m.gioiTinh : '' }; }) });
    });
    return out;
  };
  ED.classById = function (id) { var c = ED.classes(); return c.find(function (x) { return x.id === id; }) || null; };
  /* <select> chọn lớp; nhớ lựa chọn theo khóa key */
  ED.classSelect = function (sel, key, onChange) {
    var cls = ED.classes(), cur = ED.get(key, null);
    if (!cls.some(function (c) { return c.id === cur; })) cur = cls.length ? cls[0].id : '';
    sel.innerHTML = cls.length ? cls.map(function (c) { return '<option value="' + ED.esc(c.id) + '"' + (c.id === cur ? ' selected' : '') + '>' + ED.esc(c.name) + ' – ' + c.students.length + ' HS</option>'; }).join('')
      : '<option value="">(Chưa có lớp – nhập ở Chủ Nhiệm hoặc Sổ Điểm)</option>';
    sel.onchange = function () { ED.set(key, sel.value); onChange && onChange(ED.classById(sel.value)); };
    return cur ? ED.classById(cur) : null;
  };
  /* Học sinh vắng hôm nay (chỉ lớp chủ nhiệm có điểm danh) → Set id */
  ED.absentToday = function (cls, date) {
    var out = new Set(); if (!cls || cls.kind !== 'cn') return out;
    var d = date || ED.today(), att = ED.attendance();
    Object.keys(att).forEach(function (k) { if (k.slice(0, 10) !== d) return; var a = att[k]; Object.keys(a).forEach(function (sid) { if (a[sid] === 'absent') out.add(sid); }); });
    return out;
  };
  /* Điểm của từng học sinh trong lớp từ một sổ điểm: {sid: điểm}. Dùng ĐTB môn nếu đủ cột,
     chưa đủ thì lấy trung bình có trọng số các điểm đã có (TX×1, GK×2, CK×3). */
  ED.scoreMap = function (cls, bookId, hk) {
    var out = {}, b = ED.books().find(function (x) { return x.id === bookId; }); if (!b || !cls) return out;
    hk = hk || 'hk1';
    var n = ED.nTX(b.mon, b.khoi), rows = ED.bookScores(b, hk === 'cn' ? 'cn' : hk), byName = {};
    rows.forEach(function (r) {
      var v = r.tbm;
      if (v == null && hk !== 'cn') {
        var s = 0, w = 0; (r.tx || []).slice(0, n).forEach(function (x) { if (ED.num(x) != null) { s += +x; w += 1; } });
        if (ED.num(r.gk) != null) { s += 2 * r.gk; w += 2; } if (ED.num(r.ck) != null) { s += 3 * r.ck; w += 3; }
        v = w ? Math.round(s / w * 10) / 10 : null;
      }
      byName[ED.norm(r.ten)] = v;
    });
    cls.students.forEach(function (s) { var v = byName[ED.norm(s.hoTen)]; if (v != null) out[s.id] = v; });
    return out;
  };

  /* ---------- CHIA NHÓM DÙNG CHUNG ----------
     ED.makeGroups(students, {
       count: số nhóm (hoặc size: số em/nhóm),
       mode: 'random' | 'score' | 'gender' | 'both',
       scores: {sid: điểm},            // cho 'score' / 'both' / chọn nhóm trưởng
       apart: [[sidA, sidB], …],       // không xếp chung
       together: [[sidA, sidB], …],    // phải chung nhóm
       leader: 'score' | 'random' | 'none'
     }) → { groups: [{ members:[sid…], leader: sid|null }], violations: số cặp “không xếp chung” chưa tách được } */
  ED.makeGroups = function (students, o) {
    o = o || {}; var ids = students.map(function (s) { return String(s.id); }), N = ids.length;
    var info = {}; students.forEach(function (s) { info[String(s.id)] = s; });
    var G = Math.max(1, Math.min(N || 1, o.count ? +o.count : Math.ceil(N / Math.max(1, +o.size || 4))));
    var sc = o.scores || {}, has = function (id) { return sc[id] != null; };
    var rnd = Math.random, shuffle = function (a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
    // 1) gom các cặp "phải chung" thành cụm (union-find)
    var par = {}; ids.forEach(function (i) { par[i] = i; });
    var find = function (x) { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
    (o.together || []).forEach(function (p) { var a = String(p[0]), b = String(p[1]); if (par[a] != null && par[b] != null) par[find(a)] = find(b); });
    var cl = {}; ids.forEach(function (i) { var r = find(i); (cl[r] = cl[r] || []).push(i); });
    var clusters = Object.keys(cl).map(function (k) { return cl[k]; });
    var avg = function (c) { var v = c.filter(has).map(function (i) { return sc[i]; }); return v.length ? v.reduce(function (a, b) { return a + b; }, 0) / v.length : -1; };
    var gkey = function (c) { var g = ED.norm(info[c[0]].gioiTinh || ''); return g === 'nu' ? 'F' : g === 'nam' ? 'M' : 'X'; };
    var apart = {}; (o.apart || []).forEach(function (p) { var a = String(p[0]), b = String(p[1]); (apart[a] = apart[a] || {})[b] = 1; (apart[b] = apart[b] || {})[a] = 1; });
    var conflict = function (g, c) { return c.some(function (i) { return g.some(function (j) { return apart[i] && apart[i][j]; }); }); };
    // 2) thứ tự xếp: ngẫu nhiên / theo điểm / theo giới / cả hai
    shuffle(clusters);
    var seqs;
    if (o.mode === 'score') seqs = [clusters.slice().sort(function (a, b) { return avg(b) - avg(a); })];
    else if (o.mode === 'gender' || o.mode === 'both') {
      var by = { F: [], M: [], X: [] }; clusters.forEach(function (c) { by[gkey(c)].push(c); });
      seqs = ['F', 'M', 'X'].map(function (k) { return o.mode === 'both' ? by[k].sort(function (a, b) { return avg(b) - avg(a); }) : by[k]; });
    } else seqs = [clusters];
    var groups = []; for (var g = 0; g < G; g++) groups.push([]);
    var cap = Math.ceil(N / G), dir = 1, pos = 0, bad = 0;
    var sumSc = function (gr) { return gr.reduce(function (s, i) { return s + (has(i) ? sc[i] : 0); }, 0); };
    seqs.forEach(function (seq, si) {
      // nhóm thứ tự: dãy sau bắt đầu từ nhóm đang yếu/ít người nhất để bù lại
      var gorder = groups.map(function (x, i) { return i; });
      if (si > 0) gorder.sort(function (a, b) { return groups[a].length - groups[b].length || sumSc(groups[a]) - sumSc(groups[b]); });
      pos = 0; dir = 1;
      seq.forEach(function (c) {
        // vị trí "rắn" (snake) để rải đều giỏi–khá–TB–yếu, rồi chọn nhóm hợp lệ gần nhất
        var order = []; for (var k = 0; k < G; k++) order.push(gorder[(pos + k * dir + G * 4) % G]);
        var target = order.find(function (gi) { return groups[gi].length + c.length <= cap && !conflict(groups[gi], c); });
        if (target == null) target = order.find(function (gi) { return !conflict(groups[gi], c); });
        if (target == null) { target = groups.map(function (x, i) { return i; }).sort(function (a, b) { return groups[a].length - groups[b].length; })[0]; bad++; }
        Array.prototype.push.apply(groups[target], c);
        pos += dir; if (pos >= G) { pos = G - 1; dir = -1; } else if (pos < 0) { pos = 0; dir = 1; }
      });
    });
    // 3) sửa vi phạm còn lại bằng cách đổi chỗ (không tách cụm "phải chung")
    var inCluster = function (i) { return cl[find(i)].length > 1; };
    var count = function () { var v = 0; groups.forEach(function (gr) { for (var a = 0; a < gr.length; a++) for (var b = a + 1; b < gr.length; b++) if (apart[gr[a]] && apart[gr[a]][gr[b]]) v++; }); return v; };
    for (var it = 0, v = count(); v > 0 && it < 400; it++) {
      var gi = Math.floor(rnd() * G), gj = Math.floor(rnd() * G); if (gi === gj || !groups[gi].length || !groups[gj].length) continue;
      var a = groups[gi][Math.floor(rnd() * groups[gi].length)], b = groups[gj][Math.floor(rnd() * groups[gj].length)];
      if (inCluster(a) || inCluster(b)) continue;
      groups[gi][groups[gi].indexOf(a)] = b; groups[gj][groups[gj].indexOf(b)] = a;
      var nv = count(); if (nv <= v) v = nv; else { groups[gi][groups[gi].indexOf(b)] = a; groups[gj][groups[gj].indexOf(a)] = b; }
    }
    var res = groups.filter(function (x) { return x.length; }).map(function (m) {
      var ld = null;
      if (o.leader === 'random') ld = m[Math.floor(rnd() * m.length)];
      else if (o.leader === 'score') { ld = m.slice().sort(function (a, b) { return (has(b) ? sc[b] : -1) - (has(a) ? sc[a] : -1) || rnd() - .5; })[0]; }
      return { members: m, leader: ld };
    });
    return { groups: res, violations: count() };
  };

  /* ---------- dán bảng từ Excel ---------- */
  ED.parseTable = function (txt) {
    var lines = String(txt || '').replace(/\r/g, '').split('\n').filter(function (l) { return l.trim(); });
    var sep = lines.some(function (l) { return l.indexOf('\t') >= 0; }) ? '\t' : lines.some(function (l) { return l.indexOf(';') >= 0; }) ? ';' : lines.some(function (l) { return l.indexOf('|') >= 0; }) ? '|' : ',';
    return lines.map(function (l) { return l.split(sep).map(function (c) { return c.trim(); }); });
  };
  ED.num = function (v) { if (v == null) return null; var s = String(v).trim().replace(',', '.'); if (s === '' || isNaN(+s)) return null; return +s; };

  /* ---------- xuất file ---------- */
  ED.download = function (data, name, type) {
    var blob = data instanceof Blob ? data : new Blob([data], { type: type || 'application/octet-stream' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  };
  ED.fileName = function (s) { return ED.norm(s).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'file'; };
  /* aoa: mảng 2 chiều; sheets: [{name, aoa, cols}] */
  ED.exportXLSX = function (sheets, name) {
    if (!Array.isArray(sheets)) sheets = [{ name: 'Sheet1', aoa: sheets }];
    if (window.XLSX) {
      var wb = XLSX.utils.book_new();
      sheets.forEach(function (sh) {
        var ws = XLSX.utils.aoa_to_sheet(sh.aoa);
        ws['!cols'] = sh.cols || sh.aoa[0].map(function (_, i) { var m = 6; sh.aoa.forEach(function (r) { m = Math.max(m, String(r[i] == null ? '' : r[i]).length); }); return { wch: Math.min(60, m + 2) }; });
        XLSX.utils.book_append_sheet(wb, ws, String(sh.name).slice(0, 31));
      });
      XLSX.writeFile(wb, name + '.xlsx');
    } else {
      var csv = sheets[0].aoa.map(function (r) { return r.map(function (c) { c = String(c == null ? '' : c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(','); }).join('\n');
      ED.download('﻿' + csv, name + '.csv', 'text/csv');
    }
  };
  /* File .doc mở được bằng Word 2010 trở lên (HTML theo chuẩn Word) */
  ED.exportDoc = function (bodyHTML, name, opt) {
    opt = opt || {};
    var land = opt.landscape, css = opt.css || '';
    bodyHTML = bodyHTML.replace(/<(table|td|th)([^>]*?)style="([^"]*?)width:\s*([\d.]+%)([^"]*)"/gi, function (m, tag, pre, a, w, b) { return '<' + tag + pre + 'width="' + w + '" style="' + a + 'width:' + w + b + '"'; });
    var page = land ? 'size:29.7cm 21cm;mso-page-orientation:landscape;margin:1.5cm 1.5cm 1.5cm 1.5cm' : 'size:21cm 29.7cm;margin:2cm 1.5cm 2cm 2.5cm';
    var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>' + ED.esc(name) + '</title>' +
      '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->' +
      '<style>@page Section1{' + page + '}div.Section1{page:Section1}body{font-family:"Times New Roman";font-size:13pt}table{border-collapse:collapse}td,th{border:1px solid #000;padding:3pt 5pt;font-size:12pt;vertical-align:top}' + css + '</style></head>' +
      '<body><div class="Section1">' + bodyHTML + '</div></body></html>';
    ED.download('﻿' + html, name + '.doc', 'application/msword');
  };
  /* In một đoạn HTML trong khung riêng (không in giao diện công cụ) */
  ED.printHTML = function (bodyHTML, css, title) {
    var f = document.createElement('iframe'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(f);
    var d = f.contentDocument;
    d.open(); d.write('<!doctype html><html><head><meta charset="utf-8"><title>' + ED.esc(title || 'In') + '</title><style>' +
      '@font-face{font-family:BVP;src:url(' + (ED.base || '') + 'lib/BeVietnamPro-Regular.ttf)}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}body{margin:0;font-family:"Times New Roman",serif;color:#000}' + (css || '') + '</style></head><body>' + bodyHTML + '</body></html>'); d.close();
    setTimeout(function () { f.contentWindow.focus(); f.contentWindow.print(); setTimeout(function () { f.remove(); }, 1500); }, 400);
  };
  ED.copy = function (text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).then(function () { return true; }, fallback);
    return Promise.resolve(fallback());
    function fallback() { var t = document.createElement('textarea'); t.value = text; t.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(t); t.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (e) { } t.remove(); return ok; }
  };
  ED.toast = function (m) { var t = document.createElement('div'); t.className = 'toast'; t.textContent = m; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3200); };
  ED.noStudents = function (el) {
    el.innerHTML = '<div class="empty">📋 Chưa có danh sách học sinh lớp chủ nhiệm.<br>Vào <b>Chủ Nhiệm → Danh Sách HS</b> để nhập (gõ tay hoặc nhập từ Excel), rồi quay lại trang này.</div>';
  };
  window.ED = ED;

  /* nhãn "Lớp mẫu" khi đang dùng dữ liệu giả (xem eduhub_demo.js) */
  (function () {
    function pill() { try { if (!localStorage.getItem('etv1_demo') || document.getElementById('ehd-pill')) return; } catch (e) { return; }
      var p = document.createElement('div'); p.id = 'ehd-pill'; p.title = 'Đang dùng lớp mẫu (học sinh giả). Xóa ở trang chính EduTeacher Hub.';
      p.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99990;background:#f59e0b;color:#111;font:800 12px/1 "Segoe UI",system-ui,sans-serif;padding:6px 10px;border-radius:999px;box-shadow:0 3px 10px rgba(0,0,0,.3);pointer-events:none;opacity:.92';
      p.textContent = '🧪 Lớp mẫu – học sinh giả'; document.body.appendChild(p); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', pill); else pill();
  })();
})();
