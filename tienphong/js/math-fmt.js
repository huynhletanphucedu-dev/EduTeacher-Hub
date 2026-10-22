// Hiển thị kí hiệu Toán đúng chuẩn trên mọi trò chơi:
//  - Phân số "3/4" hiện thành phân số dọc (tử số trên, gạch ngang, mẫu số dưới) – cả chữ trên trang lẫn chữ vẽ trên canvas.
//  - Nội dung chữ (textContent) vẫn giữ nguyên "3/4" nên việc chấm đúng/sai của trò không bị ảnh hưởng.
// Chỉ cần import file này (game-gate.js, ban-do.js, loi-sai.js đã import).

// a/b với a, b là số hoặc một chữ cái; bỏ qua ngày tháng 15/10/2026, số thập phân, chữ dài như he/she
const FR = /(?<![\p{L}\p{N}\/,.])(\d+|[a-zA-Z])\/(\d+|[a-zA-Z])(?![\p{L}\p{N}\/])/u;
const FRG = new RegExp(FR.source, "gu");
// Bộ đếm như "Vòng 1/6", "Câu 3/10", "đúng 4/5 câu" không phải phân số → giữ nguyên
const CNT_BEFORE = /(?:lớp|vòng|câu|cầu|màn|lượt|tầng|từ|khách|đúng|được|ngày|cặp|ải|·)\s*$/iu;
const CNT_AFTER = /^\s*(?:câu|cầu|vòng|con|lần|sao|mảnh|cột|từ|cặp|ngày|tầng|khách)(?![\p{L}])/iu;
const isCounter = (s, i, len) => s.slice(i, i + len) === "50/50" || CNT_BEFORE.test(s.slice(Math.max(0, i - 12), i)) || CNT_AFTER.test(s.slice(i + len, i + len + 12));
const SKIP = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "SELECT", "OPTION", "NOSCRIPT", "CODE", "PRE", "TITLE"]);

// ---------- 1) Chữ trên trang (HTML) ----------
const CSS = `
.mf{display:inline-flex;flex-direction:column;align-items:stretch;vertical-align:middle;text-align:center;font-size:.86em;line-height:1.08;margin:0 .1em;white-space:nowrap}
.mf-n{border-bottom:max(1.5px,.09em) solid currentColor;padding:0 .14em .04em}
.mf-d{padding:.04em .14em 0}
.mf-s{display:block;height:0;overflow:hidden;font-size:0;line-height:0}`;

function fmtNode(t){
  const s = t.nodeValue;
  if (!s || s.indexOf("/") < 0 || !FR.test(s)) return;
  let any = false; s.replace(FRG, (m, n, d, i) => { if (!isCounter(s, i, m.length)) any = true; return m; });
  if (!any) return;
  const p = t.parentNode;
  if (p && p.nodeName === "TD" && /^\s*[6-9]\/\d{1,2}\s*$/.test(s)) return;   // ô "Lớp" trong bảng: 6/4 là tên lớp
  if (!p || SKIP.has(p.nodeName) || (p.closest && (p.closest(".mf,[contenteditable],svg,[data-no-mf]")))) return;
  const frag = document.createDocumentFragment();
  let last = 0;
  s.replace(FRG, (m, n, d, i) => {
    if (isCounter(s, i, m.length)) return m;
    if (i > last) frag.appendChild(document.createTextNode(s.slice(last, i)));
    const f = document.createElement("span"); f.className = "mf";
    f.setAttribute("aria-label", `${n} phần ${d}`);
    f.innerHTML = `<span class="mf-n"></span><span class="mf-s">/</span><span class="mf-d"></span>`;
    f.firstChild.textContent = n; f.lastChild.textContent = d;
    frag.appendChild(f); last = i + m.length; return m;
  });
  if (last < s.length) frag.appendChild(document.createTextNode(s.slice(last)));
  p.replaceChild(frag, t);
}
function walk(root){
  if (!root) return;
  if (root.nodeType === 3) return fmtNode(root);
  if (root.nodeType !== 1 && root.nodeType !== 11) return;
  if (root.nodeType === 1 && (SKIP.has(root.nodeName) || root.classList.contains("mf"))) return;
  const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), list = [];
  for (let n = it.nextNode(); n; n = it.nextNode()) if (n.nodeValue.indexOf("/") >= 0) list.push(n);
  list.forEach(fmtNode);
}
function startDom(){
  if (window.__mathFmt) return; window.__mathFmt = true;
  const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
  walk(document.body);
  new MutationObserver(ms => {
    for (const m of ms) {
      if (m.type === "characterData") fmtNode(m.target);
      else m.addedNodes.forEach(walk);
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
}

// ---------- 2) Chữ vẽ trên canvas (trứng, trái cây, chuột chũi, ô số…) ----------
function patchCanvas(){
  const P = CanvasRenderingContext2D.prototype;
  if (P.__mf) return; P.__mf = true;
  const fill = P.fillText, stroke = P.strokeText, measure = P.measureText;
  const sizeOf = ctx => { const m = /(\d+(?:\.\d+)?)px/.exec(ctx.font); return m ? +m[1] : 16; };
  const withSize = (font, px) => font.replace(/(\d+(?:\.\d+)?)px/, px + "px");
  function parts(text){
    const out = []; let last = 0;
    String(text).replace(FRG, (m, n, d, i) => { if (isCounter(text, i, m.length)) return m; if (i > last) out.push({ t: text.slice(last, i) }); out.push({ n, d }); last = i + m.length; return m; });
    if (last < text.length) out.push({ t: text.slice(last) });
    return out.some(g => g.n != null) ? out : null;
  }
  function layout(ctx, segs){
    const font = ctx.font, s = sizeOf(ctx), small = withSize(font, Math.round(s * .66 * 10) / 10);
    let W = 0;
    for (const g of segs) {
      if (g.t != null) { g.w = measure.call(ctx, g.t).width; }
      else { ctx.font = small; g.w = Math.max(measure.call(ctx, g.n).width, measure.call(ctx, g.d).width) + s * .2; ctx.font = font; }
      W += g.w;
    }
    return { W, s, font, small };
  }
  function draw(ctx, fn, text, x, y, isFill, r){
    const segs = parts(text);
    if (!segs) return fn.call(ctx, text, x, y, ...r);
    const L = layout(ctx, segs);
    const align = ctx.textAlign, base = ctx.textBaseline, s = L.s;
    let cx = align === "center" ? x - L.W / 2 : (align === "right" || align === "end") ? x - L.W : x;
    const yc = base === "middle" ? y : base === "top" || base === "hanging" ? y + s * .5 : base === "bottom" ? y - s * .55 : y - s * .34;
    ctx.save(); ctx.textBaseline = "middle";
    for (const g of segs) {
      if (g.t != null) { ctx.textAlign = "left"; fn.call(ctx, g.t, cx, yc); }
      else {
        ctx.font = L.small; ctx.textAlign = "center";
        const mid = cx + g.w / 2;
        fn.call(ctx, g.n, mid, yc - s * .42);
        fn.call(ctx, g.d, mid, yc + s * .44);
        const h = Math.max(1.4, s * .08);
        if (isFill) ctx.fillRect(cx + s * .06, yc - h / 2, g.w - s * .12, h);
        else ctx.strokeRect(cx + s * .06, yc - h / 2, g.w - s * .12, h);
        ctx.font = L.font;
      }
      cx += g.w;
    }
    ctx.restore();
  }
  P.fillText = function(text, x, y, ...r){
    if (typeof text === "string" && text.indexOf("/") >= 0 && FR.test(text)) return draw(this, fill, text, x, y, true, r);
    return fill.call(this, text, x, y, ...r);
  };
  P.strokeText = function(text, x, y, ...r){
    if (typeof text === "string" && text.indexOf("/") >= 0 && FR.test(text)) return draw(this, stroke, text, x, y, false, r);
    return stroke.call(this, text, x, y, ...r);
  };
  P.measureText = function(text){
    const m = measure.call(this, text);
    if (typeof text !== "string" || text.indexOf("/") < 0 || !FR.test(text)) return m;
    const segs = parts(text); if (!segs) return m;
    const L = layout(this, segs);
    return { width: L.W, actualBoundingBoxLeft: m.actualBoundingBoxLeft, actualBoundingBoxRight: L.W,
      actualBoundingBoxAscent: L.s * .95, actualBoundingBoxDescent: L.s * .95, fontBoundingBoxAscent: m.fontBoundingBoxAscent, fontBoundingBoxDescent: m.fontBoundingBoxDescent };
  };
}

try { patchCanvas(); } catch (e) { console.warn("[math-fmt] canvas", e); }
if (document.body) startDom(); else document.addEventListener("DOMContentLoaded", startDom);
export const hasFraction = s => FR.test(String(s));
