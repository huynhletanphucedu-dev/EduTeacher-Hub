/**
 * EduTeacher Hub – Game Tracker v2
 * URL params: ?gt_session=ID&gt_script=APPS_SCRIPT_URL&gt_game=TÊN_GAME
 */
(function () {
  const params  = new URLSearchParams(window.location.search);
  const SESSION = params.get('gt_session');
  const SCRIPT  = params.get('gt_script');
  const GAME    = params.get('gt_game') || window.__GT_GAME_NAME || document.title || 'Game';

  if (!SESSION || !SCRIPT) return; // Không ở chế độ lớp học

  let studentName = '';
  let submitted   = false;
  let startTime   = null;
  let pollTimer   = null;

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
        <h2 style="color:#38bdf8;font-size:1.3rem;margin:0 0 .2rem">EduTeacher Hub</h2>
        <p style="color:#f8fafc;font-size:.88rem;font-weight:700;margin:0 0 .2rem">${GAME}</p>
        <p style="color:#64748b;font-size:.78rem;margin:0 0 1.4rem">
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
      startTime   = Date.now();
      ov.remove();
      setTimeout(hookGame, 500);
      setTimeout(startPolling, 4000);
      showManualBtn();
    });
  }

  /* ── 2. NÚT NỘP KẾT QUẢ THỦ CÔNG (dự phòng) ── */
  function showManualBtn() {
    const btn = document.createElement('button');
    btn.id = '_gt_manual_btn';
    btn.innerHTML = '📤 Nộp Kết Quả';
    btn.title = 'Bấm khi trò chơi kết thúc để ghi kết quả';
    btn.style.cssText = [
      'position:fixed;bottom:16px;right:16px;z-index:99999',
      'padding:8px 16px;background:#0f172a;color:#38bdf8',
      'border:1.5px solid #1e40af;border-radius:20px',
      'font-size:.8rem;font-weight:700;cursor:pointer',
      'font-family:"Segoe UI",sans-serif',
      'box-shadow:0 4px 12px rgba(0,0,0,.4);transition:background .15s'
    ].join(';');
    btn.addEventListener('mouseenter', () => { btn.style.background = '#1e3a5f'; });
    btn.addEventListener('mouseleave', () => { btn.style.background = '#0f172a'; });
    btn.addEventListener('click', () => submitResult(getScore(), 'manual'));
    document.body.appendChild(btn);
  }

  /* ── 3. ĐỌC ĐIỂM TỪ DOM ── */
  function getScore() {
    const ids = [
      'endScore','scoreNum','scoreText','scoreW','correct',
      'qCorrect','scoreDisp','score','finalScore','totalScore',
      'points','userScore','playerScore','result-score'
    ];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) { const n = parseInt(el.textContent); if (!isNaN(n) && n >= 0) return n; }
    }
    const els = document.querySelectorAll(
      '[id*="score"],[id*="correct"],[id*="point"],[class*="score-val"],[class*="score_val"]'
    );
    for (const el of els) {
      const n = parseInt(el.textContent);
      if (!isNaN(n) && n >= 0 && n < 100000) return n;
    }
    return 0;
  }

  /* ── 4. GỬI KẾT QUẢ LÊN GOOGLE SHEETS ──
   * Dùng GET + URL params thay vì POST vì:
   * fetch POST + no-cors bị Google Apps Script redirect → mất body.
   * GET không có vấn đề này, doGet nhận e.parameter.edu_data. ── */
  function submitResult(score, extra) {
    if (submitted || !studentName) return;
    submitted = true;
    if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; }

    const elapsed = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
    const payload = {
      session:      SESSION,
      student:      studentName,
      game:         GAME,
      score:        score,
      time_seconds: elapsed,
      timestamp:    new Date().toLocaleString('vi-VN'),
      detail:       extra || ''
    };

    setStatus('⏳ Đang ghi kết quả...');

    const mb = document.getElementById('_gt_manual_btn');
    if (mb) mb.remove();

    try {
      const url = new URL(SCRIPT);
      url.searchParams.set('edu_data', JSON.stringify(payload));
      fetch(url.toString(), { mode: 'no-cors' })
        .then(() => setStatus('✅ Đã lưu! Giáo viên sẽ thấy điểm của bạn.'))
        .catch(() => setStatus('⚠️ Mất kết nối – chưa lưu được kết quả'));
    } catch (e) {
      setStatus('⚠️ Apps Script URL không hợp lệ');
    }
  }

  function setStatus(msg) {
    let el = document.getElementById('_gt_status');
    if (!el) {
      el = document.createElement('div');
      el.id = '_gt_status';
      el.style.cssText = [
        'position:fixed;bottom:52px;left:50%;transform:translateX(-50%)',
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

  /* ── 5. HOOK VÀO SỰ KIỆN KẾT THÚC GAME ── */
  function hookGame() {
    // Bọc các hàm kết thúc phổ biến
    [
      'endGame','showResult','showEndScreen','gameOver',
      'finishGame','gameEnd','showScore','displayResult',
      'onGameOver','handleGameEnd'
    ].forEach(fn => {
      if (typeof window[fn] === 'function') {
        const orig = window[fn];
        window[fn] = function (...args) {
          orig.apply(this, args);
          setTimeout(() => submitResult(getScore(), fn), 400);
        };
      }
    });

    // MutationObserver trên các màn hình kết quả
    [
      'winScreen','overlay','game-over-screen','end-screen',
      'result-screen','endScreen','gameOverScreen','resultScreen',
      'finalScreen','scoreScreen','completionScreen'
    ].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      new MutationObserver(() => {
        if (submitted) return;
        const s = window.getComputedStyle(el);
        const visible = s.display !== 'none'
          && s.visibility !== 'hidden'
          && parseFloat(s.opacity) > 0.1;
        if (visible) setTimeout(() => submitResult(getScore(), 'mutation:' + id), 400);
      }).observe(el, { attributes: true, attributeFilter: ['style', 'class'] });
    });
  }

  /* ── 6. POLLING DỰ PHÒNG (mỗi 3 giây, tối đa 20 phút) ── */
  function startPolling() {
    let checks = 0;
    const MAX  = 400;
    const sels = [
      '#winScreen','#overlay','#game-over-screen','#end-screen',
      '#result-screen','#endScreen','#resultScreen','#gameOverScreen',
      '.game-over','.win-screen','.result-screen','.game-over-screen'
    ];
    function poll() {
      if (submitted || checks++ > MAX) return;
      for (const sel of sels) {
        try {
          const el = document.querySelector(sel);
          if (!el) continue;
          const s = window.getComputedStyle(el);
          if (s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0.1) {
            submitResult(getScore(), 'poll');
            return;
          }
        } catch (_) {}
      }
      pollTimer = setTimeout(poll, 3000);
    }
    pollTimer = setTimeout(poll, 3000);
  }

  /* ── KHỞI ĐỘNG ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showNameOverlay);
  } else {
    showNameOverlay();
  }

  window._GT = {
    submitResult,
    getScore,
    setStatus,
    get studentName() { return studentName; }
  };
})();
