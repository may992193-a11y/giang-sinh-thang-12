// Lịch mở quà 24 ô, khóa theo ngày, có chế độ xem thử.
GS.advent = (function () {
  var grid, hint, preview;

  function today() {
    var now = new Date();
    return now.getMonth() === 11 ? now.getDate() : 0;
  }

  function isUnlocked(day) {
    return preview.checked || day <= today();
  }

  function render() {
    var opened = GS.storage.get('opened', []);
    var gifts = GS.data.gifts;
    grid.replaceChildren();
    for (var day = 1; day <= 24; day++) {
      var b = document.createElement('button');
      b.type = 'button';
      b.dataset.day = day;
      var isOpen = opened.indexOf(day) !== -1 && isUnlocked(day);
      b.textContent = isOpen ? gifts[day - 1].icon : day;
      b.setAttribute('aria-label', 'Ô quà ngày ' + day);
      if (isOpen) b.classList.add('opened');
      if (!isUnlocked(day)) b.classList.add('locked');
      grid.appendChild(b);
    }
    var d = today();
    hint.textContent = preview.checked
      ? 'Chế độ xem thử: mở được tất cả các ô.'
      : d === 0 ? 'Lịch mở quà bắt đầu từ 1/12. Bật "Xem thử" để mở trước nhé!'
      : 'Hôm nay là ngày ' + d + '/12, bạn mở được ' + Math.min(d, 24) + ' ô.';
  }

  function open(day, btn) {
    if (!isUnlocked(day)) {
      btn.classList.remove('shake');
      void btn.offsetWidth;
      btn.classList.add('shake');
      hint.textContent = 'Ô ' + day + ' sẽ mở vào ngày ' + day + '/12. Kiên nhẫn chút nhé!';
      return;
    }
    var opened = GS.storage.get('opened', []);
    if (opened.indexOf(day) === -1) {
      opened.push(day);
      if (!preview.checked) GS.storage.set('opened', opened);
    }
    var g = GS.data.gifts[day - 1];
    GS.showGift(g.icon, 'Quà ngày ' + day + '/12', g.hint);
    GS.music.jingle();
    btn.textContent = g.icon;
    btn.classList.add('opened');
  }

  function init() {
    grid = document.getElementById('advent');
    hint = document.getElementById('adventHint');
    preview = document.getElementById('previewMode');
    preview.addEventListener('change', render);
    grid.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (btn) open(Number(btn.dataset.day), btn);
    });
    render();
  }

  return { init: init };
})();
