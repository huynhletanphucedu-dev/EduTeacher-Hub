// TẠO TỰ ĐỘNG từ tp-gate.js + tp-journey.js + bai-tap.js (tools/tao_bank_classic.py) – không sửa tay.
// Cần nạp trước (defer, đúng thứ tự): math-fmt-classic.js, bank-classic.js
(function(){
const BANK_T6 = window.BANK_T6 || {}, SUBJECTS = window.SUBJECTS || [];
const applyLessons = (function(){
// Nội dung câu hỏi theo BÀI học sinh chọn (chế độ tự chọn trò + tự chọn bài).
//  - Trò dùng câu trắc nghiệm: chỉ lấy câu của ngân hàng theo các bài đã chọn.
//  - Trò "phân loại" (Hứng Trứng, Đập Chuột, Chém, Phi Thuyền, Câu Cá, Đàn Vịt): luật riêng cho từng bài.
//    Bài chưa có luật riêng → dùng luật chung của chương như trước.
const G = name => { try { return eval(name); } catch (_) { return undefined; } };
const run = code => { try { eval(code); return true; } catch (e) { console.warn("[bai-tap]", code, e); return false; } };
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const fm = n => (n < 0 ? "−" + (-n) : "" + n);
const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹", sup = n => String(n).split("").map(d => SUP[+d]).join("");
const isPrime = n => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
const ROMAN = n => [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]].reduce((s, [v, r]) => { while (n >= v) { s += r; n -= v; } return s; }, "");
const half = () => Math.random() < .5;

// Mỗi luật: { name, gen() → { t, ok, why } }. Tạo mới mỗi lần mở trò (số ngẫu nhiên).
function lessonRules(bai){
  switch (bai) {
    case 1: {
      const a = ri(2, 5), b = a + ri(4, 6), c = ri(4, 7), W = ["N", "H", "A", "T", "R", "G"], O = ["B", "C", "E", "I", "K", "L", "M", "O", "S", "U"];
      return [
        { name: `số thuộc A = {x ∈ ℕ | ${a} < x < ${b}}`, gen: () => { const n = half() ? ri(a + 1, b - 1) : pick([ri(Math.max(0, a - 3), a), ri(b, b + 3)]); return { t: String(n), ok: n > a && n < b, why: n <= a ? `${n} không lớn hơn ${a}` : `${n} không nhỏ hơn ${b}` }; } },
        { name: `số thuộc B = {x ∈ ℕ* | x ≤ ${c}}`, gen: () => { const n = Math.random() < .3 ? 0 : ri(1, c + 4); return { t: String(n), ok: n >= 1 && n <= c, why: n === 0 ? "0 không thuộc ℕ*" : `${n} lớn hơn ${c}` }; } },
        { name: "chữ cái trong từ “NHA TRANG”", gen: () => { const ok = Math.random() < .55, ch = ok ? pick(W) : pick(O); return { t: ch, ok, why: `Từ “NHA TRANG” không có chữ ${ch}` }; } },
      ];
    }
    case 2: {
      const k = pick([12, 15, 20]), d = pick([2, 3, 4, 6, 8]);
      const four = (pos, dig, hit) => { for (;;) { const ds = [ri(1, 9), ri(0, 9), ri(0, 9), ri(0, 9)]; if (hit) ds[3 - pos] = dig; else if (ds[3 - pos] === dig) continue; return +ds.join(""); } };
      return [
        { name: `số La Mã nhỏ hơn ${k}`, gen: () => { const n = half() ? ri(1, k - 1) : ri(k, 30); return { t: ROMAN(n), ok: n < k, why: `${ROMAN(n)} = ${n}, không nhỏ hơn ${k}` }; } },
        { name: `số có chữ số hàng trăm là ${d}`, gen: () => { const hit = half(), n = four(2, d, hit); return { t: String(n), ok: hit, why: `${n} có chữ số hàng trăm là ${String(n)[1]}` }; } },
        { name: "số có chữ số 7 mang giá trị 700", gen: () => { const n = four(half() ? 2 : pick([0, 1, 3]), 7, true), p = [3, 2, 1, 0].find(i => String(n)[3 - i] === "7"); return { t: String(n), ok: String(n)[1] === "7", why: `Trong ${n}, chữ số 7 có giá trị ${7 * 10 ** p}` }; } },
      ];
    }
    case 3: {
      const K = ri(3, 8) * 1000 + pick([0, 500]);
      return [
        { name: `số lớn hơn ${K}`, gen: () => { const n = K + (half() ? ri(1, 900) : -ri(1, 900)) * pick([1, 1, 2]); return { t: String(n), ok: n > K, why: `${n} < ${K}` }; } },
        { name: "số chẵn", gen: () => { const n = ri(10, 199); return { t: String(n), ok: n % 2 === 0, why: `${n} là số lẻ` }; } },
      ];
    }
    case 4: case 5: case 7: {
      const N = bai === 7 ? pick([20, 24, 30, 36]) : bai === 5 ? pick([24, 36, 48, 60]) : pick([50, 75, 100]);
      const mk = ok => {
        for (let g = 0; g < 50; g++) {
          let t, v;
          if (bai === 4) { const a = ri(10, N + 40), b = ri(5, 60); if (half()) { t = `${a} + ${b}`; v = a + b; } else { t = `${a} − ${b}`; v = a - b; } }
          else if (bai === 5) { const a = ri(2, 12), b = ri(2, 12); if (half()) { t = `${a} · ${b}`; v = a * b; } else { const p = a * b; t = `${p} : ${a}`; v = b; } }
          else { const a = ri(1, 12), b = ri(2, 6), c = ri(2, 6); if (half()) { t = `${a} + ${b} · ${c}`; v = a + b * c; } else { t = `(${a} + ${b}) · ${c}`; v = (a + b) * c; } }
          if (v < 0) continue;
          if (ok && v !== N) continue; if (!ok && v === N) continue;
          return { t, ok: v === N, why: `${t} = ${v}` };
        }
        return { t: bai === 5 ? `${N / 2} · 2` : `${N - 1} + 1`, ok: true, why: "" };
      };
      return [{ name: `phép tính có kết quả bằng ${N}`, gen: () => mk(Math.random() < .45) }];
    }
    case 6: {
      const T = pick([[16, ["2" + sup(4), "4" + sup(2)], ["2" + sup(3), "3" + sup(2), "4" + sup(3), "8" + sup(2), "16" + sup(2)]],
                      [64, ["2" + sup(6), "4" + sup(3), "8" + sup(2)], ["2" + sup(5), "6" + sup(4), "4" + sup(4), "3" + sup(4)]],
                      [81, ["3" + sup(4), "9" + sup(2)], ["3" + sup(3), "9" + sup(3), "8" + sup(1), "4" + sup(3)]]]);
      const val = s => { const m = s.match(/^(\d+)(.+)$/); return Number(m[1]) ** Number([...m[2]].map(c => SUP.indexOf(c)).join("")); };
      return [{ name: `lũy thừa có giá trị bằng ${T[0]}`, gen: () => { const ok = Math.random() < .45, t = ok ? pick(T[1]) : pick(T[2]); return { t, ok, why: `${t} = ${val(t)}` }; } }];
    }
    case 8: return ["ước của 24", "bội của 4"];
    case 9: return ["số chia hết cho 2", "số chia hết cho 3", "số chia hết cho 5", "số chia hết cho 9", "số chia hết cho cả 2 và 5", "số chia hết cho cả 2 và 3"];
    case 10: {
      const N = pick([30, 42, 60, 70, 66]), pf = [2, 3, 5, 7, 11].filter(p => N % p === 0);
      return ["số nguyên tố", "hợp số", { name: `ước nguyên tố của ${N}`, gen: () => {
        const n = half() ? pick(pf) : pick([1, 4, 6, 9, 10, 13, 15, 17, 21, 14, 7, 5, 3, 11].filter(x => !pf.includes(x)));
        return { t: String(n), ok: pf.includes(n), why: n === 1 ? "1 không phải số nguyên tố" : !isPrime(n) ? `${n} là hợp số` : `${N} không chia hết cho ${n}` }; } }];
    }
    case 11: {
      const [a, b] = pick([[12, 18], [24, 36], [20, 30], [16, 24]]);
      return [{ name: `ước chung của ${a} và ${b}`, gen: () => {
        const n = half() ? pick([1, 2, 3, 4, 5, 6, 8, 9, 10, 12].filter(x => a % x === 0 && b % x === 0)) : ri(2, 18);
        const ok = a % n === 0 && b % n === 0; return { t: String(n), ok, why: a % n ? `${a} không chia hết cho ${n}` : `${b} không chia hết cho ${n}` }; } }];
    }
    case 12: {
      const [a, b] = pick([[4, 6], [3, 4], [6, 8], [6, 9]]);
      return [{ name: `bội chung của ${a} và ${b}`, gen: () => {
        const L = a * b / ((x, y) => { while (y) [x, y] = [y, x % y]; return x; })(a, b);
        const n = half() ? L * ri(1, 4) : ri(1, 15) * pick([a, b]); const ok = n % a === 0 && n % b === 0;
        return { t: String(n), ok, why: n % a ? `${n} không chia hết cho ${a}` : `${n} không chia hết cho ${b}` }; } }];
    }
    case 13: return ["số nguyên âm", "số lớn hơn −3"];
    case 23: return ["phân số bằng 1/2"];
    case 24: return ["phân số lớn hơn 1"];
    case 28: case 29: return ["số lớn hơn 2,5"];
  }
  return [];
}

// Danh sách luật cho các bài đã chọn, ở dạng { key, name, gen }
function rulesFor(lessons){
  const RULES = G("RULES") || [], out = [], seen = new Set();
  for (const b of lessons) for (const r of lessonRules(b)) {
    const R = typeof r === "string" ? RULES.find(x => x.name === r) : r;
    if (!R || seen.has(R.name)) continue; seen.add(R.name);
    out.push({ key: "r:" + R.name, name: R.name, rule: R.name, gen: R.gen });
  }
  return out;
}

function hideBlock(id){
  const el = document.getElementById(id); if (!el) return;
  el.hidden = true; const l = el.previousElementSibling; if (l && l.classList.contains("lbl")) l.hidden = true;
}

let origRule = null, origMc = null, origAll = null, cssDone = false;
// Gọi mỗi lần học sinh đổi bài (sau khi ngân hàng đã nạp lại)
function applyLessons(game, lessons){
  const L = [...lessons].sort((a, b) => a - b);
  if (typeof window.ruleTasks === "function") {
    origRule = origRule || window.ruleTasks;
    const rs = rulesFor(L);
    window.ruleTasks = () => rs.length ? rs : origRule();
  }
  if (typeof window.mcTasks === "function") {
    origMc = origMc || window.mcTasks;
    window.mcTasks = () => { const all = origMc(), b = all.filter(t => t.key === "m:bank"); return b.length ? b : all; };
  }
  if (game === "hung-trung") {
    origAll = origAll || window.allTasks;
    const rs = rulesFor(L);
    window.allTasks = () => rs.length ? rs.map(r => ({ key: r.name, name: r.name, gen: r.gen })) : origAll();
    if (!cssDone) { cssDone = true; const st = document.createElement("style"); st.textContent = `.task{white-space:normal!important;max-width:calc(100% - 20px);text-wrap:balance;font-size:15px!important}`; document.head.appendChild(st); }
  }
  if (game === "qua-cau") window.allTasks = () => [{ key: "asc", name: "Xếp số tăng dần" }, { key: "desc", name: "Xếp số giảm dần" }];
  if (game === "ghep-so") { run(`modeI = 0; store.set("mode", 0); renderModes();`); hideBlock("modes"); }
  // Dạng bài: để "Tất cả (lần lượt)" theo nội dung các bài đã chọn, ẩn ô chọn dạng bài
  run(`dangSel = new Set(); store.set(dangKey(), []); renderDangs();`);
  hideBlock("dangs");
  for (const qn of ["queue", "mcQueue"]) { const a = G(qn); if (Array.isArray(a)) a.length = 0; }
}

return applyLessons;
})();
const initJourney = (function(){
// EduTeacher Hub – bản OFFLINE của "journey" (dự án Tiên phong AI).
// Không cần đăng nhập, không dùng Firebase: mọi dữ liệu nằm trên máy.
//  1) Chọn 1 hoặc nhiều BÀI (Toán 6 – KNTT) → câu hỏi lấy từ ngân hàng bank-toan6.js.
//     Thêm mục "Câu hỏi của thầy/cô" (soạn ở trang soan-cau-hoi.html).
//  2) Chọn sai ở bảng câu hỏi: Mèo nhắc đúng chỗ hiểu nhầm, cho chọn lại 1 lần.
//  3) Thống kê câu sai lưu trên máy (localStorage "tp_stats") để giáo viên xem lại.
// Chương (gói trong game) → các bài KNTT
const CHUONG = { 1: [1, 7], 2: [8, 12], 3: [13, 17], 4: [18, 22], 6: [23, 27], 7: [28, 31], 8: [32, 43] };
const GAME = location.pathname.split("/").pop().replace(/\.html$/, "");
const CAT = document.querySelector('script[data-cat]')?.dataset.cat || "";
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

async function initJourney(p){
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

return initJourney;
})();
(async function(){
// EduTeacher Hub – gắn vào mỗi trò chơi Tiên phong AI (bản offline, không cần tài khoản):
//  - Nút "Về EduTeacher Hub", mèo linh vật, nút Thoát lượt
//  - Chọn bài Toán 6 KNTT + câu hỏi tự soạn của giáo viên

const CAT = document.querySelector('script[data-cat]')?.dataset.cat || "";
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


})();
})();
