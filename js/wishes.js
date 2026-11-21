// Nhập tên, hiện lời chúc ngẫu nhiên, lưu tên.
GS.wishes = (function () {
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  function init() {
    var form = document.getElementById('wishForm');
    var input = document.getElementById('wishName');
    var out = document.getElementById('wishOut');
    input.value = GS.storage.get('name', '');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = input.value.trim() || 'bạn';
      GS.storage.set('name', input.value.trim());
      out.textContent = pick(GS.data.wishes.wishes).replace(/\{name\}/g, name);
      out.hidden = false;
      GS.music.jingle();
    });
  }

  return { init: init, pick: pick };
})();
