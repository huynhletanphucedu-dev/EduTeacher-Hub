/**
 * EduTeacher Hub – Google Apps Script
 * Nhận kết quả trò chơi từ học sinh và ghi vào Google Sheet.
 *
 * ════════════════════════════════════════════════════════════
 * HƯỚNG DẪN CÀI ĐẶT (làm 1 lần duy nhất):
 * ════════════════════════════════════════════════════════════
 * 1. Mở Google Sheet mới (sheets.google.com)
 * 2. Vào menu: Phần mở rộng → Apps Script
 * 3. Xóa code mặc định, dán toàn bộ code này vào → Ctrl+S (Lưu)
 * 4. Nhấn "Triển khai" → "Triển khai mới"
 *    - Chọn loại: Ứng dụng web
 *    - Thực thi với tư cách: Tôi (tài khoản của bạn)
 *    - Ai có quyền truy cập: Mọi người (Anyone)
 *    - Nhấn "Triển khai"
 * 5. Nếu xuất hiện "Ủy quyền truy cập" → nhấn vào → chọn tài khoản
 *    → nhấn Advanced → Go to ... (unsafe) → Allow
 * 6. Copy URL Web App (dạng https://script.google.com/macros/s/.../exec)
 * 7. Dán URL vào EduTeacher Hub → Trò Chơi → ô Apps Script URL → Lưu
 * ════════════════════════════════════════════════════════════
 * Lưu ý: Mỗi khi sửa code phải "Triển khai mới" để áp dụng thay đổi.
 *        Không dùng URL /dev cho học sinh (chỉ dùng URL /exec).
 * ════════════════════════════════════════════════════════════
 */

var SHEET_NAME = 'Kết Quả Game';

/**
 * Xử lý GET – game_tracker.js gửi dữ liệu qua URL param ?edu_data=...
 * (Đáng tin cậy hơn POST với no-cors vì tránh được vấn đề redirect)
 */
function doGet(e) {
  if (e.parameter && e.parameter.edu_data) {
    return handleData(e.parameter.edu_data);
  }
  // Test: truy cập URL trực tiếp sẽ thấy thông báo này
  return ContentService
    .createTextOutput('✅ EduTeacher Hub – Apps Script đang hoạt động!')
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Xử lý POST (dự phòng)
 */
function doPost(e) {
  var body = e.postData ? e.postData.contents : null;
  if (body) return handleData(body);
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'error', message: 'no data' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Xử lý dữ liệu JSON và ghi vào Sheet
 */
function handleData(jsonStr) {
  try {
    var data = JSON.parse(jsonStr);

    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);

    // Tự động tạo sheet + header nếu chưa có
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      var headers = ['STT','Thời Gian','Phiên / Lớp','Tên Học Sinh','Trò Chơi','Điểm','Thời Gian Chơi (giây)','Ghi Chú'];
      sheet.appendRow(headers);

      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#1e3a5f');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
      headerRange.setFontSize(11);
      headerRange.setHorizontalAlignment('center');
      sheet.setFrozenRows(1);

      sheet.setColumnWidth(1, 50);
      sheet.setColumnWidth(2, 165);
      sheet.setColumnWidth(3, 160);
      sheet.setColumnWidth(4, 185);
      sheet.setColumnWidth(5, 185);
      sheet.setColumnWidth(6, 70);
      sheet.setColumnWidth(7, 150);
      sheet.setColumnWidth(8, 180);
    }

    var lastRow = sheet.getLastRow();
    var stt     = lastRow; // row 1 = header → stt bắt đầu từ 1

    sheet.appendRow([
      stt,
      data.timestamp    || new Date().toLocaleString('vi-VN'),
      data.session      || '',
      data.student      || '',
      data.game         || '',
      data.score        !== undefined ? Number(data.score) : 0,
      data.time_seconds !== undefined ? Number(data.time_seconds) : 0,
      data.detail       || ''
    ]);

    // Tô màu xen kẽ
    var newRow = sheet.getLastRow();
    if (newRow % 2 === 0) {
      sheet.getRange(newRow, 1, 1, 8).setBackground('#f0f7ff');
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', row: newRow }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
