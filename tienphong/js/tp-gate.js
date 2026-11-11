// EduTeacher Hub – gắn vào mỗi trò chơi Tiên phong AI (bản offline, không cần tài khoản):
//  - Nút "Về EduTeacher Hub", mèo linh vật, nút Thoát lượt
//  - Chọn bài Toán 6 KNTT + câu hỏi tự soạn của giáo viên
import { initJourney } from "./tp-journey.js";   // chọn bài + Mèo nhắc khi sai (offline)
import "./math-fmt.js";                           // phân số, kí hiệu Toán hiển thị đúng chuẩn

const CAT = document.querySelector('script[src$="tp-gate.js"]')?.dataset.cat || "";
const HOME = "../../dashboard.html";

// ---- Giao diện: nút về sảnh + mèo linh vật ----
const st = document.createElement("style");
st.textContent = `
.web-home{align-self:flex-start;display:inline-flex;align-items:center;gap:4px;font:700 13px 'Be Vietnam Pro',system-ui,sans-serif;color:#27325c;background:#fff;border:2px solid #27325c;border-radius:10px;padding:3px 9px;text-decoration:none;box-shadow:0 2px 0 #27325c;margin-bottom:-4px}
.web-cat{display:block;width:96px;height:auto;margin:-8px auto -6px;filter:drop-shadow(0 3px 0 rgba(39,50,92,.25));animation:webcat 2.4s ease-in-out infinite}
#over .web-cat{width:120px}
html,body{background:linear-gradient(180deg,#bfe7ff 0,#e9f8ff 55%,#c9f0d6 100%) fixed!important}
.wrap>.foot{color:#5d6a8f!important}
@keyframes webcat{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-6px) rotate(2deg)}}
@media (max-height:640px){.web-cat{width:86px}}`;
document.head.appendChild(st);

function decorate(id, withHome){
  const card = document.querySelector(`#${id} .card`); if (!card) return;
  if (CAT) {
    const img = new Image(); img.className = "web-cat"; img.alt = ""; img.src = `../img/${CAT}.png`;
    img.onerror = () => img.remove(); card.prepend(img);
  }
  if (withHome) {
    const a = document.createElement("a"); a.className = "web-home"; a.href = HOME; a.textContent = "🏠 EduTeacher Hub"; a.target = "_self"; card.prepend(a);
  }
}
decorate("menu", true);
decorate("over", true);
// Một số trò tự có mèo trong tiêu đề → ẩn đi để không bị 2 con mèo
["catImg", "catImg2", "menuCat"].forEach(id => { const e = document.getElementById(id); if (e && CAT) e.style.display = "none"; });

// ---- Nút "Thoát" trong lúc chơi: thoát lượt, KHÔNG tính thành tích ----
// Khi bảng hỏi đang mở thì game tạm dừng (giữ lại các khung hình), bấm "Chơi tiếp" thì chạy tiếp.
let paused = false, held = [];
const rafOrig = window.requestAnimationFrame.bind(window);
window.requestAnimationFrame = cb => paused ? (held.push(cb), 0) : rafOrig(cb);
function resume(){ paused = false; const q = held; held = []; q.forEach(cb => rafOrig(cb)); }

const st2 = document.createElement("style");
st2.textContent = `
.web-exit{background:#fff;color:#c0392b!important;border-color:#c0392b!important;font-weight:800!important}
.web-modal{position:fixed;inset:0;z-index:9998;background:rgba(39,50,92,.55);display:grid;place-items:center;padding:16px}
.web-modal .box{background:#fff;border:3px solid #27325c;border-radius:20px;box-shadow:0 6px 0 #27325c;max-width:330px;width:100%;padding:16px;text-align:center;font-family:'Be Vietnam Pro',system-ui,sans-serif;color:#27325c}
.web-modal img{width:96px;display:block;margin:-60px auto 0}
.web-modal h3{margin:6px 0 4px;font:800 21px 'Baloo 2','Be Vietnam Pro',sans-serif}
.web-modal p{margin:0 0 14px;font-size:14px;color:#5d6a8f}
.web-modal .row{display:flex;gap:10px}
.web-modal button{flex:1;font:800 17px 'Baloo 2','Be Vietnam Pro',sans-serif;border:3px solid #27325c;border-radius:14px;padding:9px;box-shadow:0 4px 0 #27325c;cursor:pointer}
.web-modal .go{background:#22b07d;color:#fff}.web-modal .quit{background:#fff;color:#c0392b}`;
document.head.appendChild(st2);

const mute = document.getElementById("mute");
if (mute) {
  const ex = document.createElement("button");
  ex.type = "button"; ex.className = mute.className + " web-exit"; ex.textContent = "✕ Thoát"; ex.hidden = true;
  mute.parentNode.insertBefore(ex, mute);
  const vis = id => { const e = document.getElementById(id); return e && !e.hidden; };
  const sync = () => { const h = vis("menu") || vis("over"); if (ex.hidden !== h) ex.hidden = h; };   // chỉ đổi khi khác, tránh vòng lặp vô hạn
  new MutationObserver(sync).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["hidden"] });
  sync();
  ex.addEventListener("click", e => {
    e.preventDefault(); e.stopPropagation(); if (paused) return;
    paused = true;
    const m = document.createElement("div"); m.className = "web-modal";
    m.innerHTML = `<div class="box">${CAT ? `<img src="../img/${CAT}.png" alt="">` : ""}<h3>Thoát lượt chơi này?</h3><p>Điểm của lượt này sẽ <b>không được tính</b> vào thành tích và kỷ lục.</p><div class="row"><button class="go" type="button">Chơi tiếp</button><button class="quit" type="button">Thoát</button></div></div>`;
    document.body.appendChild(m);
    m.querySelector(".go").onclick = () => { m.remove(); resume(); };
    m.querySelector(".quit").onclick = () => { location.reload(); };   // tải lại trang: về màn hình chọn bài, không lưu gì
  });
}

// ---- Link chia sẻ cho học sinh (?gt_session=…&gt_script=…): nhập tên → chơi → kết quả gửi về Google Sheet của giáo viên ----
// Dùng chung Apps Script với các trò "Tạo Link Chia Sẻ" khác của EduTeacher Hub (cột: Thời gian, Phiên, Tên, Trò chơi, Điểm, Thời gian chơi, Ghi chú).
(function shareMode(){
  const P = new URLSearchParams(location.search), SES = P.get("gt_session"), SCR = P.get("gt_script");
  if (!SES || !SCR) return;
  const GAME = P.get("gt_game") || document.title.replace(/\s*[–-].*$/, "");
  let name = ""; try { name = sessionStorage.getItem("tp_gt_name") || ""; } catch (_) {}
  let t0 = 0, right = 0, wrong = 0, fixed = 0, wrongQ = [], round = 0;
  const reset = () => { t0 = Date.now(); right = wrong = fixed = 0; wrongQ = []; };
  window.addEventListener("tp:answer", e => { const d = e.detail || {};
    if (d.loai === "dung") right++;
    else if (d.loai === "sai") { wrong++; if (d.q && !wrongQ.includes(d.q)) wrongQ.push(d.q); }
    else if (d.loai === "sua_dung") fixed++; });
  const st = document.createElement("style");
  st.textContent = `.gt-ov{position:fixed;inset:0;z-index:99999;background:rgba(39,50,92,.75);display:grid;place-items:center;padding:16px}
.gt-ov .box{background:#fff;border:3px solid #27325c;border-radius:22px;box-shadow:0 6px 0 #27325c;max-width:360px;width:100%;padding:20px 18px;text-align:center;font-family:'Be Vietnam Pro',system-ui,sans-serif;color:#27325c}
.gt-ov h3{margin:4px 0;font:800 22px 'Baloo 2','Be Vietnam Pro',sans-serif}.gt-ov p{margin:0 0 12px;font-size:14px;color:#5d6a8f}
.gt-ov input{width:100%;box-sizing:border-box;border:3px solid #27325c;border-radius:14px;padding:11px;font:700 17px 'Be Vietnam Pro',sans-serif;text-align:center;color:#27325c}
.gt-ov button{margin-top:12px;width:100%;font:800 19px 'Baloo 2','Be Vietnam Pro',sans-serif;border:3px solid #27325c;border-radius:14px;padding:10px;box-shadow:0 4px 0 #27325c;background:#22b07d;color:#fff;cursor:pointer}
.gt-pill{position:fixed;left:50%;bottom:10px;transform:translateX(-50%);z-index:99998;background:#27325c;color:#fff;font:700 13px 'Be Vietnam Pro',sans-serif;padding:6px 14px;border-radius:999px;box-shadow:0 3px 10px rgba(0,0,0,.25);max-width:94vw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}`;
  document.head.appendChild(st);
  const pill = document.createElement("div"); pill.className = "gt-pill"; pill.setAttribute("data-no-mf", "");
  const say = t => { pill.textContent = t; if (!pill.isConnected) document.body.appendChild(pill); };
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function askName(){
    const ov = document.createElement("div"); ov.className = "gt-ov";
    ov.innerHTML = `<div class="box">${CAT ? `<img src="../img/${CAT}.png" alt="" style="width:90px;margin:-58px auto 0;display:block">` : ""}<h3>${esc(GAME)}</h3>
      <p data-no-mf>Lớp / phiên: <b>${esc(SES)}</b><br>Nhập họ tên để bắt đầu – kết quả sẽ gửi cho thầy/cô.</p>
      <input type="text" maxlength="60" placeholder="Họ và tên của em" autocomplete="name" value="${esc(name)}"><button type="button">Bắt đầu ▶</button></div>`;
    document.body.appendChild(ov);
    const inp = ov.querySelector("input"), go = () => { const v = inp.value.trim().replace(/\s+/g, " ");
      if (v.length < 2) { inp.focus(); inp.style.borderColor = "#c0392b"; return; }
      name = v; try { sessionStorage.setItem("tp_gt_name", v); } catch (_) {}
      ov.remove(); say(`👤 ${name} · kết quả sẽ gửi cho thầy/cô (${SES})`); reset(); };
    ov.querySelector("button").onclick = go; inp.addEventListener("keydown", e => { if (e.key === "Enter") go(); });
    setTimeout(() => inp.focus(), 50);
  }
  function send(){
    if (!name) return;
    round++;
    const over = document.getElementById("over"), sc = document.getElementById("oScore");
    const scoreTxt = (sc ? sc.textContent : (over ? over.textContent : "")).trim();
    const num = (scoreTxt.match(/-?\d+(?:[.,]\d+)?/) || ["0"])[0].replace(",", ".");
    let bai = []; try { bai = JSON.parse(localStorage.getItem("tp_chon_bai") || "[]"); } catch (_) {}
    const parts = [];
    if (bai.length) parts.push("Bài: " + bai.map(b => b >= 1000 && window.JOURNEY && window.JOURNEY.lessonName ? window.JOURNEY.lessonName(b).replace(/^📝\s*/, "") : b === 0 ? "Câu GV" : "B" + b).join(", "));
    if (right + wrong) parts.push(`Đúng ${right}/${right + wrong} câu` + (fixed ? ` (sửa lại đúng ${fixed})` : ""));
    if (wrongQ.length) parts.push("Câu sai: " + wrongQ.slice(0, 6).map(q => q.length > 70 ? q.slice(0, 68) + "…" : q).join(" | ") + (wrongQ.length > 6 ? ` (+${wrongQ.length - 6} câu)` : ""));
    if (!sc && scoreTxt) parts.push(scoreTxt.slice(0, 80));
    if (round > 1) parts.push("Lượt " + round);
    const data = { session: SES, student: name, game: GAME, score: Number(num) || 0,
      time_seconds: t0 ? Math.round((Date.now() - t0) / 1000) : 0, timestamp: new Date().toLocaleString("vi-VN"), detail: parts.join(" · ").slice(0, 1200) };
    say("⏳ Đang gửi kết quả cho thầy/cô…");
    try {
      const u = new URL(SCR); u.searchParams.set("edu_data", JSON.stringify(data));
      fetch(u.toString(), { mode: "no-cors" }).then(() => say(`✅ Đã gửi kết quả lượt ${round} (${data.score} điểm) cho thầy/cô`)).catch(() => say("⚠️ Mất mạng – chưa gửi được kết quả. Em chụp màn hình gửi thầy/cô nhé!"));
    } catch (_) { say("⚠️ Link chia sẻ bị lỗi – báo thầy/cô tạo link mới"); }
  }
  // Theo dõi màn hình: menu ẩn = bắt đầu chơi, bảng "over" hiện = kết thúc lượt
  const vis = id => { const e = document.getElementById(id); return !!e && !e.hidden; };
  let wasOver = vis("over"), wasMenu = vis("menu");
  new MutationObserver(() => {
    const o = vis("over"), m = vis("menu");
    if (o && !wasOver) send();
    if ((!o && wasOver && !m) || (!m && wasMenu)) reset();
    wasOver = o; wasMenu = m;
  }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["hidden"] });
  askName();
})();

// ---- Bản offline: không cần đăng nhập ----
window.PLAYER = { uid: "local", hoTen: "", lop: "", khoi: 6, role: "hs" };
try { await initJourney(window.PLAYER); } catch (e) { console.warn("[journey]", e); }

