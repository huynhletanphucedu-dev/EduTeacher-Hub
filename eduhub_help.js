/* ═══════════════════════════════════════════════════════════════
   EduTeacher Hub – Hướng dẫn: nút ❔ trên từng công cụ, tour giới thiệu
   ở trang chính, và dữ liệu cho trang huongdan.html.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  /* ===== GÓP Ý / BÁO LỖI =====
     Dán URL Web App của Google Apps Script (xem tools/gopy_apps_script.gs) vào đây.
     Để trống thì nút Góp ý sẽ chép nội dung và mở Zalo của tác giả. */
  var FEEDBACK_URL = '';
  var ZALO = 'https://zalo.me/0898904446';
  /* g: nhóm · i: biểu tượng · t: tên · d: mô tả · s: các bước · m: mẹo */
  var H = {
    'cong_cu_chamtn.html': { g: 'kt', i: '📷', t: 'Chấm trắc nghiệm', d: 'Phiếu tô 3 phần theo CV 7991, quét bằng camera hoặc ảnh chụp, chấm điểm tự động.', s: ['Bước 1: đặt tên bài, chọn lớp, nhập số câu từng phần (bấm “Mẫu CV 7991” cho nhanh) rồi in phiếu – nên in phiếu có sẵn tên + STT.', 'Bước 2: nhập đáp án cho từng mã đề (Phần I lấy được từ Trộn đề).', 'Bước 3: mở camera, đưa phiếu vào khung đủ 4 ô đen ở góc – nghe “bíp” là đã chấm, đổi tờ khác. Hoặc chọn nhiều ảnh chụp sẵn.', 'Bước 4: nhập điểm tự luận (nếu có), xuất Excel, in phiếu sửa bài hoặc đưa điểm vào Sổ điểm.'], m: 'Camera trên điện thoại cần mở bản online (https). Đặt phiếu trên mặt phẳng, đủ sáng, không bóng đổ.' },
    'cong_cu_taode.html': { g: 'kt', i: '📝', t: 'Tạo đề kiểm tra', d: 'Soạn đề trắc nghiệm + tự luận, xuất Word kèm đáp án.', s: ['Nhập thông tin đề (trường, môn, lớp, thời gian).', 'Thêm câu trắc nghiệm / tự luận, hoặc bấm “📚 Lấy câu hỏi từ Ngân hàng câu hỏi” để chọn bài và số câu.', 'Bấm “Tạo đề kiểm tra (.docx)” và “Tạo đáp án riêng”.'], m: 'Câu hỏi soạn một lần ở Quản lý câu hỏi trò chơi dùng được cho cả trò chơi lẫn đề kiểm tra.' },
    'cong_cu_tronde.html': { g: 'kt', i: '🔀', t: 'Trộn đề kiểm tra', d: 'Từ đề gốc tạo nhiều mã đề, xáo câu và đáp án.', s: ['Dán hoặc mở file đề gốc theo đúng định dạng hướng dẫn trên trang.', 'Chọn số mã đề, có xáo câu / xáo đáp án hay không.', 'Bấm tạo → tải file ZIP gồm các mã đề Word và bảng đáp án.'], m: 'Sau khi trộn, sang Chấm trắc nghiệm bấm “Lấy đáp án vừa trộn” – có cả nội dung câu hỏi để in phiếu sửa bài.' },
    'cong_cu_matran.html': { g: 'kt', i: '📐', t: 'Ma trận đề kiểm tra', d: 'Ma trận và bản đặc tả theo CV 7991, tự tính điểm, xuất Word.', s: ['Nhập các chủ đề / nội dung kiến thức.', 'Điền số câu theo mức độ và dạng câu hỏi – điểm và tỉ lệ tự tính.', 'Xuất Word ma trận và bản đặc tả.'] },
    'cong_cu_thongke.html': { g: 'kt', i: '📊', t: 'Thống kê điểm', d: 'Phổ điểm, tỉ lệ Tốt/Khá/Đạt, so sánh lớp cho báo cáo tổ.', s: ['Chọn sổ điểm có sẵn hoặc dán bảng điểm từ Excel.', 'Xem biểu đồ phổ điểm, tỉ lệ các mức.', 'Xuất bảng / biểu đồ để đưa vào báo cáo.'] },
    'cong_cu_phongthi.html': { g: 'kt', i: '🪪', t: 'Số báo danh & phòng thi', d: 'Đánh SBD, chia phòng thi, in danh sách ký tên và thẻ dự thi.', s: ['Dán danh sách học sinh (có thể từ nhiều lớp).', 'Chọn cách xếp, số em mỗi phòng, quy tắc SBD.', 'In danh sách phòng thi, danh sách ký tên, thẻ dự thi.'] },
    'cong_cu_phieutoan.html': { g: 'kt', i: '🧮', t: 'Phiếu bài tập Toán', d: 'Máy tự sinh phiếu bài tập, mỗi học sinh một đề khác, kèm đáp án.', s: ['Tick chọn các dạng bài (lớp 6–9).', 'Chọn độ khó, số câu mỗi dạng, khổ phiếu A4 hoặc A5.', 'Chọn theo số đề hoặc theo danh sách lớp (in sẵn tên) rồi bấm In phiếu.'], m: 'Bấm “🎲 Đề mới” để đổi toàn bộ số liệu.' },
    'cong_cu_baocao.html': { g: 'vb', i: '📄', t: 'Tạo báo cáo CN', d: 'Điền form nhanh, xuất báo cáo tuần chuẩn Word.', s: ['Điền các mục của báo cáo tuần.', 'Xem trước rồi xuất Word.'] },
    'cong_cu_baocaock.html': { g: 'vb', i: '📑', t: 'Báo cáo cuối kỳ', d: 'Một chạm gom sổ điểm, chuyên cần, thi đua, nhận xét thành báo cáo lớp và phiếu báo phụ huynh.', s: ['Chọn kỳ báo cáo và khoảng ngày.', 'Kiểm tra các nguồn dữ liệu được gom (bỏ tick nguồn không muốn đưa vào).', 'Bấm Báo cáo lớp (Word), Phiếu báo phụ huynh (Word / In) hoặc Bảng tổng hợp (Excel).'], m: 'Muốn có xếp loại và lời nhận xét, soạn trước ở Chủ Nhiệm → Nhận xét TT22.' },
    'cong_cu_bieumau.html': { g: 'vb', i: '🗂️', t: 'Kho biểu mẫu', d: 'Các mẫu biên bản, bản kiểm điểm, giấy phép, phiếu tư vấn…', s: ['Chọn mẫu cần dùng.', 'Điền thông tin, xem trước.', 'In hoặc xuất Word.'] },
    'cong_cu_tronthu.html': { g: 'vb', i: '✉️', t: 'Trộn thư hàng loạt', d: 'Giấy mời họp PH, phiếu liên lạc… cho cả lớp – in và xuất Word.', s: ['Chọn mẫu thư.', 'Lấy danh sách từ lớp hoặc dán từ Excel.', 'In hàng loạt hoặc xuất Word.'] },
    'cong_cu_thetenban.html': { g: 'vb', i: '🪧', t: 'Thẻ tên để bàn', d: 'In thẻ tên gập đôi hàng loạt cho hội nghị, họp phụ huynh.', s: ['Dán danh sách tên (và chức vụ).', 'Chọn kiểu thẻ, cỡ chữ.', 'In rồi gập đôi.'] },
    'cong_cu_giaykhen.html': { g: 'vb', i: '🏅', t: 'Giấy khen hàng loạt', d: 'Chọn mẫu, dán danh sách hoặc lấy từ lớp – in giấy khen, giấy chứng nhận.', s: ['Chọn mẫu giấy, khổ A4 / A5, loại giấy.', 'Điền nội dung chung (đơn vị, thành tích, người ký).', 'Dán danh sách (Họ tên | Lớp | Thành tích riêng) hoặc tick chọn từ lớp.', 'Bấm In tất cả.'], m: 'Khi in: chọn Lề “Không” và bật “Đồ họa nền” để in màu nền. Mẫu “Chỉ chữ” dùng để in lên phôi có sẵn.' },
    'cong_cu_lichday.html': { g: 'lich', i: '📅', t: 'Xếp lịch dạy', d: 'Tạo thời khóa biểu tự động tránh trùng giờ.', s: ['Nhập giáo viên, lớp, số tiết các môn.', 'Đặt ràng buộc (buổi nghỉ, tiết đôi…).', 'Bấm xếp lịch, chỉnh tay nếu cần rồi xuất.'] },
    'cong_cu_lichbaogiang.html': { g: 'lich', i: '🗓️', t: 'Lịch báo giảng tự động', d: 'Từ phân phối chương trình + thời khóa biểu ra lịch báo giảng từng tuần.', s: ['Nhập / dán phân phối chương trình.', 'Nhập thời khóa biểu và ngày nghỉ.', 'Xem lịch từng tuần, xuất Word.'] },
    'cong_cu_congviec.html': { g: 'lich', i: '✅', t: 'Theo dõi công việc', d: 'Bảng Kanban công việc + kho mẫu văn bản nhanh.', s: ['Thêm việc cần làm, đặt hạn.', 'Kéo thẻ giữa các cột Cần làm / Đang làm / Xong.'] },
    'cong_cu_pdf.html': { g: 'anh', i: '📕', t: 'Bộ công cụ PDF', d: 'Ghép, tách, sửa nhanh, in nhiều trang/tờ, chữ ký, nén, PDF ↔ ảnh.', s: ['Chọn chức năng ở thanh bên.', 'Kéo thả file PDF / ảnh vào.', 'Bấm xử lý và tải kết quả.'], m: 'File không gửi đi đâu – xử lý ngay trong trình duyệt.' },
    'cong_cu_anh.html': { g: 'anh', i: '🖼️', t: 'Xử lí ảnh', d: 'Cắt ảnh, làm rõ, đổi định dạng, nén – không cần mạng.', s: ['Chọn ảnh.', 'Chọn thao tác (cắt, xoay, làm rõ, nén…).', 'Tải ảnh kết quả.'] },
    'cong_cu_scan.html': { g: 'anh', i: '📱', t: 'Quét tài liệu bằng điện thoại', d: 'Chụp → tự cắt mép, nắn thẳng, làm trắng → PDF.', s: ['Chụp hoặc chọn ảnh tài liệu.', 'Kiểm tra khung cắt 4 góc, chọn chế độ làm trắng.', 'Thêm trang, xuất PDF.'] },
    'cong_cu_ocr.html': { g: 'anh', i: '🔤', t: 'Nhận dạng chữ (OCR)', d: 'Ảnh chụp / PDF scan → chữ tiếng Việt để dán vào Word.', s: ['Chọn ảnh hoặc PDF.', 'Chờ nhận dạng (lần đầu tải dữ liệu tiếng Việt hơi lâu).', 'Sao chép chữ hoặc tải file .txt / Word.'] },
    'cong_cu_phanloaianh.html': { g: 'anh', i: '🗂️', t: 'Phân loại ảnh', d: 'Gán nhanh ảnh hoạt động vào các thư mục con bằng phím số rồi xuất ra máy.', s: ['Chọn thư mục ảnh (dùng Chrome / Edge trên máy tính).', 'Tạo các thư mục con (Văn nghệ, Thể thao…).', 'Chọn ảnh rồi bấm phím số 1–9 để gán; Enter để xem to từng tấm.', 'Bấm “Xuất ra thư mục”.'] },
    'cong_cu_danhsach.html': { g: 'dl', i: '🔠', t: 'Chuẩn hóa & xếp ABC danh sách', d: 'Sửa họ tên, ngày sinh, SĐT; xếp ABC kiểu Việt Nam.', s: ['Dán danh sách từ Excel.', 'Chọn các cột và cách chuẩn hóa.', 'Sao chép hoặc xuất Excel kết quả.'] },
    'cong_cu_excel.html': { g: 'dl', i: '📗', t: 'Gộp · tách · đối chiếu Excel', d: 'Gộp bảng các lớp, tách theo lớp, tìm ai thiếu / thừa giữa hai danh sách.', s: ['Chọn chức năng gộp / tách / đối chiếu.', 'Chọn các file Excel.', 'Tải file kết quả.'] },
    'cong_cu_bangtrang.html': { noBtn: 1, g: 'ti', i: '🖍️', t: 'Bảng trắng trình chiếu', d: 'Viết vẽ trên TV: ô ly, trục Oxy, thước, compa, thước đo góc, thước parabol, đồ thị, bảng giá trị.', s: ['Chọn nền (trắng, ô ly, trục Oxy, bảng đen…).', 'Dùng bút, hình, chữ; mở 📏 📐 🧭 ⌒ khi cần dụng cụ.', 'Bấm 📈 để vẽ đồ thị hàm số hoặc chèn bảng giá trị.', 'Lưu PNG / PDF; nhiều trang ở góc dưới phải.'], m: 'Bài vẽ tự lưu trên máy, mở lại vẫn còn. Bấm ❔ trên thanh công cụ để xem phím tắt.' },
    'cong_cu_qr.html': { g: 'ti', i: '🔳', t: 'Tạo QR Code', d: 'Tạo mã QR cho link, WiFi, văn bản.', s: ['Chọn loại QR.', 'Nhập nội dung.', 'Tải ảnh QR hoặc in.'] },
    'cong_cu_rutgon.html': { g: 'ti', i: '🔗', t: 'Thu gọn Link', d: 'Rút gọn URL dài, tạo QR kèm theo.', s: ['Dán link dài.', 'Bấm rút gọn, sao chép link ngắn hoặc tải QR.'] },
    'thehiepsi.html': { g: 'lop', i: '🎴', t: 'Thẻ Hiệp Sĩ', d: 'Thẻ giấy quét bằng camera: trả lời trắc nghiệm, điểm danh, tự đánh giá, thi đấu đội.', s: ['Chọn lớp, in thẻ cho học sinh (1, 2 hoặc 4 thẻ/tờ).', 'Chọn chế độ và câu hỏi, bấm quét.', 'Học sinh xoay thẻ để chọn A/B/C/D, giơ thẻ lên – camera ghi nhận cả lớp.'] },
    'chianhom.html': { g: 'lop', i: '👥', t: 'Chia nhóm thông minh', d: 'Cân bằng học lực, nam/nữ, bỏ em vắng, cặp không/phải chung nhóm.', s: ['Chọn lớp và số nhóm.', 'Chọn cách chia, thêm ràng buộc nếu cần.', 'Bấm chia nhóm, trình chiếu hoặc in.'] },
    'tienphong/soan-cau-hoi.html': { g: 'lop', i: '📚', t: 'Quản lý câu hỏi trò chơi', d: 'Chọn môn → tạo bài → soạn câu hỏi; dùng cho mọi trò chơi, đề kiểm tra và link chia sẻ.', s: ['Chọn môn (hoặc thêm môn mới), tạo bài.', 'Soạn câu hỏi: câu hỏi, đáp án đúng, 1–3 đáp án sai, giải thích (Ctrl+Enter để lưu).', 'Có thể dán nhiều câu một lần, xuất / nhập file để chia sẻ cho đồng nghiệp.'] },
    'cn_nhanxet.html': { g: 'cn', i: '📝', t: 'Nhận xét TT22', d: 'Gợi ý xếp loại và soạn sẵn lời nhận xét theo Thông tư 22.', s: ['Chọn học kỳ, khoảng ngày thống kê nề nếp.', 'Xem gợi ý mức rèn luyện, chọn kết quả học tập.', 'Sửa lời nhận xét nếu cần, sao chép sang vnEdu/SMAS hoặc xuất Excel.'] },
    'cn_thidua.html': { g: 'cn', i: '🏆', t: 'Thi đua tuần', d: 'Cộng trừ điểm thi đua cá nhân và tổ, bảng xếp hạng tuần.', s: ['Chia tổ cho học sinh.', 'Bấm tiêu chí để cộng / trừ điểm cho em hoặc tổ.', 'Xem bảng xếp hạng, xuất báo cáo tuần.'] },
    'cn_tinnhan.html': { g: 'cn', i: '💬', t: 'Tin nhắn phụ huynh', d: 'Soạn nhanh tin nhắn gửi phụ huynh theo mẫu.', s: ['Chọn mẫu tin nhắn và học sinh.', 'Sao chép tin nhắn để gửi qua Zalo / SMS.'] }
  };
  window.EH_HELP = H;
  window.EH_GROUPS = { kt: '📝 Kiểm tra & đánh giá', vb: '📄 Văn bản & in ấn', lich: '🗓️ Lịch & công việc', anh: '🖼️ Ảnh & tài liệu', dl: '📊 Danh sách & Excel', ti: '🧰 Tiện ích trên lớp', lop: '🎯 Trên lớp', cn: '👨‍👩‍👧 Chủ nhiệm' };

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
  var path = location.pathname.replace(/\\/g, '/'), key = Object.keys(H).filter(function (k) { return path.slice(-k.length) === k; })[0];
  var base = /\/tienphong\//.test(path) ? '../' : '';

  var CSS = '.ehh-btn{position:fixed;right:14px;bottom:14px;z-index:9990;width:42px;height:42px;border-radius:50%;border:0;background:#0b6aa2;color:#fff;font:800 20px/42px "Segoe UI",system-ui,sans-serif;cursor:pointer;box-shadow:0 6px 18px rgba(37,99,235,.4)}' +
    '.ehh-btn:hover{transform:scale(1.08)}.ehh-tip{position:fixed;right:64px;bottom:20px;z-index:9990;background:#0f172a;color:#fff;font:600 13px "Segoe UI",system-ui,sans-serif;padding:8px 12px;border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,.25);animation:ehhIn .3s}' +
    '@keyframes ehhIn{from{opacity:0;transform:translateX(8px)}}' +
    '.ehh-ov{position:fixed;inset:0;z-index:9995;background:rgba(15,23,42,.5);display:flex;align-items:center;justify-content:center;padding:16px;font-family:"Segoe UI",system-ui,sans-serif}' +
    '.ehh-box{background:#fff;color:#0f172a;border-radius:16px;max-width:520px;width:100%;max-height:88vh;overflow:auto;padding:20px 22px;box-shadow:0 20px 60px rgba(0,0,0,.35);line-height:1.55;font-size:14px}' +
    '.ehh-box h3{margin:0 0 4px;font-size:18px}.ehh-box .d{color:#475569;margin-bottom:10px}.ehh-box ol{padding-left:20px;margin:6px 0}.ehh-box li{margin:5px 0}' +
    '.ehh-box .m{background:#fef9c3;border-radius:10px;padding:8px 10px;margin-top:10px;font-size:13px}.ehh-box .ehh-f{display:flex;gap:8px;justify-content:space-between;align-items:center;margin-top:14px;flex-wrap:wrap}' +
    '.ehh-box a{color:#0b6aa2;font-weight:600;text-decoration:none}.ehh-box button{border:0;background:#0b6aa2;color:#fff;border-radius:10px;padding:8px 18px;font:700 14px "Segoe UI",system-ui,sans-serif;cursor:pointer}' +
    '@media print{.ehh-btn,.ehh-tip{display:none!important}}';
  function css() { if (document.getElementById('ehh-css')) return; var s = document.createElement('style'); s.id = 'ehh-css'; s.textContent = CSS; document.head.appendChild(s); }

  function show(k) {
    var h = H[k]; if (!h) return; css();
    var ov = document.createElement('div'); ov.className = 'ehh-ov';
    ov.innerHTML = '<div class="ehh-box"><h3>' + h.i + ' ' + esc(h.t) + '</h3><div class="d">' + esc(h.d) + '</div><b>Cách dùng</b><ol>' + h.s.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>' +
      (h.m ? '<div class="m">💡 ' + esc(h.m) + '</div>' : '') + '<div class="ehh-f"><span><a href="' + base + 'huongdan.html" target="_blank">📖 Hướng dẫn đầy đủ</a> &nbsp;·&nbsp; <a href="#" class="ehf-l">💬 Góp ý / báo lỗi</a></span><button type="button">Đã hiểu</button></div></div>';
    ov.addEventListener('click', function (e) { if (e.target === ov || e.target.tagName === 'BUTTON') ov.remove(); if (e.target.classList.contains('ehf-l')) { e.preventDefault(); ov.remove(); fbOpen('[' + h.t + '] '); } });
    document.addEventListener('keydown', function f(e) { if (e.key === 'Escape') { ov.remove(); document.removeEventListener('keydown', f); } });
    document.body.appendChild(ov);
  }
  window.EHHelp = { show: show };

  /* ---------- góp ý / báo lỗi ---------- */
  var FCSS = '.ehf-box label{display:block;font-weight:700;font-size:13px;margin:10px 0 4px}.ehf-box select,.ehf-box textarea,.ehf-box input{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:10px;padding:9px 10px;font:14px "Segoe UI",system-ui,sans-serif;color:#0f172a;background:#fff}' +
    '.ehf-box textarea{min-height:110px;resize:vertical}.ehf-box .row2{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ehf-box .note{font-size:12px;color:#64748b;margin-top:8px}.ehf-box .ehh-f button.l{background:#e2e8f0;color:#0f172a}';
  function fbOpen(pre) {
    css(); if (!document.getElementById('ehf-css')) { var st = document.createElement('style'); st.id = 'ehf-css'; st.textContent = FCSS; document.head.appendChild(st); }
    var me = {}; try { me = JSON.parse(lsGet('etv1_settings') || '{}') || {}; } catch (e) { }
    var ov = document.createElement('div'); ov.className = 'ehh-ov';
    ov.innerHTML = '<div class="ehh-box ehf-box"><h3>💬 Góp ý / báo lỗi</h3><div class="d">Ý kiến của thầy/cô giúp EduTeacher Hub tốt hơn cho mọi giáo viên.</div>' +
      '<label>Loại</label><select id="ehf-t"><option>🐞 Báo lỗi</option><option>💡 Đề xuất tính năng</option><option>❤️ Khen / cảm ơn</option><option>❓ Hỏi cách dùng</option></select>' +
      '<label>Nội dung</label><textarea id="ehf-m" maxlength="1500" placeholder="VD: Ở công cụ Chấm trắc nghiệm, khi bấm… thì…"></textarea>' +
      '<div class="row2"><div><label>Tên / trường (không bắt buộc)</label><input id="ehf-n" maxlength="80" value="' + esc((me.name || '') + (me.school ? ' – ' + me.school : '')) + '"></div><div><label>Zalo / email để phản hồi (không bắt buộc)</label><input id="ehf-c" maxlength="80"></div></div>' +
      '<div class="note">🔒 Chỉ gửi nội dung trong khung này kèm tên trang và loại trình duyệt – <b>không gửi dữ liệu học sinh</b>.</div>' +
      '<div class="ehh-f"><button type="button" class="l" id="ehf-x">Hủy</button><button type="button" id="ehf-s">Gửi góp ý</button></div></div>';
    document.body.appendChild(ov);
    if (pre) ov.querySelector('#ehf-m').value = pre;
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
    ov.querySelector('#ehf-x').onclick = function () { ov.remove(); };
    ov.querySelector('#ehf-s').onclick = function () {
      var msg = ov.querySelector('#ehf-m').value.trim(); if (!msg) { ov.querySelector('#ehf-m').focus(); return; }
      var d = { type: ov.querySelector('#ehf-t').value, msg: msg, name: ov.querySelector('#ehf-n').value.trim(), contact: ov.querySelector('#ehf-c').value.trim(),
        page: location.pathname.split('/').pop() || 'index', ua: navigator.userAgent.slice(0, 160), screen: innerWidth + 'x' + innerHeight, site: location.host || 'file' };
      if (FEEDBACK_URL) {
        try { fetch(FEEDBACK_URL + (FEEDBACK_URL.indexOf('?') < 0 ? '?' : '&') + 'fb=' + encodeURIComponent(JSON.stringify(d)), { mode: 'no-cors' }); } catch (e) { }
        ov.querySelector('.ehf-box').innerHTML = '<h3>✅ Đã gửi góp ý</h3><div class="d">Cảm ơn thầy/cô! Tác giả sẽ xem và phản hồi (nếu có để lại Zalo / email).</div><div class="ehh-f"><span></span><button type="button">Đóng</button></div>';
        ov.querySelector('button').onclick = function () { ov.remove(); };
      } else {
        var txt = '[EduTeacher Hub – ' + d.type + '] ' + d.msg + (d.name ? '\n– ' + d.name : '') + '\n(Trang: ' + d.page + ')';
        var done = function () { ov.remove(); window.open(ZALO, '_blank'); };
        if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(done, done); else { var t = document.createElement('textarea'); t.value = txt; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (e) { } t.remove(); done(); }
        alert('Đã chép nội dung góp ý. Zalo của tác giả sẽ mở ra – thầy/cô chỉ cần dán (Ctrl+V) và gửi.');
      }
    };
    setTimeout(function () { ov.querySelector('#ehf-m').focus(); }, 50);
  }
  window.EHFeedback = { open: fbOpen };

  function inject() {
    if (!key || H[key].noBtn) return;
    css();
    var b = document.createElement('button'); b.className = 'ehh-btn'; b.type = 'button'; b.textContent = '?'; b.title = 'Hướng dẫn sử dụng công cụ này';
    b.onclick = function () { var t = document.querySelector('.ehh-tip'); if (t) t.remove(); show(key); };
    document.body.appendChild(b);
    if (!lsGet('ehh_seen_' + key)) {
      lsSet('ehh_seen_' + key, '1');
      var tip = document.createElement('div'); tip.className = 'ehh-tip'; tip.textContent = 'Lần đầu dùng? Bấm ? để xem hướng dẫn'; document.body.appendChild(tip);
      setTimeout(function () { tip.remove(); }, 6500);
    }
  }

  /* ---------- tour giới thiệu ở trang chính ---------- */
  var TOUR = [
    { sel: null, t: '👋 Chào mừng đến EduTeacher Hub', d: 'Bộ công cụ miễn phí cho giáo viên: sổ điểm, chủ nhiệm, mô phỏng, trò chơi và hơn 25 công cụ văn phòng. Mọi dữ liệu chỉ lưu trên máy này – không cần tài khoản. Xem nhanh 1 phút nhé!' },
    { sel: '#grp-giangday .nav-group-header', t: '🎯 Giảng dạy', d: 'Sổ điểm cá nhân, gọi tên học sinh, gọi tên vui nhộn, quản lý câu hỏi trò chơi và các trò chơi ôn tập tổng kết bài.' },
    { sel: '#grp-chunhiem .nav-group-header', t: '👨‍👩‍👧 Chủ nhiệm', d: 'Danh sách học sinh, điểm danh, sơ đồ lớp, thi đua, nhận xét TT22, liên lạc phụ huynh… Nên nhập danh sách lớp ở đây trước – các công cụ khác sẽ dùng chung.' },
    { sel: '#grp-mophong .nav-group-header', t: '🔬 Mô phỏng', d: 'Mô phỏng trực quan Toán, KHTN, Lịch sử – Địa lý, Tiếng Anh để trình chiếu trên lớp.' },
    { sel: '#nav-congcu', t: '🛠️ Công cụ khác', d: 'Chấm trắc nghiệm bằng camera, tạo/trộn đề, bảng trắng, giấy khen, báo cáo cuối kỳ, PDF, OCR… Có ô tìm kiếm và nút ☆ để ghim công cụ hay dùng.' },
    { sel: '#nav-trocchoi', t: '🎮 Trò chơi học tập', d: 'Trò chơi cho học sinh. Nút “🔗 Tạo link chia sẻ” để học sinh chơi trên điện thoại, kết quả tự ghi về Google Sheet của thầy/cô.' },
    { sel: '#ehd-box', t: '🧪 Lớp mẫu', d: 'Đang có lớp mẫu với học sinh GIẢ để thầy/cô bấm thử mọi tính năng. Khi dùng thật, bấm xóa lớp mẫu rồi nhập lớp của mình.', opt: true },
    { sel: '#ehs-hero', t: '🔍 Tìm nhanh', d: 'Gõ tên công cụ để mở ngay (phím tắt Ctrl + K ở bất kỳ đâu).' },
    { sel: '.ehb-btn', t: '💾 Sao lưu dữ liệu', d: 'Dữ liệu nằm trong trình duyệt của máy này. Nhớ sao lưu thường xuyên; có thể chuyển sang máy khác bằng file hoặc mã QR.' },
    { sel: '.tb-setting-btn', t: '⚙️ Hồ sơ giáo viên', d: 'Nhập tên, trường, lớp chủ nhiệm – dùng để in tự động lên báo cáo, giấy khen, phiếu.' },
    { sel: null, t: '🎉 Sẵn sàng!', d: 'Mỗi công cụ có nút ? ở góc dưới phải để xem hướng dẫn. Trang “Hướng dẫn sử dụng” có đầy đủ cách dùng và câu hỏi thường gặp.', end: true }
  ];
  var TCSS = '.eht-hole{position:fixed;z-index:9996;border-radius:12px;box-shadow:0 0 0 9999px rgba(15,23,42,.62);transition:all .25s;pointer-events:none;outline:3px solid #0b6aa2}' +
    '.eht-card{position:fixed;z-index:9997;background:#fff;color:#0f172a;border-radius:14px;padding:16px 18px;width:min(340px,calc(100vw - 24px));box-shadow:0 16px 50px rgba(0,0,0,.4);font:14px/1.55 "Segoe UI",system-ui,sans-serif;transition:top .25s,left .25s}' +
    '.eht-card h4{margin:0 0 6px;font-size:16px}.eht-card .n{color:#64748b;font-size:12px}.eht-card .b{display:flex;gap:8px;justify-content:flex-end;align-items:center;margin-top:12px}' +
    '.eht-card button{border:0;border-radius:9px;padding:7px 14px;font:700 13px "Segoe UI",system-ui,sans-serif;cursor:pointer;background:#e2e8f0;color:#0f172a}.eht-card button.p{background:#0b6aa2;color:#fff}.eht-card .sk{background:none;color:#64748b;margin-right:auto;padding-left:0}' +
    '.eht-dim{position:fixed;inset:0;z-index:9995;background:rgba(15,23,42,.62)}';
  var tour = null;
  function tStop(done) { if (!tour) return; tour.els.forEach(function (e) { e.remove(); }); tour = null; if (done) lsSet('ehub_tour_done', '1'); }
  function tStep(i) {
    if (!tour) return;
    var list = TOUR.filter(function (s) { if (!s.sel) return true; var el = document.querySelector(s.sel); if (!el) return false; var r = el.getBoundingClientRect(); return r.width > 4 && r.height > 4 && (!s.opt || el.children.length); });
    if (i < 0) i = 0; if (i >= list.length) { tStop(true); return; }
    tour.i = i; var s = list[i], el = s.sel ? document.querySelector(s.sel) : null;
    tour.els.forEach(function (e) { e.remove(); }); tour.els = [];
    var card = document.createElement('div'); card.className = 'eht-card';
    card.innerHTML = '<div class="n">' + (i + 1) + ' / ' + list.length + '</div><h4>' + esc(s.t) + '</h4><div>' + esc(s.d) + '</div><div class="b">' + (s.end ? '' : '<button class="sk">Bỏ qua</button>') +
      (i ? '<button class="pv">← Trước</button>' : '') + (s.end ? '<a href="huongdan.html" target="_blank" style="color:#0b6aa2;font-weight:700;text-decoration:none;margin-right:auto">📖 Hướng dẫn đầy đủ</a><button class="p nx">Bắt đầu dùng</button>' : '<button class="p nx">' + (i ? 'Tiếp →' : 'Xem nhanh →') + '</button>') + '</div>';
    if (el) {
      el.scrollIntoView({ block: 'nearest' });
      var r = el.getBoundingClientRect(), hole = document.createElement('div'); hole.className = 'eht-hole';
      hole.style.cssText = 'left:' + (r.left - 6) + 'px;top:' + (r.top - 6) + 'px;width:' + (r.width + 12) + 'px;height:' + (r.height + 12) + 'px';
      document.body.appendChild(hole); tour.els.push(hole); document.body.appendChild(card); tour.els.push(card);
      var cw = card.offsetWidth, ch = card.offsetHeight, W = innerWidth, Hh = innerHeight, x, y;
      if (r.right + 16 + cw < W) { x = r.right + 16; y = r.top; } else if (r.bottom + 16 + ch < Hh) { x = r.left; y = r.bottom + 16; } else { x = r.left - cw - 16; y = r.top; }
      if (x < 12 || x + cw > W - 12) x = Math.max(12, Math.min(W - cw - 12, x)); y = Math.max(12, Math.min(Hh - ch - 12, y));
      card.style.left = x + 'px'; card.style.top = y + 'px';
    } else {
      var dim = document.createElement('div'); dim.className = 'eht-dim'; document.body.appendChild(dim); tour.els.push(dim); document.body.appendChild(card); tour.els.push(card);
      card.style.left = Math.max(12, (innerWidth - card.offsetWidth) / 2) + 'px'; card.style.top = Math.max(12, (innerHeight - card.offsetHeight) / 2.4) + 'px';
    }
    card.querySelector('.nx').onclick = function () { tStep(i + 1); };
    var pv = card.querySelector('.pv'); if (pv) pv.onclick = function () { tStep(i - 1); };
    var sk = card.querySelector('.sk'); if (sk) sk.onclick = function () { tStop(true); };
  }
  function tStart() {
    if (tour) return; if (!document.getElementById('ehh-tcss')) { var st = document.createElement('style'); st.id = 'ehh-tcss'; st.textContent = TCSS; document.head.appendChild(st); }
    if (window.showPage) try { showPage('page-welcome'); } catch (e) { }
    tour = { i: 0, els: [] }; tStep(0);
    addEventListener('resize', function () { if (tour) tStep(tour.i); });
  }
  window.EHTour = {
    start: tStart,
    maybe: function () { if (lsGet('ehub_tour_done')) return; var a = document.getElementById('ask-name'); if (a && !a.hidden) return; setTimeout(tStart, 600); }
  };
  document.addEventListener('keydown', function (e) { if (tour && e.key === 'Escape') tStop(true); if (tour && e.key === 'ArrowRight') tStep(tour.i + 1); if (tour && e.key === 'ArrowLeft') tStep(tour.i - 1); });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject); else inject();
})();
