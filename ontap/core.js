// EduTeacher Hub – lõi dùng chung cho bộ trò chơi ôn tập cả lớp (chạy offline, dữ liệu trên máy)
//  • Nguồn câu hỏi: Ngân hàng Toán 6 (685 câu), câu hỏi game của thầy/cô (tp_custom_q), hoặc dán nhanh.
//  • Đội chơi: tự đặt tên, hoặc lấy từ kết quả Chia nhóm gần nhất.
//  • Bảng câu hỏi to cho máy chiếu, hẹn giờ, âm thanh, bảng điểm, bục vinh quang.
// Cần nạp trước: ../tienphong/js/bank-classic.js và ../tienphong/js/math-fmt-classic.js (script thường → chạy được cả khi mở file trực tiếp)
(function () {
const BANK_T6 = window.BANK_T6 || {}, SUBJECTS = window.SUBJECTS || [];

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const wait = ms => new Promise(r => setTimeout(r, ms));
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
};
const COLORS = ["#e11d48", "#2563eb", "#d97706", "#16a34a", "#7c3aed", "#0891b2"];
const L4 = ["A", "B", "C", "D"];
const OPTC = ["var(--A)", "var(--B)", "var(--C)", "var(--D)"];

/* ───────── âm thanh (tự tạo, không cần file) ───────── */
let AC = null, SOUND = store.get("ot_sound", true);
function tone(f, d = .15, type = "sine", v = .15, slide = 0, delay = 0) {
  if (!SOUND) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + delay;
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d + .02);
  } catch (e) { }
}
const SFX = {
  click: () => tone(660, .06, "square", .06),
  ok: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, .22, "triangle", .16, 0, i * .09)),
  bad: () => { tone(220, .25, "sawtooth", .12, 140); tone(150, .35, "sawtooth", .1, 90, .2); },
  tick: () => tone(1200, .03, "square", .05),
  win: () => [523, 659, 784, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .3, "triangle", .16, 0, i * .14)),
  pop: () => tone(500, .12, "sine", .15, 900),
  drum: () => { for (let i = 0; i < 14; i++) tone(90 + i * 6, .06, "triangle", .2, 0, i * .09); }
};

/* ───────── thanh công cụ nổi ───────── */
function tools(extra = "") {
  const d = document.createElement("div"); d.className = "ot-tools";
  d.innerHTML = `${extra}<button id="otSnd" title="Âm thanh">${SOUND ? "🔊" : "🔇"}</button><button id="otFs" title="Toàn màn hình">⛶</button><a href="../dashboard.html" title="Về EduTeacher Hub">🏠 <span class="l">Hub</span></a>`;
  document.body.appendChild(d);
  $("#otSnd").onclick = () => { SOUND = !SOUND; store.set("ot_sound", SOUND); $("#otSnd").textContent = SOUND ? "🔊" : "🔇"; };
  $("#otFs").onclick = () => { if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => { }); else document.exitFullscreen(); };
  const f = document.createElement("div"); f.className = "ot-foot"; f.innerHTML = "📚 EduTeacher Hub – ThS. Huỳnh Lê Tấn Phúc"; document.body.appendChild(f);
  return d;
}

/* ───────── câu hỏi ───────── */
const LESSONS = (SUBJECTS[0]?.bai || []).filter(b => (BANK_T6[b.bai] || []).length);
function norm(x) { // {q,a,w[],g} → {q, opts[4], ans, g}
  const w = (x.w || []).filter(Boolean).slice(0, 3);
  const opts = shuffle([x.a, ...w]);
  return { q: x.q, opts, ans: opts.indexOf(x.a), g: x.g || "" };
}
function parseOwn(txt) {
  return txt.split(/\r?\n/).map(l => l.split(/\s*[|\t]\s*/).map(s => s.trim())).filter(p => p.length >= 3 && p[0] && p[1])
    .map(p => ({ q: p[0], a: p[1], w: p.slice(2, 5) }));
}
function getQuestions(cfg) {
  let raw = [];
  if (cfg.src === "bank") (cfg.lessons.length ? cfg.lessons : LESSONS.map(b => b.bai)).forEach(b => raw.push(...(BANK_T6[b] || [])));
  else if (cfg.src === "custom") {
    if (window.QB) { const L = QB.lessons(cfg.cusMon || null).map(b => b.id), pick = (cfg.cusLessons || []).filter(id => L.includes(id)); raw = QB.questions(pick.length ? pick : L); }
    else raw = (store.get("tp_custom_q", []) || []).filter(x => x && x.q && x.a);
  }
  else raw = parseOwn(cfg.own || "");
  raw = shuffle(raw);
  const n = cfg.count > 0 ? cfg.count : raw.length;
  const out = []; for (let i = 0; i < n && raw.length; i++) out.push(norm(raw[i % raw.length]));
  return out;
}

/* ───────── đội: lấy từ Chia nhóm gần nhất ───────── */
function lastGroups() {
  let best = null;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i); if (!k.startsWith("cnhom_last_")) continue;
      const v = store.get(k, null); if (v && v.groups && v.groups.length >= 2 && (!best || (v.date || "") > (best.date || ""))) best = v;
    }
  } catch (e) { }
  return best;
}

/* ───────── màn hình thiết lập ─────────
   o = {id, icon, title, desc, teams:{min,max,def}|null, count:{def,opts}, timer:true, extra:html, bg} → Promise<cfg>  */
function setup(o) {
  const K = "ot_cfg_" + o.id;
  const cfg = Object.assign({ src: "bank", lessons: [], count: o.count?.def ?? 10, own: "", timer: 0, nTeams: o.teams?.def || 0, teamNames: [], members: [] }, store.get(K, {}));
  if (o.fixedCount) cfg.count = o.fixedCount;
  if (o.teams) cfg.nTeams = Math.max(o.teams.min, Math.min(o.teams.max, cfg.nTeams || o.teams.def));
  cfg.lessons = (cfg.lessons || []).filter(b => LESSONS.some(x => x.bai === b));
  return new Promise(res => {
    const w = document.createElement("div"); w.className = "ot-setup"; if (o.bg) w.style.background = o.bg;
    const counts = o.count?.opts || [5, 10, 15, 20];
    w.innerHTML = `<div class="ot-card">
      <div class="ot-head"><div class="ic">${o.icon}</div><div><h1>${esc(o.title)}</h1><p>${o.desc}</p></div></div>
      <div class="ot-sec"><h3>📚 Câu hỏi</h3>
        <div class="ot-row"><select class="ot-sel" id="otSrc">
          <option value="bank">Ngân hàng Toán 6 – KNTT (${LESSONS.reduce((s, b) => s + BANK_T6[b.bai].length, 0)} câu)</option>
          <option value="custom">📝 Ngân hàng câu hỏi của thầy/cô (${window.QB ? QB.load().cau.length : (store.get("tp_custom_q", []) || []).length} câu)</option>
          <option value="own">Dán nhanh câu hỏi</option></select>
          ${o.count === null ? "" : `<span style="font-weight:700;font-size:.9rem">Số câu</span><div class="ot-seg" id="otCnt">${counts.map(c => `<button data-v="${c}">${c}</button>`).join("")}</div>`}</div>
        <div id="otBankBox" style="margin-top:8px"><div class="ot-chips" id="otLes"></div><div class="ot-hint">Bấm chọn một hoặc nhiều bài (không chọn = trộn tất cả các bài).</div></div>
        <div id="otOwnBox" hidden style="margin-top:8px"><textarea class="ot-ta" id="otOwn" placeholder="Mỗi dòng 1 câu:  Câu hỏi | Đáp án đúng | Sai 1 | Sai 2 | Sai 3&#10;VD:  2³ bằng bao nhiêu? | 8 | 6 | 9 | 5"></textarea>
          <div class="ot-hint">Dán từ Excel cũng được (mỗi cột 1 ô). Đáp án sẽ được trộn ngẫu nhiên khi chơi.</div></div>
        <div id="otCusBox" hidden style="margin-top:8px"><div class="ot-row"><span style="font-weight:700;font-size:.9rem">Môn</span><select class="ot-sel" id="otCusMon"></select></div><div class="ot-chips" id="otCusLes" style="margin-top:8px"></div><div class="ot-hint">Bấm chọn một hoặc nhiều bài (không chọn = trộn cả môn). Soạn câu hỏi ở trang <a href="../tienphong/soan-cau-hoi.html" target="_blank">Quản lý câu hỏi trò chơi</a>.</div></div>
      </div>
      ${o.teams ? `<div class="ot-sec"><h3>👥 Đội chơi</h3><div class="ot-row"><div class="ot-seg" id="otNT">${Array.from({ length: o.teams.max - o.teams.min + 1 }, (_, i) => `<button data-v="${i + o.teams.min}">${i + o.teams.min} đội</button>`).join("")}</div>
        <button class="ot-btn" id="otFromG" hidden>🧩 Lấy đội từ Chia nhóm gần nhất</button></div><div class="ot-teams" id="otTeams"></div><div class="ot-hint" id="otTH"></div></div>` : ""}
      ${o.timer !== false ? `<div class="ot-sec"><h3>⏱️ Hẹn giờ mỗi câu</h3><div class="ot-seg" id="otTm">${[0, 15, 30, 45, 60].map(t => `<button data-v="${t}">${t ? t + " giây" : "Không"}</button>`).join("")}</div></div>` : ""}
      ${o.extra || ""}
      <button class="ot-go" id="otGo">▶ BẮT ĐẦU CHƠI</button>
    </div>`;
    document.body.appendChild(w);
    const seg = (id, key, cb) => { const el = $("#" + id, w); if (!el) return; const upd = () => $$("button", el).forEach(b => b.classList.toggle("on", +b.dataset.v === +cfg[key])); el.onclick = e => { const b = e.target.closest("button"); if (!b) return; cfg[key] = +b.dataset.v; upd(); SFX.click(); cb && cb(); }; upd(); };
    seg("otCnt", "count"); seg("otTm", "timer");
    const les = $("#otLes", w);
    les.innerHTML = LESSONS.map(b => `<button class="ot-chip${cfg.lessons.includes(b.bai) ? " on" : ""}" data-b="${b.bai}" title="${esc(b.ten)}">B${b.bai} · ${esc(b.ten.replace(/^Bài\s*\d+\.\s*/, "").slice(0, 34))}</button>`).join("");
    les.onclick = e => { const c = e.target.closest(".ot-chip"); if (!c) return; const b = +c.dataset.b; cfg.lessons = cfg.lessons.includes(b) ? cfg.lessons.filter(x => x !== b) : [...cfg.lessons, b]; c.classList.toggle("on"); };
    const src = $("#otSrc", w); src.value = cfg.src;
    const updSrc = () => { cfg.src = src.value; $("#otBankBox", w).hidden = cfg.src !== "bank"; $("#otOwnBox", w).hidden = cfg.src !== "own"; $("#otCusBox", w).hidden = cfg.src !== "custom"; };
    src.onchange = updSrc; updSrc(); $("#otOwn", w).value = cfg.own || "";
    if (window.QB) {   // môn + bài từ ngân hàng câu hỏi của giáo viên
      const ms = $("#otCusMon", w), subs = QB.subjects().filter(m => m.soCau);
      if (!subs.some(m => m.id === cfg.cusMon)) cfg.cusMon = subs[0] ? subs[0].id : "";
      ms.innerHTML = subs.length ? subs.map(m => `<option value="${m.id}"${m.id === cfg.cusMon ? " selected" : ""}>${esc(m.ten)} (${m.soCau} câu)</option>`).join("") : '<option value="">(Chưa có câu hỏi nào)</option>';
      const drawCus = () => { const L = QB.lessons(cfg.cusMon).filter(b => b.soCau); cfg.cusLessons = (cfg.cusLessons || []).filter(id => L.some(b => b.id === id));
        $("#otCusLes", w).innerHTML = L.map(b => `<button class="ot-chip${cfg.cusLessons.includes(b.id) ? " on" : ""}" data-b="${b.id}">${b.khoi ? "K" + esc(b.khoi) + " · " : ""}${esc(b.ten.slice(0, 40))} (${b.soCau})</button>`).join("") || '<span class="ot-hint">Môn này chưa có bài nào có câu hỏi.</span>'; };
      ms.onchange = () => { cfg.cusMon = ms.value; cfg.cusLessons = []; drawCus(); };
      $("#otCusLes", w).onclick = e => { const c = e.target.closest(".ot-chip"); if (!c) return; const id = c.dataset.b; cfg.cusLessons = cfg.cusLessons.includes(id) ? cfg.cusLessons.filter(x => x !== id) : [...cfg.cusLessons, id]; c.classList.toggle("on"); };
      drawCus();
    }
    if (o.teams) {
      const G = lastGroups();
      const drawTeams = () => {
        const n = cfg.nTeams; $("#otTeams", w).innerHTML = Array.from({ length: n }, (_, i) => `<label class="ot-team" style="--c:${COLORS[i]}"><i></i><input data-i="${i}" value="${esc(cfg.teamNames[i] || "Đội " + (i + 1))}" maxlength="24"></label>`).join("");
        $$("#otTeams input", w).forEach(inp => inp.oninput = () => { cfg.teamNames[+inp.dataset.i] = inp.value; });
        $("#otTH", w).textContent = cfg.members.length === n ? "✓ Đã lấy thành viên từ Chia nhóm – điểm sẽ hiện kèm tên nhóm trưởng." : "";
      };
      seg("otNT", "nTeams", () => { cfg.members = []; drawTeams(); }); drawTeams();
      const fb = $("#otFromG", w);
      if (G) {
        fb.hidden = false; fb.title = "Chia nhóm ngày " + (G.date || "");
        fb.onclick = () => {
          const k = Math.min(o.teams.max, G.groups.length); cfg.nTeams = k;
          cfg.teamNames = G.groups.slice(0, k).map((g, i) => { const ld = g.leader && G.names && G.names[g.leader]; return "Nhóm " + (i + 1) + (ld ? " – " + String(ld).trim().split(/\s+/).pop() : ""); });
          cfg.members = G.groups.slice(0, k).map(g => g.members); $$("#otNT button", w).forEach(b => b.classList.toggle("on", +b.dataset.v === k)); drawTeams(); SFX.pop();
          if (G.groups.length > o.teams.max) $("#otTH", w).textContent = `Chia nhóm có ${G.groups.length} nhóm – trò này chơi tối đa ${o.teams.max} đội nên lấy ${o.teams.max} nhóm đầu.`;
        };
      }
    }
    o.onSetup && o.onSetup(w, cfg);
    $("#otGo", w).onclick = () => {
      cfg.own = $("#otOwn", w).value;
      const qs = getQuestions(cfg);
      if (!qs.length) { alert(cfg.src === "own" ? "Chưa có câu hỏi nào. Mỗi dòng: Câu hỏi | Đáp án đúng | Sai 1 | Sai 2 | Sai 3" : "Nguồn này chưa có câu hỏi."); return; }
      store.set(K, cfg);
      const teams = o.teams ? Array.from({ length: cfg.nTeams }, (_, i) => ({ name: (cfg.teamNames[i] || "").trim() || "Đội " + (i + 1), color: COLORS[i], score: 0, i })) : [];
      w.remove(); SFX.pop();
      try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); AC.resume?.(); } catch (e) { }
      res({ cfg, questions: qs, teams });
    };
  });
}

/* ───────── bảng câu hỏi ─────────
   ask(q, {title, team, timer, lifelines, confirm}) → Promise<{choice, ok}>
   askAll(q, {title, teams, timer}) → Promise<[đội trả lời đúng]>  (cả lớp cùng trả lời, GV đánh dấu đội đúng) */
function qHTML(q, title, team, timer) {
  return `<div class="ot-qbox"><div class="ot-qtop">${title ? `<span class="ot-badge" style="--c:#0f172a">${title}</span>` : ""}${team ? `<span class="ot-badge" style="--c:${team.color}">👉 ${esc(team.name)}</span>` : ""}<span class="sp"></span>${timer ? `<span class="ot-timer" id="otT">${timer}</span>` : ""}</div>
    ${timer ? `<div class="ot-tbar"><i id="otTB" style="width:100%"></i></div>` : ""}
    <div class="ot-qt">${esc(q.q)}</div>
    <div class="ot-opts">${q.opts.map((t, i) => `<button class="ot-opt" data-i="${i}" style="--c:${OPTC[i]}"><b>${L4[i]}</b><span>${esc(t)}</span></button>`).join("")}</div>
    <div id="otRes"></div><div class="ot-acts" id="otActs"></div></div>`;
}
function runTimer(ov, sec, onEnd) {
  if (!sec) return () => { };
  let left = sec; const T = $("#otT", ov), B = $("#otTB", ov);
  requestAnimationFrame(() => { B.style.width = "0%"; B.style.transition = `width ${sec}s linear`; });
  const iv = setInterval(() => { left--; T.textContent = left; if (left <= 5) { T.classList.add("low"); SFX.tick(); } if (left <= 0) { clearInterval(iv); onEnd(); } }, 1000);
  return () => { clearInterval(iv); const w = getComputedStyle(B).width; B.style.transition = "none"; B.style.width = w; };
}
function reveal(ov, q, choice) {
  $$(".ot-opt", ov).forEach((b, i) => { b.disabled = true; if (i === q.ans) b.classList.add("ok"); else if (i === choice) b.classList.add("no"); else b.classList.add("dim"); });
  const ok = choice === q.ans;
  $("#otRes", ov).innerHTML = `<div class="ot-res ${ok ? "ok" : "no"}"><span class="big">${ok ? "🎉" : choice == null ? "⏰" : "😢"}</span><span>${ok ? "Chính xác!" : (choice == null ? "Hết giờ! " : "Chưa đúng. ") + "Đáp án đúng: <b>" + L4[q.ans] + ". " + esc(q.opts[q.ans]) + "</b>"}</span>${q.g ? `<span class="g">💡 ${esc(q.g)}</span>` : ""}</div>`;
  ok ? SFX.ok() : SFX.bad();
  return ok;
}
function ask(q, o = {}) {
  return new Promise(res => {
    const ov = document.createElement("div"); ov.className = "ot-q"; ov.innerHTML = qHTML(q, o.title, o.team, o.timer); document.body.appendChild(ov);
    let done = false, sel = null;
    const finish = async choice => {
      if (done) return; done = true; stop();
      if (o.suspense && choice != null) { SFX.drum(); await wait(1500); }
      const ok = reveal(ov, q, choice);
      const acts = $("#otActs", ov); acts.innerHTML = `<button class="ot-next">${o.nextText || "Tiếp tục ▶"}</button>`;
      const go = () => { ov.remove(); document.removeEventListener("keydown", kd); res({ choice, ok }); };
      $(".ot-next", acts).onclick = go; $(".ot-next", acts).focus();
    };
    const stop = runTimer(ov, o.timer, () => finish(null));
    $$(".ot-opt", ov).forEach(b => b.onclick = () => {
      const i = +b.dataset.i; if (done) return;
      if (o.confirm) { // Ai là triệu phú: chọn rồi xác nhận "đáp án cuối cùng"
        sel = i; $$(".ot-opt", ov).forEach(x => x.classList.toggle("sel", x === b)); SFX.click();
        $("#otActs", ov).innerHTML = `<button class="ot-next" style="background:#f59e0b;color:#111">🔒 Đáp án cuối cùng: ${L4[i]}</button>`;
        $("#otActs .ot-next", ov).onclick = () => finish(sel);
      } else finish(i);
    });
    const kd = e => { if (done) return; const i = L4.indexOf(e.key.toUpperCase()); if (i >= 0 && i < 4) { const b = $$(".ot-opt", ov)[i]; if (b && !b.classList.contains("gone")) b.click(); } };
    document.addEventListener("keydown", kd);
    if (o.lifelines) o.lifelines(ov, q);
  });
}
function askAll(q, o = {}) {
  return new Promise(res => {
    const ov = document.createElement("div"); ov.className = "ot-q"; ov.innerHTML = qHTML(q, o.title, null, o.timer); document.body.appendChild(ov);
    $$(".ot-opt", ov).forEach(b => b.style.cursor = "default");
    let shown = false; const picked = new Set();
    const show = () => {
      if (shown) return; shown = true; stop();
      $$(".ot-opt", ov).forEach((b, i) => { b.disabled = true; b.classList.add(i === q.ans ? "ok" : "dim"); }); SFX.ok();
      $("#otRes", ov).innerHTML = `<div class="ot-res ok"><span class="big">✅</span><span>Đáp án đúng: <b>${L4[q.ans]}. ${esc(q.opts[q.ans])}</b></span>${q.g ? `<span class="g">💡 ${esc(q.g)}</span>` : ""}</div>
        <div style="font-weight:800;margin-top:12px">Bấm chọn các đội trả lời ĐÚNG:</div><div class="ot-teamsel">${o.teams.map((t, i) => `<button data-i="${i}" style="--c:${t.color}">${esc(t.name)}</button>`).join("")}</div>`;
      $$(".ot-teamsel button", ov).forEach(b => b.onclick = () => { const i = +b.dataset.i; picked.has(i) ? picked.delete(i) : picked.add(i); b.classList.toggle("on"); SFX.click(); });
      $("#otActs", ov).innerHTML = `<button class="ot-next">${o.nextText || "Xong ▶"}</button>`;
      $("#otActs .ot-next", ov).onclick = () => { ov.remove(); res([...picked]); };
    };
    $("#otActs", ov).innerHTML = `<span class="ot-hint" style="margin-right:auto;align-self:center">Các đội ghi đáp án ra bảng con/giấy (hoặc giơ Thẻ Hiệp Sĩ)…</span><button class="ot-next" style="background:#16a34a">👁 Hiện đáp án</button>`;
    $("#otActs .ot-next", ov).onclick = show;
    const stop = runTimer(ov, o.timer, show);
  });
}

/* ───────── bảng điểm ───────── */
function board(teams) {
  let el = $(".ot-board"); if (!el) { el = document.createElement("div"); el.className = "ot-board"; document.body.appendChild(el); }
  const draw = (turn = -1, bump = -1) => {
    el.innerHTML = teams.map((t, i) => `<div class="ot-sc${i === turn ? " turn" : ""}${i === bump ? " bump" : ""}" style="--c:${t.color}"><i>${i + 1}</i><span class="n" title="${esc(t.name)}">${esc(t.name)}</span><span class="p">${t.score}</span></div>`).join("");
  };
  draw(); return { draw, el };
}
function toast(html, color = "#0f172a") { const d = document.createElement("div"); d.className = "ot-toast"; d.style.color = color; d.innerHTML = html; document.body.appendChild(d); setTimeout(() => d.remove(), 1900); }
function confetti(n = 120) {
  const C = ["#f43f5e", "#f59e0b", "#10b981", "#3b82f6", "#a855f7", "#fde047"];
  for (let i = 0; i < n; i++) { const c = document.createElement("i"); c.className = "ot-conf"; c.style.left = Math.random() * 100 + "vw"; c.style.background = C[i % 6]; c.style.animationDuration = rnd(1.8, 3.6) + "s"; c.style.animationDelay = rnd(0, .6) + "s"; document.body.appendChild(c); setTimeout(() => c.remove(), 4400); }
}
/* bục vinh quang: teams đã có score; unit = "điểm" */
function podium(teams, o = {}) {
  const order = teams.slice().sort((a, b) => b.score - a.score);
  const top = order.slice(0, 3), arr = top.length === 3 ? [top[1], top[0], top[2]] : top.length === 2 ? [top[1], top[0]] : top;
  const H = { 0: 200, 1: 140, 2: 100 }, M = ["🥇", "🥈", "🥉"];
  const d = document.createElement("div"); d.className = "ot-end";
  d.innerHTML = `<div class="ot-endbox"><h2>${o.title || "🏆 Kết quả chung cuộc"}</h2><div style="opacity:.8">${o.sub || ""}</div>
    <div class="ot-pod">${arr.map(t => { const r = order.indexOf(t); return `<div class="ot-pd"><div class="m">${M[r]}</div><div class="nm">${esc(t.name)}</div><div class="bx" style="--c:${t.color};height:${H[r]}px;animation-delay:${(2 - r) * .25}s">${t.score}</div></div>`; }).join("")}</div>
    ${order.length > 3 ? `<div style="opacity:.85;margin-bottom:14px">${order.slice(3).map((t, i) => `${i + 4}. ${esc(t.name)} – ${t.score}`).join(" · ")}</div>` : ""}
    <div class="ot-btns"><button id="otAgain" style="background:#f59e0b">🔁 Chơi lại</button><button id="otHome" style="background:#fff">🏠 Về Hub</button></div></div>`;
  document.body.appendChild(d); SFX.win(); confetti();
  $("#otAgain", d).onclick = () => location.reload();
  $("#otHome", d).onclick = () => location.href = "../dashboard.html";
  return d;
}
/* tên học sinh (để "gọi bạn trợ giúp", chọn người chơi) */
function classNames() {
  const cn = (store.get("cn_students", []) || []).map(x => (x.hoTen || "").trim()).filter(Boolean);
  if (cn.length) return cn;
  const sd = store.get("etv1_sodiem_v2", { books: [] }) || { books: [] };
  for (const b of sd.books || []) { const n = ((b.hk1 && b.hk1.students) || []).map(s => (s.ten || "").trim()).filter(Boolean); if (n.length) return n; }
  return [];
}

window.OT = { $, $$, esc, wait, rnd, pick, shuffle, store, COLORS, L4, tone, SFX, tools, getQuestions, setup, ask, askAll, board, toast, confetti, podium, classNames };
})();
