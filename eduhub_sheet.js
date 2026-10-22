/* EduTeacher Hub – tiện ích bảng tính dùng chung (đọc Excel/CSV, chuẩn hóa tiếng Việt) */
(function () {
  'use strict';
  var S = {};
  /* đọc file Excel/CSV → [{name, rows:[[...]]}] (mỗi sheet một bảng) */
  S.readFile = function (file) {
    return file.arrayBuffer().then(function (buf) {
      if (/\.csv$|\.txt$/i.test(file.name) && !window.XLSX) {
        var t = new TextDecoder('utf-8').decode(buf); return [{ name: file.name, rows: ED.parseTable(t) }];
      }
      var wb = XLSX.read(buf, { type: 'array', cellDates: false });
      return wb.SheetNames.map(function (n) {
        var rows = XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: false, defval: '', blankrows: false });
        rows = rows.map(function (r) { return r.map(function (c) { return String(c == null ? '' : c).trim(); }); });
        // bỏ cột trống ở cuối
        var w = 0; rows.forEach(function (r) { for (var i = r.length - 1; i >= 0; i--) if (r[i] !== '') { w = Math.max(w, i + 1); break; } });
        return { name: n, rows: rows.map(function (r) { r = r.slice(0, w); while (r.length < w) r.push(''); return r; }).filter(function (r) { return r.some(function (c) { return c !== ''; }); }) };
      }).filter(function (s) { return s.rows.length; });
    });
  };
  /* tìm dòng tiêu đề: dòng đầu tiên có chữ "tên"/"stt" hoặc dòng đầu */
  S.headerRow = function (rows) {
    for (var i = 0; i < Math.min(rows.length, 12); i++) {
      var n = rows[i].map(ED.norm).join('|');
      if (/(^|\|)(stt|tt)(\||$)|ho va ten|ho ten|ten hoc sinh|\|ten\||^ten\|/.test(n)) return i;
    }
    return 0;
  };
  S.findCol = function (head, re) { var h = head.map(ED.norm); for (var i = 0; i < h.length; i++) if (re.test(h[i])) return i; return -1; };
  S.nameCol = function (head) { var i = S.findCol(head, /ho va ten|ho ten|ho, ten|ten hoc sinh|^ten$|^hoten/); return i; };
  /* chuẩn hóa tiếng Việt */
  S.nfc = function (s) { return String(s || '').normalize('NFC'); };
  S.cleanName = function (s) {
    s = S.nfc(s).replace(/[ \s]+/g, ' ').trim();
    return s.toLocaleLowerCase('vi').split(' ').map(function (w) { return w ? w.charAt(0).toLocaleUpperCase('vi') + w.slice(1) : w; }).join(' ');
  };
  S.split = function (full) { var p = S.nfc(full).trim().split(/\s+/); var ten = p.pop() || ''; return { hoDem: p.join(' '), ten: ten, ho: p[0] || '' }; };
  var COLL = (window.Intl && Intl.Collator) ? new Intl.Collator('vi', { sensitivity: 'variant', numeric: true }) : null;
  S.cmp = function (a, b) { a = S.nfc(a); b = S.nfc(b); return COLL ? COLL.compare(a, b) : (a < b ? -1 : a > b ? 1 : 0); };
  S.cmpName = function (a, b) { var x = S.split(a), y = S.split(b); return S.cmp(x.ten, y.ten) || S.cmp(x.hoDem, y.hoDem); };
  S.cleanDate = function (v) {
    v = String(v || '').trim(); if (!v) return v;
    if (/^\d{5}(\.\d+)?$/.test(v)) { var d = new Date(Math.round((+v - 25569) * 864e5)); return ED.pad(d.getUTCDate()) + '/' + ED.pad(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear(); }
    var m = v.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/); if (m) return ED.pad(m[3]) + '/' + ED.pad(m[2]) + '/' + m[1];
    m = v.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})$/);
    if (m) { var y = +m[3]; if (y < 100) y += y > 50 ? 1900 : 2000; return ED.pad(m[1]) + '/' + ED.pad(m[2]) + '/' + y; }
    return v;
  };
  S.cleanPhone = function (v) {
    var s = String(v || '').replace(/[^\d+]/g, ''); if (!s) return String(v || '').trim();
    if (s.indexOf('+84') === 0) s = '0' + s.slice(3); else if (s.indexOf('84') === 0 && s.length === 11) s = '0' + s.slice(2);
    if (s.length === 9 && s[0] !== '0') s = '0' + s;
    return s;
  };
  /* bảng HTML xem trước (rows[0] là tiêu đề), mark: Set các "r,c" cần tô */
  S.table = function (rows, mark, limit) {
    limit = limit || 400; mark = mark || new Set();
    var h = rows[0] || [], body = rows.slice(1, limit + 1);
    return '<thead><tr>' + h.map(function (c) { return '<th>' + ED.esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      body.map(function (r, i) { return '<tr>' + r.map(function (c, j) { var k = (i + 1) + ',' + j; return '<td' + (mark.has(k) ? ' class="chg"' : mark.has('row' + (i + 1)) ? ' class="dup"' : '') + '>' + ED.esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') +
      (rows.length - 1 > limit ? '<tr><td colspan="' + h.length + '" class="hint">… còn ' + (rows.length - 1 - limit) + ' dòng (vẫn có trong file tải về)</td></tr>' : '') + '</tbody>';
  };
  S.toTSV = function (rows) { return rows.map(function (r) { return r.join('\t'); }).join('\n'); };
  window.ES = S;
})();
