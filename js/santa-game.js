// Mini game Bắt quà cùng ông già Noel: 60 giây, 3 mạng, lưu điểm cao.
GS.game = (function () {
  var W = 360, H = 480, BAG_W = 70, BAG_Y = 420;
  var canvas, ctx, dialog, els = {};
  var state = null, raf = null, move = 0;

  function reset() {
    state = {
      running: true, score: 0, lives: 3, time: 60,
      bagX: W / 2, santaX: W / 2, santaDir: 1,
      items: [], spawn: 0, last: performance.now()
    };
    updateHud();
  }

  function updateHud() {
    els.time.textContent = Math.ceil(state.time);
    els.score.textContent = state.score;
    els.lives.textContent = '❤️'.repeat(state.lives) + '🖤'.repeat(3 - state.lives);
  }

  function spawnItem() {
    var r = Math.random();
    var kind = r < 0.22 ? 'coal' : r < 0.32 ? 'star' : 'gift';
    var speed = 120 + (60 - state.time) * 3 + Math.random() * 60;
    state.items.push({ kind: kind, x: state.santaX, y: 70, vy: speed });
  }

  function step(now) {
    var dt = Math.min(0.05, (now - state.last) / 1000);
    state.last = now;
    state.time -= dt;

    state.bagX = Math.max(BAG_W / 2, Math.min(W - BAG_W / 2, state.bagX + move * 320 * dt));

    state.santaX += state.santaDir * (90 + Math.random() * 40) * dt;
    if (state.santaX < 40 || state.santaX > W - 40 || Math.random() < 0.01) state.santaDir *= -1;
    state.santaX = Math.max(40, Math.min(W - 40, state.santaX));

    state.spawn -= dt;
    if (state.spawn <= 0) {
      spawnItem();
      state.spawn = Math.max(0.35, 0.9 - (60 - state.time) * 0.008);
    }

    for (var i = state.items.length - 1; i >= 0; i--) {
      var it = state.items[i];
      it.y += it.vy * dt;
      var caught = it.y > BAG_Y - 10 && it.y < BAG_Y + 20 && Math.abs(it.x - state.bagX) < BAG_W / 2 + 6;
      if (caught) {
        if (it.kind === 'coal') { state.lives--; GS.music.hohoho(); }
        else { state.score += it.kind === 'star' ? 3 : 1; GS.music.jingle(); }
        state.items.splice(i, 1);
      } else if (it.y > H + 20) {
        state.items.splice(i, 1);
      }
    }

    if (state.time <= 0 || state.lives <= 0) {
      state.time = Math.max(0, state.time);
      return finish();
    }
    updateHud();
    draw();
    raf = requestAnimationFrame(step);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // Tuyết nền
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    for (var s = 0; s < 30; s++) {
      var sx = (s * 97 + performance.now() / 40) % W, sy = (s * 53 + performance.now() / 25) % H;
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.fillStyle = '#f4f8fc';
    ctx.fillRect(0, H - 30, W, 30);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '40px serif';
    ctx.fillText('🎅', state.santaX, 40);
    ctx.font = '22px serif';
    ctx.fillText('🛷', state.santaX + 30, 52);

    state.items.forEach(function (it) {
      if (it.kind === 'coal') {
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(it.x, it.y, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.arc(it.x - 4, it.y - 4, 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.font = '28px serif';
        ctx.fillText(it.kind === 'star' ? '⭐' : '🎁', it.x, it.y);
      }
    });

    // Túi quà
    var x = state.bagX - BAG_W / 2;
    ctx.fillStyle = '#8d5a2b';
    ctx.beginPath();
    ctx.moveTo(x, BAG_Y);
    ctx.lineTo(x + BAG_W, BAG_Y);
    ctx.lineTo(x + BAG_W - 8, BAG_Y + 40);
    ctx.lineTo(x + 8, BAG_Y + 40);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d62f2f';
    ctx.fillRect(x - 3, BAG_Y - 6, BAG_W + 6, 8);
  }

  function finish() {
    state.running = false;
    cancelAnimationFrame(raf);
    updateHud();
    draw();
    var best = GS.storage.get('best', 0);
    var msg = 'Hết giờ! Bạn được ' + state.score + ' điểm.';
    if (state.lives <= 0) msg = 'Hết mạng rồi! Bạn được ' + state.score + ' điểm.';
    if (state.score > best) {
      GS.storage.set('best', state.score);
      els.best.textContent = state.score;
      msg += ' 🏆 Kỷ lục mới!';
    }
    els.msg.textContent = msg;
    els.start.textContent = 'Chơi lại';
  }

  function start() {
    cancelAnimationFrame(raf);
    reset();
    els.msg.textContent = '';
    els.start.textContent = 'Đang chơi...';
    raf = requestAnimationFrame(step);
  }

  function stop() {
    cancelAnimationFrame(raf);
    if (state) state.running = false;
    move = 0;
  }

  function holdButton(btn, dir) {
    btn.addEventListener('pointerdown', function (e) { e.preventDefault(); move = dir; });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) {
      btn.addEventListener(ev, function () { if (move === dir) move = 0; });
    });
  }

  function pointerToBag(e) {
    if (!state || !state.running) return;
    var r = canvas.getBoundingClientRect();
    state.bagX = (e.clientX - r.left) / r.width * W;
  }

  function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    dialog = document.getElementById('gameDialog');
    els = {
      time: document.getElementById('gTime'),
      score: document.getElementById('gScore'),
      lives: document.getElementById('gLives'),
      msg: document.getElementById('gMsg'),
      start: document.getElementById('gStart'),
      best: document.getElementById('bestScore')
    };
    els.best.textContent = GS.storage.get('best', 0);

    document.getElementById('btnGame').addEventListener('click', function () {
      reset();
      state.running = false;
      draw();
      els.msg.textContent = 'Bấm Bắt đầu để chơi!';
      els.start.textContent = 'Bắt đầu';
      dialog.showModal();
    });
    els.start.addEventListener('click', start);
    holdButton(document.getElementById('gLeft'), -1);
    holdButton(document.getElementById('gRight'), 1);

    canvas.addEventListener('pointerdown', function (e) { canvas.setPointerCapture(e.pointerId); pointerToBag(e); });
    canvas.addEventListener('pointermove', function (e) { if (e.buttons || e.pointerType === 'touch') pointerToBag(e); });

    document.addEventListener('keydown', function (e) {
      if (!dialog.open) return;
      if (e.key === 'ArrowLeft') move = -1;
      if (e.key === 'ArrowRight') move = 1;
    });
    document.addEventListener('keyup', function (e) {
      if ((e.key === 'ArrowLeft' && move === -1) || (e.key === 'ArrowRight' && move === 1)) move = 0;
    });
    dialog.addEventListener('close', stop);
  }

  return { init: init };
})();
