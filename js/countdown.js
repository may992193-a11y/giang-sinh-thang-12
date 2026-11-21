// Đếm ngược tới 0 giờ 25/12, tự chuyển sang năm sau.
GS.countdown = (function () {
  var els = {};

  function isChristmas(now) {
    return now.getMonth() === 11 && now.getDate() === 25;
  }

  function nextChristmas(now) {
    var year = now.getFullYear();
    var target = new Date(year, 11, 25);
    if (now >= target) target = new Date(year + 1, 11, 25);
    return target;
  }

  // Số ngày tới Noel kế tiếp, khớp với ô "ngày" của đồng hồ; 0 nếu hôm nay là Noel.
  function daysLeft(now) {
    now = now || new Date();
    if (isChristmas(now)) return 0;
    return Math.floor((nextChristmas(now) - now) / 86400000);
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  function update() {
    var now = new Date();
    var christmas = isChristmas(now);
    els.box.hidden = christmas;
    els.msg.hidden = !christmas;
    if (christmas) {
      els.title.textContent = 'Hôm nay là Giáng Sinh!';
      els.msg.textContent = GS.data.wishes.christmas;
      return;
    }
    var diff = Math.max(0, nextChristmas(now) - now);
    var s = Math.floor(diff / 1000);
    els.d.textContent = Math.floor(s / 86400);
    els.h.textContent = pad(Math.floor(s / 3600) % 24);
    els.m.textContent = pad(Math.floor(s / 60) % 60);
    els.s.textContent = pad(s % 60);
  }

  function init() {
    els = {
      box: document.getElementById('countdown'),
      msg: document.getElementById('cdMsg'),
      title: document.getElementById('cdTitle'),
      d: document.getElementById('cdD'),
      h: document.getElementById('cdH'),
      m: document.getElementById('cdM'),
      s: document.getElementById('cdS')
    };
    update();
    setInterval(update, 1000);
  }

  return { init: init, daysLeft: daysLeft };
})();
