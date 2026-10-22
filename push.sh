#!/bin/bash
cd "/d/EduTeacher Hub"
# Cập nhật danh sách file dùng offline (sw.js) trước khi đưa lên mạng
python tools/tao_sw.py 2>/dev/null || python3 tools/tao_sw.py 2>/dev/null || echo "(Bỏ qua tạo sw.js – máy chưa có Python)"
git add -A
git commit -m "${1:-feat: sao lưu tự động, bộ công cụ PDF mới, thẻ tên để bàn, tìm kiếm Ctrl+K, 20 game Toán 6, PWA offline}"
git push origin main
echo "=== DONE ==="
