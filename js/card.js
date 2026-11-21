// Thiệp Giáng Sinh: 3 mẫu thiệp, xem trước, tải ảnh PNG, và cảnh người nhận mở phong bì nhận thiệp.
GS.card = (function () {
  var TEMPLATES = [
    { key: 'co-dien', name: 'Cổ điển' },
    { key: 'lang-tuyet', name: 'Làng tuyết' },
    { key: 'ong-gia-noel', name: 'Ông già Noel' }
  ];

  // Màu chữ của từng mẫu, dùng chung cho thiệp trên trang và ảnh PNG.
  var COLORS = {
    'co-dien': { title: '#b8860b', text: '#7a1f1f', name: '#b8860b', foot: '#ffe9a3' },
    'lang-tuyet': { title: '#ffd54a', text: '#f3f6ff', name: '#ffd54a', foot: '#2a4a80' },
    'ong-gia-noel': { title: '#ffd54a', text: '#ffffff', name: '#ffcf5a', foot: 'rgba(255,255,255,.7)' }
  };

  var MISTLETOE = '<svg viewBox="0 0 60 50" aria-hidden="true"><ellipse cx="18" cy="18" rx="16" ry="7" transform="rotate(-30 18 18)" fill="#2e7d32"/>' +
    '<ellipse cx="42" cy="18" rx="16" ry="7" transform="rotate(30 42 18)" fill="#43a047"/><ellipse cx="30" cy="12" rx="5" ry="12" fill="#388e3c"/>' +
    '<circle cx="25" cy="27" r="5" fill="#e53935"/><circle cx="35" cy="28" r="5" fill="#c62828"/><circle cx="30" cy="35" r="5" fill="#e53935"/></svg>';
  var VILLAGE = '<svg class="xc-village" viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden="true">' +
    '<path d="M0 60 Q100 30 200 55 T400 50 V100 H0Z" fill="#dfe9f5"/><path d="M0 80 Q150 60 300 78 T400 75 V100 H0Z" fill="#f4f8fc"/>' +
    '<rect x="40" y="48" width="56" height="34" fill="#7a3b2e"/><polygon points="34,50 68,26 102,50" fill="#fff"/><rect x="52" y="58" width="12" height="11" fill="#ffcf5a"/><rect x="74" y="58" width="12" height="11" fill="#ffcf5a"/>' +
    '<polygon points="200,12 182,50 218,50" fill="#1d6b3a"/><polygon points="200,30 176,72 224,72" fill="#145433"/><circle cx="193" cy="46" r="2.5" fill="#ff4d4d"/><circle cx="208" cy="60" r="2.5" fill="#ffd54a"/><circle cx="190" cy="64" r="2.5" fill="#4dc3ff"/>' +
    '<rect x="300" y="44" width="64" height="38" fill="#2f5d50"/><polygon points="294,46 332,20 370,46" fill="#fff"/><rect x="314" y="56" width="12" height="11" fill="#ffcf5a"/><rect x="340" y="56" width="12" height="11" fill="#ffcf5a"/></svg>';

  // Hình trang trí cố định của từng mẫu (không chứa chữ người dùng nhập).
  var DECO = {
    'co-dien': MISTLETOE.replace('<svg', '<svg class="xc-mistle tl"') + MISTLETOE.replace('<svg', '<svg class="xc-mistle br"'),
    'lang-tuyet': '<span class="xc-moon"></span>' + VILLAGE,
    'ong-gia-noel': '<span class="xc-moon left"></span><img class="xc-sleigh" src="assets/santa.svg" alt="">'
  };

  function validTemplate(key) {
    return TEMPLATES.some(function (t) { return t.key === key; }) ? key : 'co-dien';
  }

  function build() {
    var el = document.createElement('div');
    el.className = 'xcard';
    el.innerHTML =
      '<div class="xc-deco"></div>' +
      '<div class="xc-inner">' +
      '<p class="xc-title">Merry Christmas</p>' +
      '<p class="xc-sub">Giáng Sinh an lành</p>' +
      '<p class="xc-to">Gửi <b class="xc-name"></b>,</p>' +
      '<p class="xc-wish"></p>' +
      '<p class="xc-from"></p>' +
      '</div>';
    return el;
  }

  // Chữ người dùng nhập chỉ được gán qua textContent.
  function fill(el, data) {
    var tpl = validTemplate(data.tpl);
    if (el.dataset.tpl !== tpl) {
      el.dataset.tpl = tpl;
      el.className = 'xcard t-' + tpl;
      el.querySelector('.xc-deco').innerHTML = DECO[tpl];
    }
    el.querySelector('.xc-name').textContent = data.to || '...';
    el.querySelector('.xc-wish').textContent = data.wish || '';
    el.querySelector('.xc-from').textContent = data.from ? '— ' + data.from : '';
  }

  // ---------- Ảnh PNG vẽ bằng canvas ----------
  function wrap(ctx, text, maxW) {
    var words = text.split(' '), lines = [], line = '';
    words.forEach(function (w) {
      var test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
    });
    if (line) lines.push(line);
    return lines;
  }

  function stars(ctx, W, H, n) {
    ctx.fillStyle = 'rgba(255,255,255,.8)';
    for (var i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.arc((i * 397) % W, (i * 211) % (H * 0.55), 1.5 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function moon(ctx, x, y, r) {
    var g = ctx.createRadialGradient(x - r / 3, y - r / 3, 4, x, y, r);
    g.addColorStop(0, '#fffbe8'); g.addColorStop(1, '#f3e6a8');
    ctx.save();
    ctx.shadowColor = 'rgba(255,246,200,.6)'; ctx.shadowBlur = 60;
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function mistletoe(ctx, x, y, rot, s) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    ctx.fillStyle = '#2e7d32';
    ctx.beginPath(); ctx.ellipse(18, 18, 16, 7, -0.52, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#43a047';
    ctx.beginPath(); ctx.ellipse(42, 18, 16, 7, 0.52, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#388e3c';
    ctx.beginPath(); ctx.ellipse(30, 12, 5, 12, 0, 0, Math.PI * 2); ctx.fill();
    [[25, 27, '#e53935'], [35, 28, '#c62828'], [30, 35, '#e53935']].forEach(function (b) {
      ctx.fillStyle = b[2];
      ctx.beginPath(); ctx.arc(b[0], b[1], 5, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
  }

  function village(ctx, W, H) {
    var top = H - 300;
    ctx.fillStyle = '#dfe9f5';
    ctx.beginPath(); ctx.moveTo(0, top + 160);
    ctx.quadraticCurveTo(W * 0.25, top + 60, W * 0.5, top + 140);
    ctx.quadraticCurveTo(W * 0.75, top + 220, W, top + 120);
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
    ctx.fillStyle = '#f4f8fc';
    ctx.beginPath(); ctx.moveTo(0, top + 220);
    ctx.quadraticCurveTo(W * 0.4, top + 160, W * 0.75, top + 210);
    ctx.quadraticCurveTo(W * 0.9, top + 230, W, top + 200);
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
    [[110, '#7a3b2e'], [800, '#2f5d50']].forEach(function (h) {
      var x = h[0], y = top + 130;
      ctx.fillStyle = h[1]; ctx.fillRect(x, y, 170, 110);
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.moveTo(x - 18, y + 6); ctx.lineTo(x + 85, y - 70); ctx.lineTo(x + 188, y + 6); ctx.fill();
      ctx.fillStyle = '#ffcf5a';
      ctx.fillRect(x + 25, y + 30, 36, 32); ctx.fillRect(x + 109, y + 30, 36, 32);
    });
    var tx = W / 2, ty = top + 30;
    ctx.fillStyle = '#1d6b3a';
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx - 70, ty + 120); ctx.lineTo(tx + 70, ty + 120); ctx.fill();
    ctx.fillStyle = '#145433';
    ctx.beginPath(); ctx.moveTo(tx, ty + 60); ctx.lineTo(tx - 95, ty + 200); ctx.lineTo(tx + 95, ty + 200); ctx.fill();
    ['#ff4d4d', '#ffd54a', '#4dc3ff', '#ff7ad9', '#ffd54a'].forEach(function (c, i) {
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(tx - 50 + i * 25, ty + 100 + (i % 2) * 50, 7, 0, Math.PI * 2); ctx.fill();
    });
  }

  function loadImage(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = src;
    });
  }

  function draw(data) {
    var W = 1080, H = 1350, tpl = validTemplate(data.tpl), col = COLORS[tpl];
    var fonts = document.fonts ? Promise.all([
      document.fonts.load('700 100px "Dancing Script"'), document.fonts.load('600 60px "Dancing Script"')
    ]).catch(function () {}) : Promise.resolve();
    var sleigh = tpl === 'ong-gia-noel' ? loadImage('assets/santa.svg') : Promise.resolve(null);

    return Promise.all([fonts, sleigh]).then(function (res) {
      var c = document.createElement('canvas');
      c.width = W; c.height = H;
      var ctx = c.getContext('2d'), g, top, maxW, bottom;

      if (tpl === 'co-dien') {
        g = ctx.createRadialGradient(W / 2, H * 0.3, 50, W / 2, H / 2, H * 0.8);
        g.addColorStop(0, '#d32f2f'); g.addColorStop(1, '#8e1414');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff8e8';
        ctx.beginPath(); ctx.roundRect(54, 54, W - 108, H - 108, 36); ctx.fill();
        ctx.strokeStyle = '#c9a227';
        ctx.lineWidth = 10; ctx.beginPath(); ctx.roundRect(54, 54, W - 108, H - 108, 36); ctx.stroke();
        ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(78, 78, W - 156, H - 156, 24); ctx.stroke();
        mistletoe(ctx, 40, 30, 0, 4);
        mistletoe(ctx, W - 40, H - 30, Math.PI, 4);
        top = 250; maxW = W - 300; bottom = H - 180;
      } else if (tpl === 'lang-tuyet') {
        g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#0b1838'); g.addColorStop(1, '#2a4a80');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        stars(ctx, W, H, 80);
        moon(ctx, W - 130, 110, 52);
        village(ctx, W, H);
        top = 300; maxW = W - 240; bottom = H - 330;
      } else {
        g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#1b1446'); g.addColorStop(1, '#46307f');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        stars(ctx, W, H, 80);
        moon(ctx, 150, 150, 60);
        if (res[1]) ctx.drawImage(res[1], (W - 720) / 2, 60, 720, 260);
        top = 420; maxW = W - 240; bottom = H - 140;
      }

      var left = (W - maxW) / 2;

      // Thu nhỏ chữ nếu lời chúc dài để vừa khung, rồi canh cả khối chữ vào giữa phần trống.
      var size = 64, lines;
      do {
        ctx.font = '600 ' + size + 'px "Dancing Script", cursive';
        lines = wrap(ctx, data.wish, maxW);
        size -= 4;
      } while (top + 200 + lines.length * size * 1.35 + 110 > bottom && size > 36);
      var lh = (size + 4) * 1.35;
      var wishFont = ctx.font;
      top += Math.max(0, (bottom - top - (200 + lines.length * lh + 100)) / 2 - 30);

      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'center';
      ctx.fillStyle = col.title;
      ctx.font = '700 120px "Dancing Script", cursive';
      ctx.fillText('Merry Christmas', W / 2, top);
      ctx.font = '600 34px "Segoe UI", system-ui, sans-serif';
      if ('letterSpacing' in ctx) ctx.letterSpacing = '8px';
      ctx.fillText('GIÁNG SINH AN LÀNH', W / 2, top + 62);
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

      ctx.textAlign = 'left';
      ctx.font = '700 72px "Dancing Script", cursive';
      var y = top + 170;
      ctx.fillStyle = col.text; ctx.fillText('Gửi ', left, y);
      var x = left + ctx.measureText('Gửi ').width;
      ctx.fillStyle = col.name; ctx.fillText(data.to, x, y);
      x += ctx.measureText(data.to).width;
      ctx.fillStyle = col.text; ctx.fillText(',', x, y);

      ctx.font = wishFont;
      y += 30;
      lines.forEach(function (l) { y += lh; ctx.fillText(l, left, y); });

      ctx.textAlign = 'right';
      ctx.font = '700 68px "Dancing Script", cursive';
      ctx.fillText('— ' + data.from, left + maxW, y + 100);

      ctx.textAlign = 'center';
      ctx.fillStyle = col.foot;
      ctx.font = '500 26px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('Thiệp từ app Giáng Sinh Tháng 12 · ' + location.host, W / 2, H - 20);
      return c;
    });
  }

  function slug(s) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd')
            .replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'ban';
  }

  function download(data) {
    return draw(data).then(function (c) {
      return new Promise(function (resolve) {
        c.toBlob(function (blob) {
          var a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'thiep-giang-sinh-' + slug(data.to) + '.png';
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
          resolve();
        }, 'image/png');
      });
    });
  }

  // ---------- Người nhận: mở phong bì, ông già Noel trao thiệp ----------
  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function open(gift, onCreate) {
    var view = document.getElementById('cardView');
    var env = document.getElementById('cvEnvelope');
    var hint = document.getElementById('cvHint');
    var stage = document.getElementById('cvStage');
    var santa = document.getElementById('cvSanta');
    var bubble = document.getElementById('cvBubble');
    var clap = document.getElementById('cvClap');
    var actions = document.getElementById('cvActions');
    var musicBox = document.getElementById('cvMusic');
    var texts = GS.data.wishes.card;
    var timers = [];

    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function speak(t) { bubble.textContent = t; bubble.hidden = false; }
    function fmt(t) { return t.replace(/\{name\}/g, gift.to).replace(/\{from\}/g, gift.from); }

    document.getElementById('cvTo').textContent = 'Gửi ' + gift.to + ' – từ ' + gift.from;
    var card = build();
    fill(card, { tpl: gift.tpl, to: gift.to, from: gift.from, wish: '' });
    document.getElementById('cvCard').replaceChildren(card);
    var wishEl = card.querySelector('.xc-wish');
    var fromEl = card.querySelector('.xc-from');
    fromEl.style.visibility = 'hidden';

    var figure = document.querySelector('#introSanta svg');
    if (figure) santa.appendChild(figure.cloneNode(true));

    var flakes = view.querySelector('.intro-flakes');
    for (var i = 0; i < 25; i++) {
      var f = document.createElement('span');
      f.textContent = '❄';
      f.style.left = Math.random() * 100 + '%';
      f.style.fontSize = (8 + Math.random() * 14) + 'px';
      f.style.animationDuration = (5 + Math.random() * 6) + 's';
      f.style.animationDelay = (-Math.random() * 8) + 's';
      flakes.appendChild(f);
    }
    document.body.classList.add('intro-on');
    view.hidden = false;

    // Nhạc người gửi đã chọn: nhạc chuông (Web Audio) hoặc bài YouTube (khung video dưới thiệp).
    var songSel = document.getElementById('cvSong');
    var mute = document.getElementById('cvMute');
    var ytBox = document.getElementById('cvYt');
    var now = document.getElementById('cvNow');
    var current = gift.song;

    function ytOf(value) { return value.indexOf('yt:') === 0 ? value.slice(3) : null; }
    function isOn() { return ytOf(current) ? GS.music.isYouTubePlayingIn('cvYtPlayer') : GS.music.isPlaying(); }
    function updateMute() { mute.textContent = isOn() ? '🔇 Tắt nhạc' : '🔊 Bật nhạc'; }

    // Bài YouTube bị chặn phát trên web khác thì chuyển sang Jingle Bells.
    function ytFailed() {
      ytBox.hidden = true;
      current = 'jingle';
      songSel.value = 'jingle';
      GS.music.playMelody('jingle');
      now.textContent = '🎵 Bài YouTube không phát được ở đây, đang phát Jingle Bells';
      updateMute();
    }

    function playMusic(value) {
      current = value;
      var id = ytOf(value);
      now.textContent = '🎵 ' + GS.music.choiceName(value);
      now.hidden = false;
      if (id) {
        ytBox.hidden = false;
        GS.music.playYouTubeIn('cvYtPlayer', id, { loop: true, onError: ytFailed });
      } else {
        GS.music.stopYouTubeIn('cvYtPlayer');
        ytBox.hidden = true;
        GS.music.playMelody(value);
      }
    }

    if (ytOf(gift.song)) GS.music.prepareYouTubeIn('cvYtPlayer', ytOf(gift.song), { loop: true, onError: ytFailed });

    // Hộp nhạc: đổi bài, tắt/bật nhạc.
    GS.music.fillSongSelect(songSel);
    songSel.value = gift.song;
    songSel.addEventListener('change', function () { playMusic(songSel.value); setTimeout(updateMute, 1200); updateMute(); });
    mute.addEventListener('click', function () {
      if (isOn()) {
        GS.music.setPlaying(false);
        GS.music.stopYouTubeIn('cvYtPlayer');
      } else playMusic(current);
      setTimeout(updateMute, 800);
      updateMute();
    });
    document.getElementById('cvMusicBtn').addEventListener('click', function () {
      musicBox.hidden = !musicBox.hidden;
      updateMute();
    });

    var dl = document.getElementById('cvDownload');
    dl.addEventListener('click', function () {
      dl.disabled = true;
      download(gift).then(function () { dl.disabled = false; });
    });

    document.getElementById('cvCreate').addEventListener('click', function () {
      timers.forEach(clearTimeout);
      GS.snow.stopFx();
      GS.music.stopYouTubeIn('cvYtPlayer');
      view.classList.add('leaving');
      setTimeout(function () {
        view.hidden = true;
        document.body.classList.remove('intro-on');
        onCreate(gift);
      }, 600);
    });

    // Chạm vào phong bì là bước bật nhạc, vì điện thoại không cho tự phát khi chưa chạm.
    env.addEventListener('click', function () {
      if (env.classList.contains('open')) return;
      env.classList.add('open');
      hint.hidden = true;
      playMusic(gift.song);
      if (isIOS()) document.getElementById('cvIos').hidden = false;

      later(function () { env.classList.add('gone'); }, 1100);
      later(function () { env.hidden = true; stage.hidden = false; }, 1600);
      later(function () { santa.hidden = false; santa.classList.add('fly-down'); }, 2400);
      later(function () { speak(fmt(texts.arrive)); GS.music.hohoho(); }, 3600);
      later(typeWish, 5000);
    });

    function typeWish() {
      var chars = Array.from(gift.wish), i = 0;
      bubble.hidden = true;
      (function step() {
        if (i < chars.length) { wishEl.textContent += chars[i++]; return later(step, 45); }
        fromEl.style.visibility = '';
        later(surprise, 800);
      })();
    }

    function surprise() {
      santa.classList.add('wink');
      speak(GS.data.wishes.delivery.wink);
      later(function () { santa.classList.remove('wink'); clap.hidden = false; GS.music.clap(); }, 900);
      later(function () {
        clap.hidden = true;
        bubble.hidden = true;
        var fx = ['fireworks', 'rain', 'name'][Math.floor(Math.random() * 3)];
        GS.snow.effect(fx, {
          text: gift.to,
          onGold: function () {
            var g = GS.data.wishes.giftDrops[Math.floor(Math.random() * GS.data.wishes.giftDrops.length)];
            GS.music.jingle();
            GS.showGift(g.icon, g.title, g.text);
          }
        }, goodbye);
      }, 1400);
    }

    function goodbye() {
      speak(fmt(texts.bye));
      GS.music.hohoho();
      later(function () { bubble.hidden = true; santa.classList.add('fly-up'); }, 2200);
      later(function () { actions.hidden = false; actions.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 2600);
    }
  }

  return { TEMPLATES: TEMPLATES, build: build, fill: fill, download: download, open: open, validTemplate: validTemplate };
})();
