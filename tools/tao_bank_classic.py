"""Tạo bản "script thường" của Ngân hàng câu hỏi + bộ hiển thị phân số, để các trò chơi ôn tập
và Thẻ Hiệp Sĩ chạy được cả khi mở file trực tiếp (bấm đúp, không cần máy chủ).
Tự chạy mỗi lần chạy tools/tao_sw.py – không cần chạy riêng."""
import pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
JS = ROOT / 'tienphong' / 'js'
def build():
    bank = (JS / 'bank-toan6.js').read_text(encoding='utf-8').replace('export const BANK_T6 =', 'window.BANK_T6 =', 1)
    les = (JS / 'lessons.js').read_text(encoding='utf-8').replace('export const SUBJECTS =', 'window.SUBJECTS =', 1)
    head = '// TẠO TỰ ĐỘNG từ bank-toan6.js + lessons.js (tools/tao_bank_classic.py) – không sửa tay.\n'
    (JS / 'bank-classic.js').write_text(head + bank + '\n' + les + '\n', encoding='utf-8')
    mf = (JS / 'math-fmt.js').read_text(encoding='utf-8').replace('export const hasFraction =', 'window.hasFraction =', 1)
    (JS / 'math-fmt-classic.js').write_text('// TẠO TỰ ĐỘNG từ math-fmt.js (tools/tao_bank_classic.py) – không sửa tay.\n(function(){\n' + mf + '\n})();\n', encoding='utf-8')
    # Gói tp-gate.js + tp-journey.js + bai-tap.js thành 1 script thường cho 20 trò "Tiên phong AI"
    def strip(t):
        return '\n'.join(l for l in t.split('\n') if not l.lstrip().startswith('import ') or ' from ' not in l and not l.strip().startswith('import "'))
    bai = strip((JS / 'bai-tap.js').read_text(encoding='utf-8')).replace('export function applyLessons', 'function applyLessons', 1)
    jo = strip((JS / 'tp-journey.js').read_text(encoding='utf-8')).replace('export async function initJourney', 'async function initJourney', 1)
    ga = strip((JS / 'tp-gate.js').read_text(encoding='utf-8'))
    for t in (bai, jo, ga):
        assert 'export ' not in t.replace('// ', ''), 'còn export'
    sel = 'script[src$="tp-gate.js"]'
    jo = jo.replace(sel, 'script[data-cat]'); ga = ga.replace(sel, 'script[data-cat]')
    out = ('// TẠO TỰ ĐỘNG từ tp-gate.js + tp-journey.js + bai-tap.js (tools/tao_bank_classic.py) – không sửa tay.\n'
           '// Cần nạp trước (defer, đúng thứ tự): math-fmt-classic.js, bank-classic.js\n(function(){\n'
           'const BANK_T6 = window.BANK_T6 || {}, SUBJECTS = window.SUBJECTS || [];\n'
           'const applyLessons = (function(){\n' + bai + '\nreturn applyLessons;\n})();\n'
           'const initJourney = (function(){\n' + jo + '\nreturn initJourney;\n})();\n'
           '(async function(){\n' + ga + '\n})();\n})();\n')
    (JS / 'tp-gate.bundle.js').write_text(out, encoding='utf-8')
if __name__ == '__main__':
    build(); print('Đã tạo bank-classic.js, math-fmt-classic.js')
