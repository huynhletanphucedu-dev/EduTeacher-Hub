/**
 * EduTeacher Hub – Google Apps Script
 * Nhận kết quả trò chơi từ học sinh và ghi vào Google Sheet.
 *
 * HƯỚNG DẪN CÀI ĐẶT (làm 1 lần duy nhất):
 * 1. Mở Google Sheet mới → Phần mở rộng → Apps Script
 * 2. Xóa code mặc định, dán toàn bộ code này vào
 * 3. Nhấn "Lưu" (Ctrl+S)
 * 4. Nhấn "Triển khai" → "Triển khai mới"
 *    - Chọn loại: "Ứng dụng web"
 *    - Thực thi với tư cách: "Tôi" (your account)
 *    - Ai có quyền truy cập: "Mọi người" (Anyone)
 * 5. Nhấn "Triển khai" → Copy URL Web App
 * 6. Dán URL đó vào EduTeacher Hub → Trò Chơi → ô "Google Apps Script URL"
 */

// ── Tên sheet để ghi kết quả ──
var SHEET_NAME = 'Kết Quả Game';

/**
 * Xử lý yêu cầu GET (dùng để test xem script hoạt động không)
 */
function doGet(e) {
  return ContentService
    .createTextOutput('EduTeacher Hub – Apps Script đang hoạt động ✅')
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Xử lý yêu cầu POST từ game_tracker.js
 * Dữ liệu JSON: { session, student, game, score, time_seconds, timestamp, detail }
 */
function doPost(e) {
  try {
    var body = e.postData ? e.postData.contents : '{}';
    var data = JSON.parse(body);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);

    // Tự động tạo sheet nếu chưa có
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      // Tạo tiêu đề cột
      sheet.appendRow([
        'STT', 'Thời Gian', 'Phiên / Lớp', 'Tên Học Sinh',
        'Trò Chơi', 'Điểm', 'Thời Gian Chơi (giây)', 'Ghi Chú'
      ]);
      // Định dạng hàng tiêu đề
      var headerRange = sheet.getRange(1, 1, 1, 8);
      headerRange.setBackground('#1e3a5f');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
      headerRange.setFontSize(11);
      sheet.setFrozenRows(1);
      // Độ rộng cột
      sheet.setColumnWidth(1, 50);
      sheet.setColumnWidth(2, 160);
      sheet.setColumnWidth(3, 160);
      sheet.setColumnWidth(4, 180);
      sheet.setColumnWidth(5, 180);
      sheet.setColumnWidth(6, 80);
      sheet.setColumnWidth(7, 140);
      sheet.setColumnWidth(8, 200);
    }

    // Số thứ tự tự động
    var lastRow = sheet.getLastRow();
    var stt = lastRow; // row 1 = header, so row 2 = STT 1

    // Ghi dữ liệu
    sheet.appendRow([
      stt,
      data.timestamp || new Date().toLocaleString('vi-VN'),
      data.session   || '',
      data.student   || '',
      data.game      || '',
      data.score     || 0,
      data.time_seconds || 0,
      data.detail    || ''
    ]);

    // Tô màu xen kẽ hàng
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
