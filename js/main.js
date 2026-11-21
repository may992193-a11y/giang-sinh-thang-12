// Khởi động app, gắn sự kiện chung, mở/đóng hộp thoại.
(function () {
  function loadJSON(path) {
    return fetch(path).then(function (r) {
      if (!r.ok) throw new Error(path);
      return r.json();
    });
  }

  function makeStars() {
    var box = document.getElementById('stars');
    var count = window.innerWidth < 520 ? 70 : 140;
    for (var i = 0; i < count; i++) {
      var s = document.createElement('div');
      s.className = 'star';
      s.style.left = Math.random() * 100 + '%';
      s.style.top = Math.random() * 65 + '%';
      s.style.animationDelay = (Math.random() * 3).toFixed(2) + 's';
      if (Math.random() < 0.2) { s.style.width = s.style.height = '3px'; }
      box.appendChild(s);
    }
  }

  // Hộp thoại mở quà dùng chung cho lịch 24 ô và quà ông già Noel thả.
  GS.showGift = function (icon, title, text) {
    var dlg = document.getElementById('giftDialog');
    var iconEl = document.getElementById('giftIcon');
    iconEl.textContent = icon;
    iconEl.style.animation = 'none';
    void iconEl.offsetWidth;
    iconEl.style.animation = '';
    document.getElementById('giftTitle').textContent = title;
    document.getElementById('giftText').textContent = text;
    if (!dlg.open) dlg.showModal();
  };

  function initDialogs() {
    document.querySelectorAll('dialog').forEach(function (dlg) {
      dlg.addEventListener('click', function (e) {
        if (e.target.hasAttribute('data-close')) return dlg.close();
        if (e.target !== dlg) return;
        // Chỉ đóng khi bấm ra nền tối bên ngoài khung hộp thoại.
        var r = dlg.getBoundingClientRect();
        var inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        if (!inside) dlg.close();
      });
    });
  }

  function start() {
    makeStars();
    initDialogs();
    GS.snow.init();
    GS.countdown.init();
    GS.music.init();
    GS.wishes.init();
    GS.advent.init();
    GS.santa.init();
    GS.letter.init();
    GS.game.init();
  }

  Promise.all([loadJSON('data/gifts.json'), loadJSON('data/wishes.json'), loadJSON('data/songs.json')])
    .then(function (res) {
      GS.data = { gifts: res[0], wishes: res[1], songs: res[2] };
      start();
    })
    .catch(function () {
      document.getElementById('intro').hidden = true;
      document.body.classList.remove('intro-on');
      document.querySelector('.sub').textContent =
        'Không tải được dữ liệu. Hãy mở app qua máy chủ web (ví dụ GitHub Pages hoặc node serve.js).';
    });
})();
