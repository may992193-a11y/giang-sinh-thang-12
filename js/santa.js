// Ông già Noel bay, ném quà, chạm để nói chuyện, linh vật góc màn hình, hành trình đêm 24/12.
GS.santa = (function () {
  var fly, art, bubble, giftLayer, dropTimer = null, bubbleTimer = null, flying = false;

  // Múi giờ từ đông sang tây: nửa đêm 25/12 tới nơi nào trước, ông ghé nơi đó trước.
  var ZONES = [
    [14, 'Kiribati'], [13, 'Tonga, Samoa'], [12, 'New Zealand, Fiji'], [11, 'Quần đảo Solomon'],
    [10, 'Úc (Sydney)'], [9, 'Nhật Bản, Hàn Quốc'], [8, 'Trung Quốc, Singapore, Philippines'],
    [7, 'Việt Nam, Thái Lan, Indonesia'], [6, 'Bangladesh'], [5.5, 'Ấn Độ'], [5, 'Pakistan'],
    [4, 'UAE'], [3, 'Nga (Moscow), Thổ Nhĩ Kỳ'], [2, 'Ai Cập, Hy Lạp'], [1, 'Pháp, Đức, Ý'],
    [0, 'Anh, Bồ Đào Nha'], [-1, 'Cape Verde'], [-3, 'Brazil, Argentina'], [-4, 'Bolivia, Venezuela'],
    [-5, 'Mỹ (New York), Peru'], [-6, 'Mexico, Mỹ (Chicago)'], [-7, 'Mỹ (Denver)'],
    [-8, 'Mỹ (Los Angeles), Canada (Vancouver)'], [-9, 'Alaska'], [-10, 'Hawaii'], [-11, 'Samoa thuộc Mỹ']
  ];

  function rand(list) { return list[Math.floor(Math.random() * list.length)]; }

  // Chèn santa.svg trực tiếp vào trang để CSS điều khiển được chân tuần lộc, tay ông.
  function loadArt(targets) {
    fetch('assets/santa.svg')
      .then(function (r) { if (!r.ok) throw new Error(); return r.text(); })
      .then(function (text) {
        var svg = new DOMParser().parseFromString(text, 'image/svg+xml').documentElement;
        targets.forEach(function (t) { t.appendChild(document.importNode(svg, true)); });
      })
      .catch(function () {
        targets.forEach(function (t) {
          var img = document.createElement('img');
          img.src = 'assets/santa.svg';
          img.alt = 'Ông già Noel';
          t.appendChild(img);
        });
      });
  }

  function say(text, ms) {
    bubble.textContent = text;
    bubble.hidden = false;
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(function () { bubble.hidden = true; }, ms || 3500);
  }

  function dropGift() {
    var r = art.getBoundingClientRect();
    if (r.right < 0 || r.left > window.innerWidth) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'drop-gift';
    btn.setAttribute('aria-label', 'Hộp quà');
    var span = document.createElement('span');
    span.textContent = rand(['🎁', '🎁', '🎀', '📦']);
    btn.appendChild(span);
    var top = r.top + r.height * 0.6;
    btn.style.left = (r.left + r.width * 0.15) + 'px';
    btn.style.top = top + 'px';
    btn.style.setProperty('--fall', (window.innerHeight - top - 70) + 'px');
    btn.addEventListener('click', function () {
      var g = rand(GS.data.wishes.giftDrops);
      btn.classList.add('burst');
      GS.music.jingle();
      GS.showGift(g.icon, g.title, g.text);
    });
    btn.addEventListener('animationend', function (e) {
      if (btn.classList.contains('burst')) return btn.remove();
      if (e.animationName === 'gift-fall') setTimeout(function () { btn.remove(); }, 4000);
    });
    giftLayer.appendChild(btn);
  }

  function land() {
    flying = false;
    fly.hidden = true;
    fly.classList.remove('paused');
    bubble.hidden = true;
    clearInterval(dropTimer);
  }

  function flyAcross(withHo) {
    if (withHo) GS.music.hohoho();
    if (flying) return;
    flying = true;
    fly.hidden = false;
    fly.style.animation = 'none';
    void fly.offsetWidth;
    fly.style.animation = '';
    dropTimer = setInterval(function () {
      if (!fly.classList.contains('paused')) dropGift();
    }, 2200);
  }

  function talk() {
    if (fly.classList.contains('paused')) return;
    fly.classList.add('paused');
    GS.music.hohoho();
    say('Ho ho ho! ' + rand(GS.data.wishes.santaQuotes), 3500);
    setTimeout(function () { fly.classList.remove('paused'); }, 3500);
  }

  // ---------- Linh vật ----------
  function mascotMessage() {
    var m = GS.data.wishes.mascot, now = new Date();
    var days = GS.countdown.daysLeft(now);
    var tpl;
    if (now.getMonth() === 11 && now.getDate() === 25) tpl = m.day;
    else if (now.getMonth() === 11 && now.getDate() === 24) tpl = m.eve;
    else if (now.getMonth() === 11 && now.getDate() > 25) tpl = m.after;
    else tpl = days <= 7 ? m.near : m.far;
    return tpl.replace(/\{days\}/g, days);
  }

  function initMascot() {
    var btn = document.getElementById('mascot');
    var mb = document.getElementById('mascotBubble');
    var t = null;
    // Chạm vào linh vật: ông nói thêm một lời chúc mới.
    var lastWish = '';
    btn.addEventListener('click', function () {
      var list = GS.data.wishes.dailyWishes, w;
      do { w = rand(list); } while (w === lastWish && list.length > 1);
      lastWish = w;
      GS.music.hohoho();
      show('Ho ho ho! ' + w);
    });
    function show(text) {
      mb.textContent = text || mascotMessage();
      mb.hidden = false;
      clearTimeout(t);
      t = setTimeout(function () { mb.hidden = true; }, 6000);
    }
    return show;
  }

  // ---------- Màn chào: ông già Noel tặng quà khi mở app ----------
  function todayKey() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  // Mỗi ngày một lời chúc cố định, theo thứ tự ngày trong năm.
  function wishOfToday() {
    var now = new Date();
    var dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
    var list = GS.data.wishes.dailyWishes;
    return list[dayOfYear % list.length];
  }

  function savedGift() {
    var g = GS.storage.get('dailyGift', null);
    return g && g.date === todayKey() ? g.text : null;
  }

  function initIntro(onDone) {
    var intro = document.getElementById('intro');
    var sleigh = document.getElementById('introSleigh');
    var santa = document.getElementById('introSanta');
    var bubbleEl = document.getElementById('introBubble');
    var gift = document.getElementById('introGift');
    var burstBox = document.getElementById('introBurst');
    var card = document.getElementById('introCard');
    var texts = GS.data.wishes.intro;
    var timers = [], closed = false;

    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function speak(text) { bubbleEl.textContent = text; bubbleEl.hidden = false; }

    var flakes = intro.querySelector('.intro-flakes');
    for (var i = 0; i < 30; i++) {
      var f = document.createElement('span');
      f.textContent = Math.random() < 0.5 ? '❄' : '•';
      f.style.left = Math.random() * 100 + '%';
      f.style.fontSize = (8 + Math.random() * 14) + 'px';
      f.style.animationDuration = (5 + Math.random() * 6) + 's';
      f.style.animationDelay = (-Math.random() * 8) + 's';
      flakes.appendChild(f);
    }

    function close(fast) {
      if (closed) return;
      closed = true;
      timers.forEach(clearTimeout);
      intro.classList.add('leaving');
      setTimeout(function () {
        intro.hidden = true;
        document.body.classList.remove('intro-on');
        onDone();
      }, fast ? 300 : 700);
    }

    function goodbye() {
      card.hidden = true;
      speak(texts.bye);
      GS.music.hohoho();
      later(function () { santa.classList.add('boarding'); bubbleEl.hidden = true; }, 1600);
      later(function () { sleigh.classList.add('takeoff'); GS.music.jingle(); }, 2100);
      later(function () { close(false); }, 3500);
    }

    function openGift() {
      if (gift.classList.contains('open')) return;
      gift.classList.add('open');
      GS.music.jingle();
      for (var i = 0; i < 36; i++) {
        var s = document.createElement('span');
        s.textContent = ['❄', '✦', '⭐', '✨'][i % 4];
        var a = Math.random() * Math.PI - Math.PI, d = 60 + Math.random() * 120;
        s.style.setProperty('--dx', Math.cos(a) * d + 'px');
        s.style.setProperty('--dy', Math.sin(a) * d + 'px');
        s.style.fontSize = (10 + Math.random() * 14) + 'px';
        s.style.animationDelay = Math.random() * 0.2 + 's';
        burstBox.appendChild(s);
      }
      var wish = wishOfToday();
      GS.storage.set('dailyGift', { date: todayKey(), text: wish });
      speak(texts.opened);
      document.getElementById('introWish').textContent = wish;
      later(function () { card.hidden = false; document.getElementById('introGo').focus(); }, 700);
    }

    document.getElementById('introSkip').addEventListener('click', function () { close(true); });
    document.getElementById('introGo').addEventListener('click', goodbye);
    gift.addEventListener('click', openGift);

    // Trình duyệt chỉ cho phát âm thanh sau lần chạm đầu tiên, nên chuông có thể im lúc đầu.
    GS.music.jingle();
    later(function () {
      santa.hidden = false;
      var name = GS.storage.get('name', '');
      speak(name ? texts.greetName.replace(/\{name\}/g, name) : texts.greet);
      GS.music.hohoho();
    }, 2700);
    later(function () { gift.hidden = false; speak(texts.offer); }, 5000);
  }

  // ---------- Hành trình đêm 24/12 ----------
  function arrival(year, offset) {
    return Date.UTC(year, 11, 25) - offset * 3600000;
  }

  function renderJourney(time, year, demo) {
    var text = document.getElementById('journeyText');
    var bar = document.getElementById('journeyBar');
    var place = document.getElementById('journeyPlace');
    var first = arrival(year, ZONES[0][0]);
    var last = arrival(year, ZONES[ZONES.length - 1][0]);
    var done = ZONES.filter(function (z) { return arrival(year, z[0]) <= time; }).length;
    bar.style.width = (done / ZONES.length * 100) + '%';

    if (time < first) {
      var h = Math.ceil((first - time) / 3600000);
      text.textContent = demo ? '' : 'Hành trình bắt đầu khi nửa đêm 25/12 tới Kiribati (còn khoảng ' + h + ' giờ). Bấm "Xem thử" để xem trước!';
      place.textContent = '🛷 Ông già Noel đang chuẩn bị xe trượt ở Bắc Cực.';
    } else if (time >= last) {
      text.textContent = 'Ông đã ghé ' + ZONES.length + ' múi giờ trên khắp thế giới.';
      place.textContent = '🎉 Đã phát xong quà! Ông về Bắc Cực nghỉ ngơi rồi.';
    } else {
      var cur = ZONES[done - 1];
      text.textContent = 'Đã phát quà ở ' + done + '/' + ZONES.length + ' múi giờ.';
      place.textContent = '🎁 Ông đang phát quà ở: ' + cur[1] + ' (UTC' + (cur[0] >= 0 ? '+' : '') + cur[0] + ')';
    }
  }

  function initJourney() {
    var now = new Date();
    var year = now.getMonth() === 11 && now.getDate() > 25 ? now.getFullYear() + 1 : now.getFullYear();
    var demoTimer = null;
    function real() { renderJourney(Date.now(), year, false); }
    real();
    var realTimer = setInterval(real, 30000);

    document.getElementById('btnJourneyDemo').addEventListener('click', function () {
      clearInterval(realTimer);
      clearInterval(demoTimer);
      var start = arrival(year, 15), end = arrival(year, -12), t = start;
      var step = (end - start) / 120;
      flyAcross(true);
      demoTimer = setInterval(function () {
        t += step;
        renderJourney(t, year, true);
        if (t >= end) {
          clearInterval(demoTimer);
          setTimeout(function () { real(); realTimer = setInterval(real, 30000); }, 5000);
        }
      }, 150);
    });
  }

  function init() {
    fly = document.getElementById('santaFly');
    art = document.getElementById('santaArt');
    bubble = document.getElementById('santaBubble');
    giftLayer = document.getElementById('giftLayer');
    loadArt([art, document.getElementById('introSleigh')]);

    fly.addEventListener('animationend', function (e) {
      if (e.animationName === 'santa-cross') land();
    });
    art.addEventListener('click', talk);
    art.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); talk(); }
    });
    document.getElementById('btnSanta').addEventListener('click', function () { flyAcross(true); });

    var showMascot = initMascot();
    initJourney();

    // Sau màn chào, ông ở lại: bay qua lại trên trời và vẫy tay ở góc màn hình.
    initIntro(function () {
      setTimeout(function () { flyAcross(false); }, 800);
      setTimeout(function () { showMascot(); }, 1500);
      setInterval(function () { flyAcross(false); }, 40000);
    });

    document.getElementById('btnDailyGift').addEventListener('click', function () {
      var text = savedGift();
      if (text) GS.showGift('🎁', 'Lời chúc hôm nay của ông', text);
      else GS.showGift('🎅', 'Hôm nay con chưa nhận quà', 'Tải lại trang để ông già Noel tặng quà cho con nhé! Ho ho ho!');
    });
  }

  return { init: init, fly: flyAcross, say: say };
})();
