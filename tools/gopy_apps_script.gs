/**
 * EduTeacher Hub – nhận GÓP Ý / BÁO LỖI vào Google Sheet của tác giả.
 *
 * CÁCH CÀI (làm 1 lần, ~3 phút):
 *  1. Tạo Google Sheet mới, đặt tên "EduTeacher Hub – Góp ý".
 *  2. Menu Tiện ích mở rộng → Apps Script → xóa mã mẫu, dán toàn bộ file này → Lưu.
 *  3. Bấm Triển khai (Deploy) → Tùy chọn triển khai mới → loại "Ứng dụng web":
 *       - Thực thi dưới dạng: Tôi (tài khoản của thầy)
 *       - Người có quyền truy cập: Bất kỳ ai
 *     → Triển khai → cấp quyền → chép "URL ứng dụng web" (…/exec).
 *  4. Mở eduhub_help.js, dán URL vào dòng:  var FEEDBACK_URL = '…/exec';
 *  5. Chạy push.sh để đưa lên trang online.
 *  (Tùy chọn) Điền email vào NOTIFY_EMAIL để nhận thư mỗi khi có góp ý mới.
 */
var NOTIFY_EMAIL = '';

function doGet(e) {
  var raw = e && e.parameter && e.parameter.fb;
  if (!raw) return ContentService.createTextOutput('EduTeacher Hub feedback endpoint OK');
  var d = {};
  try { d = JSON.parse(raw); } catch (err) { d = { msg: String(raw).slice(0, 1500) }; }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('GopY') || ss.insertSheet('GopY');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['Thời gian', 'Loại', 'Nội dung', 'Tên / trường', 'Liên hệ', 'Trang', 'Trang web', 'Màn hình', 'Trình duyệt', 'Đã xử lý']);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#dbeafe');
  }
  var clip = function (v, n) { return String(v == null ? '' : v).slice(0, n); };
  sh.appendRow([new Date(), clip(d.type, 40), clip(d.msg, 1500), clip(d.name, 80), clip(d.contact, 80), clip(d.page, 80), clip(d.site, 80), clip(d.screen, 20), clip(d.ua, 160), false]);
  if (NOTIFY_EMAIL) {
    try { MailApp.sendEmail(NOTIFY_EMAIL, 'EduTeacher Hub – ' + clip(d.type, 40), clip(d.msg, 1500) + '\n\n' + clip(d.name, 80) + ' · ' + clip(d.contact, 80) + '\nTrang: ' + clip(d.page, 80)); } catch (err) {}
  }
  return ContentService.createTextOutput('ok');
}
