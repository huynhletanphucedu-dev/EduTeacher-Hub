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
export function applyLessons(game, lessons){
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
