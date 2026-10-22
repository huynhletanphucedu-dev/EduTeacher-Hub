// EduTeacher Hub – bản OFFLINE của "journey" (dự án Tiên phong AI).
// Không cần đăng nhập, không dùng Firebase: mọi dữ liệu nằm trên máy.
//  1) Chọn 1 hoặc nhiều BÀI (Toán 6 – KNTT) → câu hỏi lấy từ ngân hàng bank-toan6.js.
//     Thêm mục "Câu hỏi của thầy/cô" (soạn ở trang soan-cau-hoi.html).
//  2) Chọn sai ở bảng câu hỏi: Mèo nhắc đúng chỗ hiểu nhầm, cho chọn lại 1 lần.
//  3) Thống kê câu sai lưu trên máy (localStorage "tp_stats") để giáo viên xem lại.
import { BANK_T6 } from "./bank-toan6.js";
import { SUBJECTS } from "./lessons.js";
import { applyLessons } from "./bai-tap.js";
// Chương (gói trong game) → các bài KNTT
const CHUONG = { 1: [1, 7], 2: [8, 12], 3: [13, 17], 4: [18, 22], 6: [23, 27], 7: [28, 31], 8: [32, 43] };
const GAME = location.pathname.split("/").pop().replace(/\.html$/, "");
const CAT = document.querySelector('script[src$="tp-gate.js"]')?.dataset.cat || "";
// Câu hỏi tự soạn của giáo viên → "bài 0"
const CUSTOM_ID = "gv-tuson";
function customItems(){
  try { return (JSON.parse(localStorage.getItem("tp_custom_q") || "[]") || []).filter(x => x && x.q && x.a && Array.isArray(x.w) && x.w.length); }
  catch (_) { return []; }
}
BANK_T6[0] = customItems();
const byQ = new Map();          // nội dung câu hỏi → mục trong ngân hàng
let player = null;
const chuongOf = bai => bai === 0 ? "gv" : Number(Object.entries(CHUONG).find(([, [a, b]]) => bai >= a && bai <= b)?.[0]);

const has = name => { try { return typeof eval(name) !== "undefined"; } catch (_) { return false; } };
const G = name => { try { return eval(name); } catch (_) { return undefined; } };

// ---------- 1) Ngân hàng câu hỏi theo bài đã mở ----------
function lessonsOpen(list){
  try { if (list) localStorage.setItem("moBai_toan6", JSON.stringify(list)); else list = JSON.parse(localStorage.getItem("moBai_toan6") || "null"); } catch (_) {}
  return new Set((list || []).map(Number));
}
function applyBank(open){
  if (!has("BANK") || !has("PACKS")) return;
  const BANK = G("BANK"), PACKS = G("PACKS");
  for (const [c, [a, b]] of Object.entries(CHUONG)) {
    const id = "toan6-c" + c, pk = PACKS.find(p => p.id === id);
    const items = [];
    for (let bai = a; bai <= b; bai++) if (open.has(bai)) (BANK_T6[bai] || []).forEach(it => { it.b = bai; items.push(it); });
    for (let i = BANK.length - 1; i >= 0; i--) if (BANK[i][0] === id) BANK.splice(i, 1);
    items.forEach(it => { BANK.push([id, it.q, it.a, it.w, it.g]); byQ.set(it.q, it); });
    if (pk) { pk.q = items.map(it => [it.q, it.a, it.w, it.g]); pk.open = items.length > 0; }
  }
  // Gói câu hỏi tự soạn của giáo viên
  let ck = PACKS.find(p => p.id === CUSTOM_ID);
  const cItems = open.has(0) ? (BANK_T6[0] || []) : [];
  if (!ck && cItems.length) { ck = { id: CUSTOM_ID, grade: 6, subject: "toan", order: 0, title: "Câu hỏi của thầy/cô", short: "Câu hỏi GV", open: true, topic: "tn", q: [], words: [] }; PACKS.unshift(ck); }
  for (let i = BANK.length - 1; i >= 0; i--) if (BANK[i][0] === CUSTOM_ID) BANK.splice(i, 1);
  cItems.forEach(it => { it.b = 0; BANK.push([CUSTOM_ID, it.q, it.a, it.w, it.g || ""]); byQ.set(it.q, it); });
  if (ck) { ck.q = cItems.map(it => [it.q, it.a, it.w, it.g || ""]); ck.open = cItems.length > 0; }
  try { if (has("TOPICS")) G("TOPICS")[CUSTOM_ID] = "Câu hỏi GV"; } catch (_) {}
  // Chỉ chọn gói (chương) chứa các bài em chọn, khóa Khối 6 – Toán
  try { eval('grade = 6; subject = "toan"'); } catch (_) {}
  const ids = new Set([...open].map(b => b === 0 ? CUSTOM_ID : "toan6-c" + chuongOf(b)));
  const ch = G("chosen"); if (ch instanceof Set) { ch.clear(); ids.forEach(id => ch.add(id)); }
  // Xóa hàng đợi câu hỏi cũ (nếu game đã xếp sẵn trước khi có ngân hàng mới)
  for (const qn of ["queue", "mcQueue"]) { const a = G(qn); if (Array.isArray(a)) a.length = 0; }
  // Làm mới menu chọn gói (số câu, gói khóa/mở)
  try {
    if (has("chosen") && has("defaultChosen")) {
      const ch = G("chosen"), ok = new Set(PACKS.filter(p => p.open && p.q.length).map(p => p.id));
      [...ch].forEach(id => { if (!ok.has(id)) ch.delete(id); });
    }
    if (has("renderPacks")) G("renderPacks")();
  } catch (e) { console.warn("[journey] renderPacks", e); }
}

// ---------- 3) Thống kê câu sai (lưu trên máy) ----------
function log(loai, it, chon){
  if (!it) return;
  try {
    const st = JSON.parse(localStorage.getItem("tp_stats") || "{}");
    const k = String(it.q).slice(0, 160), e = st[k] || { q: k, bai: it.b ?? null, dung: 0, sai: 0, sua: 0 };
    if (loai === "dung") e.dung++; else if (loai === "sai") e.sai++; else if (loai === "sua_dung") e.sua++;
    e.t = Date.now(); st[k] = e;
    const keys = Object.keys(st); if (keys.length > 800) keys.sort((x, y) => st[x].t - st[y].t).slice(0, keys.length - 800).forEach(x => delete st[x]);
    localStorage.setItem("tp_stats", JSON.stringify(st));
  } catch (_) {}
}

// ---------- 4) Chọn bài trong menu trò chơi ----------
const LESSONS = SUBJECTS[0].bai;
const shortL = b => { if (b === 0) return "📝 Câu hỏi của thầy/cô"; const L = LESSONS.find(x => x.bai === b); return L ? L.ten.replace(/^Bài (\d+)\.\s*/, "B$1 · ") : "Bài " + b; };
const PICK_KEY = "tp_chon_bai";
function loadPick(open){
  let p = [];
  try { p = JSON.parse(localStorage.getItem(PICK_KEY) || "[]"); } catch (_) {}
  p = p.map(Number).filter(b => open.includes(b));
  return p.length ? p : open.includes(0) ? [0] : open.filter(b => b >= 1 && b <= 7);
}
function lessonMenu(open){
  const g = document.getElementById("grades"); if (!g) return null;
  ["grades", "subjects", "topics"].forEach(id => {
    const el = document.getElementById(id); if (!el) return;
    el.hidden = true; const l = el.previousElementSibling; if (l && l.classList.contains("lbl")) l.hidden = true;
  });
  const b = document.createElement("div"); b.className = "hanh-trinh";
  b.innerHTML = `<b>📚 Chọn bài muốn ôn (Toán 6 – KNTT)</b><span class="ht-note"></span><div class="bai-list"></div>`;
  const h1 = g.closest(".card")?.querySelector("h1");
  if (h1 && h1.parentNode === g.parentNode) h1.after(b); else { const lbl = g.previousElementSibling; (lbl || g).parentNode.insertBefore(b, lbl || g); }
  return b;
}
function drawPick(box, open, pick, onChange){
  const list = box.querySelector(".bai-list"), note = box.querySelector(".ht-note");
  if (!open.length) { note.textContent = "Chưa có bài nào."; list.innerHTML = ""; return; }
  note.textContent = `Đang ôn ${pick.length} bài · ${BANK_COUNT(pick)} câu hỏi`;
  list.innerHTML = "";
  const mk = (txt, on, fn, cls = "") => { const x = document.createElement("button"); x.type = "button"; x.className = "bai-chip " + cls; x.textContent = txt; x.setAttribute("aria-pressed", on); x.onclick = fn; list.appendChild(x); };
  mk("Tất cả các bài", pick.length === open.length, () => onChange([...open]), "all");
  [...open].sort((a, b) => a === 0 ? -1 : b === 0 ? 1 : a - b).forEach(n => mk(shortL(n), pick.includes(n), () => {
    const s = new Set(pick); if (s.has(n)) { if (s.size > 1) s.delete(n); } else s.add(n); onChange([...s]);
  }));
}
const BANK_COUNT = pick => pick.reduce((a, b) => a + (BANK_T6[b] || []).length, 0);

// ---------- 2) Mèo nhắc khi chọn sai ở bảng câu hỏi ----------
const st = document.createElement("style");
st.textContent = `.meo-nhac{display:flex;gap:8px;align-items:flex-start;text-align:left}
.meo-nhac img{width:42px;height:auto;flex:none;margin-top:-2px}
.meo-nhac b{color:#c0661a}.meo-nhac i{display:block;margin-top:3px;color:#27325c;font-style:normal;font-weight:700}
.hoi-meo{margin-top:8px;font:800 14px 'Baloo 2','Be Vietnam Pro',sans-serif;background:#fff3e0;color:#c0661a;border:2px solid #c0661a;border-radius:12px;padding:5px 12px;cursor:pointer;box-shadow:0 3px 0 #c0661a}
.hoi-meo:disabled{opacity:.6;cursor:default}
.meo-tl{margin-top:8px;background:#fff;border:2px dashed #f0a050;border-radius:12px;padding:7px 10px;text-align:left;font-size:14px;line-height:1.45}
.meo-tl b{color:#c0661a}
.hanh-trinh{background:#fff8e1;border:2px solid #f0a050;border-radius:12px;padding:7px 10px;text-align:left;margin:4px 0}
.hanh-trinh b{display:block;font:800 15px 'Baloo 2','Be Vietnam Pro',sans-serif;color:#c0661a}.hanh-trinh span{font-size:13px;color:#5d6a8f}
.bai-list{display:flex;flex-wrap:wrap;gap:5px;margin-top:5px;max-height:132px;overflow-y:auto}
.bai-chip{font:600 12.5px 'Be Vietnam Pro',sans-serif;border:2px solid #e3d3b0;background:#fff;border-radius:10px;padding:4px 8px;cursor:pointer;color:#27325c;text-align:left}
.bai-chip[aria-pressed="true"]{border-color:#27325c;background:#ffcf3f;font-weight:700}
.bai-chip.all{background:#eef3fb}.bai-chip.all[aria-pressed="true"]{background:#ffcf3f}`;
document.head.appendChild(st);

function hookQuiz(){
  if (typeof window.answer !== "function") return;
  const orig = window.answer;
  let retried = null, firstCode = null;
  window.answer = function(choice, btn, ...rest){
    const Q = G("curQ"), it = Q && byQ.get(Q[1]);
    const ok = Q && choice === Q[2];
    const hint = it && it.h && choice != null && it.h[choice];
    if (Q && !ok && hint && retried !== Q) {
      // Lần sai đầu tiên: KHÔNG lộ đáp án, Mèo nhắc rồi cho chọn lại
      retried = Q; firstCode = hint[0];
      try { clearInterval(G("qTimer")); } catch (_) {}
      if (btn) { btn.classList.add("no"); btn.disabled = true; }
      const fb = document.getElementById("fb");
      if (fb) {
        fb.hidden = false; fb.className = "fb no";
        fb.innerHTML = `<div class="meo-nhac">${CAT ? `<img src="../img/${CAT}.png" alt="">` : ""}<div><b>Mèo nhắc:</b> <span></span><i>Em chọn lại nhé!</i></div></div>`;
        fb.querySelector("span").textContent = hint[1];
        addAskCat(fb, Q, it, choice, hint[1]);
      }
      log("sai", it, choice);
      return;
    }
    if (it) {
      if (retried === Q) log(ok ? "sua_dung" : "sua_sai", it, choice, firstCode);
      else if (!ok) log("sai", it, choice);
      else log("dung", it, choice);
    }
    return orig.call(this, choice, btn, ...rest);
  };
}

function addAskCat(){}

// Tất cả bài đều mở (bản offline). Giáo viên có thể ẩn bớt bằng localStorage "tp_mo_bai".
function lessonsOpenNow(){
  let list = null;
  try { list = JSON.parse(localStorage.getItem("tp_mo_bai") || "null"); } catch (_) {}
  const all = LESSONS.map(x => x.bai).filter(b => (BANK_T6[b] || []).length);
  const open = Array.isArray(list) && list.length ? all.filter(b => list.includes(b)) : all;
  if ((BANK_T6[0] || []).length) open.unshift(0);
  return open;
}

export async function initJourney(p){
  player = p;
  const open = lessonsOpenNow();
  let pick = loadPick(open);
  const box = lessonMenu(open);
  const set = list => {
    pick = list.length ? list : pick;
    try { localStorage.setItem(PICK_KEY, JSON.stringify(pick)); } catch (_) {}
    try { applyBank(new Set(pick)); } catch (e) { console.warn("[journey] applyBank", e); }
    try { applyLessons(GAME, pick); } catch (e) { console.warn("[journey] applyLessons", e); }
    if (box) drawPick(box, open, pick, set);
  };
  set(pick);
  hookQuiz();
  window.JOURNEY = { byQ, log, lessons: () => pick, version: 4 };
  return { blocked: false };
}
