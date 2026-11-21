// Tuyết rơi trên canvas, 4 mức độ; chạm màn hình tạo chùm tuyết rồi tan dần.
// Cũng vẽ các hiệu ứng bất ngờ khi ông già Noel trao lời chúc: pháo hoa, mưa quà, tên trên bầu trời, cây thông bừng sáng.
GS.snow = (function () {
  var LEVELS = { light: 60, medium: 140, heavy: 300, off: 0 };
  var COLORS = ['#ff4d4d', '#4dff88', '#ffd54a', '#4dc3ff', '#ff7ad9'];
  var canvas, ctx, w, h, flakes = [], bursts = [], level = 'medium';
  var fx = null;

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

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

  // ---------- Hiệu ứng bất ngờ ----------
  function startFireworks() {
    return { type: 'fireworks', rockets: [], parts: [], launched: 0, total: 9, next: 0 };
  }

  // Nổ thành hình ngôi sao 5 cánh: hạt bay theo các điểm trên viền ngôi sao.
  function explode(f, x, y, color) {
    var R = rand(3, 4.2), rot = Math.random() * Math.PI * 2, verts = [];
    for (var i = 0; i < 10; i++) {
      var a = rot + i * Math.PI / 5, r = i % 2 ? 0.42 : 1;
      verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    for (var k = 0; k < 10; k++) {
      var p = verts[k], q = verts[(k + 1) % 10];
      for (var t = 0; t < 1; t += 1 / 7) {
        f.parts.push({
          x: x, y: y,
          vx: (p[0] + (q[0] - p[0]) * t) * R,
          vy: (p[1] + (q[1] - p[1]) * t) * R,
          life: 1, decay: rand(0.010, 0.014), color: color
        });
      }
    }
  }

  function drawFireworks(f, now) {
    if (f.launched < f.total && now >= f.next) {
      f.rockets.push({ x: w * rand(0.15, 0.85), y: h, vy: -rand(h * 0.011, h * 0.015), ty: h * rand(0.12, 0.4), color: pick(COLORS) });
      f.launched++;
      f.next = now + 380;
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var i = f.rockets.length - 1; i >= 0; i--) {
      var r = f.rockets[i];
      r.y += r.vy; r.vy *= 0.99;
      ctx.fillStyle = r.color;
      ctx.beginPath(); ctx.arc(r.x, r.y, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.4;
      ctx.fillRect(r.x - 1, r.y, 2, 18);
      ctx.globalAlpha = 1;
      if (r.y <= r.ty) { explode(f, r.x, r.y, r.color); f.rockets.splice(i, 1); }
    }
    for (var j = f.parts.length - 1; j >= 0; j--) {
      var p = f.parts[j];
      p.x += p.vx; p.y += p.vy; p.vy += 0.03; p.vx *= 0.985; p.vy *= 0.985;
      p.life -= p.decay;
      if (p.life <= 0) { f.parts.splice(j, 1); continue; }
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    return f.launched === f.total && !f.rockets.length && !f.parts.length;
  }

  function startRain(onGold) {
    var gifts = [];
    for (var i = 0; i < 40; i++) {
      gifts.push({
        x: rand(20, w - 20), y: -rand(30, h * 0.9), vy: rand(1.6, 3.4), s: rand(24, 36),
        sway: Math.random() * 6.28, gold: i < 7, color: pick(['#d62f2f', '#1f8a4c', '#1565c0', '#8e24aa'])
      });
    }
    return { type: 'rain', gifts: gifts, onGold: onGold, until: performance.now() + 11000 };
  }

  function drawGift(g) {
    var s = g.s, x = g.x + Math.sin(g.sway) * 8;
    ctx.save();
    ctx.translate(x, g.y);
    if (g.gold) { ctx.shadowColor = '#ffd54a'; ctx.shadowBlur = 18; }
    ctx.fillStyle = g.gold ? '#ffcc33' : g.color;
    ctx.fillRect(-s / 2, -s / 2, s, s);
    ctx.shadowBlur = 0;
    ctx.fillStyle = g.gold ? '#d62f2f' : '#ffd54a';
    ctx.fillRect(-s * 0.08, -s / 2, s * 0.16, s);
    ctx.fillRect(-s / 2, -s * 0.08, s, s * 0.16);
    ctx.beginPath();
    ctx.ellipse(-s * 0.16, -s / 2 - 4, s * 0.16, s * 0.1, -0.5, 0, Math.PI * 2);
    ctx.ellipse(s * 0.16, -s / 2 - 4, s * 0.16, s * 0.1, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawRain(f, now) {
    for (var i = f.gifts.length - 1; i >= 0; i--) {
      var g = f.gifts[i];
      g.y += g.vy; g.sway += 0.04;
      if (g.y > h + g.s) { f.gifts.splice(i, 1); continue; }
      drawGift(g);
    }
    return !f.gifts.length || now > f.until;
  }

  function hitGift(x, y) {
    if (!fx || fx.type !== 'rain') return false;
    for (var i = fx.gifts.length - 1; i >= 0; i--) {
      var g = fx.gifts[i], gx = g.x + Math.sin(g.sway) * 8;
      if (Math.abs(x - gx) < g.s / 2 + 8 && Math.abs(y - g.y) < g.s / 2 + 8) {
        fx.gifts.splice(i, 1);
        burst(x, y);
        if (g.gold && fx.onGold) fx.onGold();
        return true;
      }
    }
    return false;
  }

  // Tuyết và ánh sao bay lại xếp thành tên người nhận: lấy điểm ảnh của chữ vẽ trên canvas phụ.
  function startName(text) {
    var off = document.createElement('canvas');
    off.width = w; off.height = h;
    var o = off.getContext('2d');
    var size = Math.min(h * 0.2, (w * 0.9) / Math.max(2, text.length * 0.6));
    o.font = 'bold ' + size + 'px "Segoe UI", system-ui, sans-serif';
    o.textAlign = 'center';
    o.textBaseline = 'middle';
    o.fillText(text, w / 2, h * 0.3);
    var data = o.getImageData(0, 0, w, h).data;
    var step = Math.max(3, Math.floor(size / 30)), pts = [];
    for (var y = 0; y < h; y += step) {
      for (var x = 0; x < w; x += step) {
        if (data[(y * w + x) * 4 + 3] > 128) pts.push([x, y]);
      }
    }
    while (pts.length > 2400) pts.splice(Math.floor(Math.random() * pts.length), 1);
    return {
      type: 'name', start: performance.now(),
      parts: pts.map(function (p, i) {
        return { x: Math.random() * w, y: Math.random() * h, tx: p[0], ty: p[1], vx: 0, vy: 0, gold: i % 3 === 0 };
      })
    };
  }

  function drawName(f, now) {
    var t = now - f.start, scatter = t > 4600;
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < f.parts.length; i++) {
      var p = f.parts[i], alpha;
      if (!scatter) {
        p.x += (p.tx - p.x) * 0.09;
        p.y += (p.ty - p.y) * 0.09;
        alpha = t < 2000 ? 0.9 : 0.6 + 0.4 * Math.sin(now / 140 + i);
      } else {
        if (!p.vx) { var a = Math.random() * 6.28, s = rand(1, 4); p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s; }
        p.x += p.vx; p.y += p.vy; p.vy += 0.02;
        alpha = Math.max(0, 1 - (t - 4600) / 1800);
      }
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.gold ? '#ffd54a' : '#ffffff';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.gold ? 2.2 : 1.8, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    return t > 6400;
  }

  // Cây thông lớn lên, đèn đổi màu theo nhịp Jingle Bells (phần chuyển động nằm trong CSS).
  function startTree() {
    var startedMusic = !GS.music.isPlaying();
    if (startedMusic) GS.music.setPlaying(true);
    document.body.classList.add('tree-show');
    return {
      type: 'tree', until: performance.now() + 7500,
      cleanup: function () {
        document.body.classList.remove('tree-show');
        if (startedMusic) GS.music.setPlaying(false);
      }
    };
  }

  // name: 'fireworks' | 'rain' | 'name' | 'tree' | 'random'
  function effect(name, opts, onDone) {
    stopFx();
    if (name === 'random') name = pick(['fireworks', 'rain', 'name', 'tree']);
    if (name === 'fireworks') fx = startFireworks();
    else if (name === 'rain') fx = startRain(opts.onGold);
    else if (name === 'name') fx = startName(opts.text || '');
    else fx = startTree();
    fx.onDone = onDone;
    document.body.classList.add('fx-on');
    return name;
  }

  function stopFx() {
    if (!fx) return;
    if (fx.cleanup) fx.cleanup();
    fx = null;
    document.body.classList.remove('fx-on');
  }

  function drawFx(now) {
    var done;
    if (fx.type === 'fireworks') done = drawFireworks(fx, now);
    else if (fx.type === 'rain') done = drawRain(fx, now);
    else if (fx.type === 'name') done = drawName(fx, now);
    else done = now > fx.until;
    if (done) {
      var cb = fx.onDone;
      stopFx();
      if (cb) cb();
    }
  }

  function tick(now) {
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
    if (fx) drawFx(now || performance.now());
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
      if (hitGift(e.clientX, e.clientY)) return;
      if (e.target.closest('button, input, textarea, label, dialog, .santa-art')) return;
      burst(e.clientX, e.clientY);
    });
    requestAnimationFrame(tick);
  }

  return { init: init, setLevel: setLevel, effect: effect, stopFx: stopFx };
})();
