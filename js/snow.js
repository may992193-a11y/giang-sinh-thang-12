// Tuyết rơi trên canvas, 4 mức độ; chạm màn hình tạo chùm tuyết rồi tan dần.
GS.snow = (function () {
  var LEVELS = { light: 60, medium: 140, heavy: 300, off: 0 };
  var canvas, ctx, w, h, flakes = [], bursts = [], level = 'medium';

  function makeFlake(randomY) {
    return {
      x: Math.random() * w,
      y: randomY ? Math.random() * h : -10,
      r: 1 + Math.random() * 3,
      vy: 0.5 + Math.random() * 1.5,
      phase: Math.random() * Math.PI * 2
    };
  }

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function setLevel(name) {
    if (!(name in LEVELS)) return;
    level = name;
    var target = LEVELS[name];
    while (flakes.length < target) flakes.push(makeFlake(true));
    flakes.length = target;
    GS.storage.set('snow', name);
    document.querySelectorAll('[data-snow]').forEach(function (b) {
      b.classList.toggle('active', b.dataset.snow === name);
    });
  }

  function burst(x, y) {
    for (var i = 0; i < 24; i++) {
      var a = Math.random() * Math.PI * 2, s = 1 + Math.random() * 3;
      bursts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: 1.5 + Math.random() * 2.5, life: 1 });
    }
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#fff';
    for (var i = 0; i < flakes.length; i++) {
      var f = flakes[i];
      f.phase += 0.02;
      f.y += f.vy;
      f.x += Math.sin(f.phase) * 0.6;
      if (f.y > h + 5) flakes[i] = makeFlake(false);
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (var j = bursts.length - 1; j >= 0; j--) {
      var b = bursts[j];
      b.x += b.vx; b.y += b.vy; b.vy += 0.05; b.vx *= 0.97;
      b.life -= 0.015;
      if (b.life <= 0) { bursts.splice(j, 1); continue; }
      ctx.globalAlpha = b.life;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(tick);
  }

  function init() {
    canvas = document.getElementById('snow');
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    setLevel(GS.storage.get('snow', 'medium'));
    document.querySelectorAll('[data-snow]').forEach(function (b) {
      b.addEventListener('click', function () { setLevel(b.dataset.snow); });
    });
    document.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button, input, textarea, label, dialog, .santa-art')) return;
      burst(e.clientX, e.clientY);
    });
    tick();
  }

  return { init: init, setLevel: setLevel };
})();
