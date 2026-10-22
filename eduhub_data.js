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
})();
