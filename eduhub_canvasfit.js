/* eduhub_canvasfit.js – cho <canvas> co giãn theo khung chứa mà nét vẫn sắc trên màn hình mật độ cao.
   Mã vẽ cũ vẫn dùng hệ tọa độ "logic" ban đầu (giá trị width/height ghi trong thẻ canvas).
   Dùng:  EHFit(canvas, { redraw: hàmVẽLại, maxWidth: 700 })
          EHFit.point(canvas, event) → {x, y} theo tọa độ logic (dùng cho chuột / chạm). */
(function () {
  function EHFit(cv, opt) {
    if (!cv || cv._ehfit) return cv && cv._ehfit;
    opt = opt || {};
    var W = cv.width, H = cv.height, ctx = cv.getContext('2d'), k = 1;
    var st = ctx.setTransform.bind(ctx);
    // Mọi lệnh đặt lại phép biến đổi đều được nhân thêm hệ số k để giữ hệ tọa độ logic
    ctx.setTransform = function (a, b, c, d, e, f) {
      if (a && typeof a === 'object') { var m = a; return st(m.a * k, m.b * k, m.c * k, m.d * k, m.e * k, m.f * k); }
      if (a === undefined) return st(k, 0, 0, k, 0, 0);
      return st(a * k, b * k, c * k, d * k, e * k, f * k);
    };
    ctx.resetTransform = function () { st(k, 0, 0, k, 0, 0); };
    cv.style.width = '100%';
    cv.style.maxWidth = (opt.maxWidth || W) + 'px';
    cv.style.height = 'auto';
    cv.style.aspectRatio = W + ' / ' + H;
    function apply() {
      var cw = cv.getBoundingClientRect().width || W;
      var nk = Math.min(4, Math.max(1, cw * (window.devicePixelRatio || 1) / W));
      if (Math.abs(nk - k) < 0.02 && cv.width === Math.round(W * k)) return;
      k = nk;
      cv.width = Math.round(W * k); cv.height = Math.round(H * k);   // đổi kích thước sẽ xóa trạng thái ctx
      st(k, 0, 0, k, 0, 0);
      if (opt.redraw) { try { opt.redraw(); } catch (e) { } }
    }
    var info = { W: W, H: H, apply: apply, get k() { return k; } };
    cv._ehfit = info;
    if (window.ResizeObserver) new ResizeObserver(apply).observe(cv);
    else window.addEventListener('resize', apply);
    apply();
    return info;
  }
  EHFit.point = function (cv, e) {
    var r = cv.getBoundingClientRect(), t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
    var W = cv._ehfit ? cv._ehfit.W : cv.width, H = cv._ehfit ? cv._ehfit.H : cv.height;
    return { x: (t.clientX - r.left) * W / r.width, y: (t.clientY - r.top) * H / r.height };
  };
  window.EHFit = EHFit;
})();
