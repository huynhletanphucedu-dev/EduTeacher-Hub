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

// ---- Bản offline: không cần đăng nhập ----
window.PLAYER = { uid: "local", hoTen: "", lop: "", khoi: 6, role: "hs" };
try { await initJourney(window.PLAYER); } catch (e) { console.warn("[journey]", e); }

