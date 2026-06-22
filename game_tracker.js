/**
 * EduTeacher Hub – Game Tracker
 * Cho phép giáo viên tạo link chia sẻ game và theo dõi kết quả học sinh qua Google Sheets.
 * URL params: ?gt_session=ID&gt_script=SCRIPT_URL&gt_game=TÊN_GAME
 */
(function () {
  const params = new URLSearchParams(window.location.search);
  const SESSION = params.get('gt_session');
  const SCRIPT  = params.get('gt_script');
  const GAME    = params.get('gt_game') || document.title || 'Game';

  if (!SESSION || !SCRIPT) return; // Không ở chế độ lớp học

  let studentName = '';
  let submitted = false;
  let startTime = null;

  /* ── 1. OVERLAY NHẬP TÊN HỌC SINH ── */
  function showNameOverlay() {
    const ov = document.createElement('div');
    ov.id = '_gt_name_overlay';
    ov.style.cssText = [
      'position:fixed;inset:0;z-index:999999',
      'background:rgba(0,0,0,.88)',
      'display:flex;align-items:center;justify-content:center',
      'font-family:"Segoe UI",sans-serif'
    ].join(';');

    ov.innerHTML = `
      <div style="background:#1e293b;border-radius:20px;padding:2.2rem 2rem;
                  text-align:center;max-width:360px;width:92%;
                  box-shadow:0 24px 64px rgba(0,0,0,.6);">
        <div style="font-size:3rem;margin-bottom:.4rem">🎮</div>
        <h2 style="color:#38bdf8;font-size:1.3rem;margin:0 0 .3rem">EduTeacher Hub</h2>
        <p style="color:#94a3b8;font-size:.85rem;margin:0 0 1.4rem">
          Nhập tên để bắt đầu – kết quả sẽ được ghi lại tự động
        </p>
        <input id="_gt_name_input" type="text" placeholder="Họ và tên học sinh..."
          autocomplete="name"
          style="width:100%;padding:.75rem 1rem;border-radius:10px;
                 border:2px solid #334155;background:#0f172a;color:#f8fafc;
                 font-size:1rem;margin-bottom:.9rem;box-sizing:border-box;outline:none;" />
        <button id="_gt_start_btn"
          style="width:100%;padding:.8rem;background:#0ea5e9;color:#fff;
                 border:none;border-radius:10px;font-size:1rem;font-weight:700;
                 cursor:pointer;transition:background .15s;">
          🚀 Bắt đầu chơi!
        </button>
        <p style="color:#475569;font-size:.72rem;margin-top:1rem">
          Phiên: <strong style="color:#64748b">${SESSION}</strong>
        </p>
      </div>`;

    document.body.appendChild(ov);

    const inp = document.getElementById('_gt_name_input');
    const btn = document.getElementById('_gt_start_btn');
    inp.focus();
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') btn.click(); });
    btn.addEventListener('mouseenter', () => btn.style.background = '#0284c7');
    btn.addEventListener('mouseleave', () => btn.style.background = '#0ea5e9');
    btn.addEventListener('click', () => {
      const n = inp.value.trim();
      if (!n) { inp.style.borderColor = '#ef4444'; inp.focus(); return; }
      studentName = n;
      startTime = Date.now();
      ov.remove();
    });
  }

  /* ── 2. ĐỌC ĐIỂM TỪ DOM ── */
  function getScore() {
    // Thứ tự ưu tiên các ID phổ biến trong các game
    const priority = [
      'endScore','scoreNum','scoreText','scoreW','correct',
      'qCorrect','scoreDisp','score'
    ];
    for (const id of priority) {
      const el = document.getElementById(id);
      if (el) {
        const n = parseInt(el.textContent);
        if (!isNaN(n)) return n;
      }
    }
    // Quét rộng hơn
    const els = document.querySelectorAll('[id*="score"],[id*="correct"],[id*="point"]');
    for (const el of els) {
      const n = parseInt(el.textContent);
      if (!isNaN(n)) return n;
    }
    return 0;
  }

  /* ── 3. GỬI KẾT QUẢ LÊN GOOGLE SHEETS ── */
  function submitResult(score, extra) {
    if (submitted || !studentName) return;
    submitted = true;

    const elapsed = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
    const data = {
      session: SESSION,
      student: studentName,
      game: GAME,
      score: score,
      time_seconds: elapsed,
      timestamp: new Date().toLocaleString('vi-VN'),
      detail: extra || ''
    };

    setStatus('⏳ Đang ghi kết quả...');

    fetch(SCRIPT, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(data)
    })
      .then(() => setStatus('✅ Đã lưu kết quả! Giáo viên sẽ thấy điểm của bạn.'))
      .catch(() => setStatus('⚠️ Mất kết nối – chưa lưu được kết quả'));
  }

  function setStatus(msg) {
    let el = document.getElementById('_gt_status');
    if (!el) {
      el = document.createElement('div');
      el.id = '_gt_status';
      el.style.cssText = [
        'position:fixed;bottom:72px;left:50%;transform:translateX(-50%)',
        'background:#0f172a;color:#38bdf8;padding:.55rem 1.4rem',
        'border-radius:999px;font-family:"Segoe UI",sans-serif',
        'font-size:.88rem;font-weight:700;z-index:999999',
        'box-shadow:0 4px 24px rgba(0,0,0,.5);white-space:nowrap',
        'border:1px solid #1e40af;pointer-events:none'
      ].join(';');
      document.body.appendChild(el);
    }
    el.textContent = msg;
  }

  /* ── 4. HOOK VÀO CÁC SỰ KIỆN KẾT THÚC GAME ── */
  function hookGame() {
    // Chiến lược A: bọc hàm endGame()
    if (typeof window.endGame === 'function') {
      const orig = window.endGame;
      window.endGame = function (...args) {
        orig.apply(this, args);
        setTimeout(() => submitResult(window._GT_SCORE ? window._GT_SCORE() : getScore()), 350);
      };
    }

    // Chiến lược B: bọc hàm showResult() (Word Melt, v.v.)
    if (typeof window.showResult === 'function') {
      const orig = window.showResult;
      window.showResult = function (...args) {
        orig.apply(this, args);
        setTimeout(() => submitResult(window._GT_SCORE ? window._GT_SCORE() : getScore()), 350);
      };
    }

    // Chiến lược C: MutationObserver cho winScreen / overlay / game-over-screen
    ['winScreen', 'overlay', 'game-over-screen', 'end-screen', 'result-screen'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      new MutationObserver(() => {
        const s = window.getComputedStyle(el);
        const visible = s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0;
        if (visible && !submitted) {
          setTimeout(() => submitResult(window._GT_SCORE ? window._GT_SCORE() : getScore()), 350);
        }
      }).observe(el, { attributes: true, attributeFilter: ['style', 'class'] });
    });
  }

  /* ── KHỞI ĐỘNG ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    showNameOverlay();
    setTimeout(hookGame, 600);
  }

  // Expose để game ghi đè nếu cần
  window._GT = {
    submitResult,
    getScore,
    setStatus,
    get studentName() { return studentName; }
  };
})();
