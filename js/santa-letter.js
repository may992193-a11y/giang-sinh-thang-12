// Viết thư gửi ông già Noel và hộp thư điều ước.
GS.letter = (function () {
  var countEl, list, dialog;

  function letters() { return GS.storage.get('letters', []); }

  function updateCount() { countEl.textContent = letters().length; }

  function renderMailbox() {
    var all = letters();
    list.replaceChildren();
    if (!all.length) {
      var empty = document.createElement('li');
      empty.textContent = 'Chưa có lá thư nào. Hãy viết điều ước đầu tiên nhé!';
      list.appendChild(empty);
      return;
    }
    all.slice().reverse().forEach(function (l, i) {
      var li = document.createElement('li');
      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'del';
      del.textContent = '🗑️';
      del.setAttribute('aria-label', 'Xóa thư');
      del.addEventListener('click', function () {
        var arr = letters();
        arr.splice(arr.length - 1 - i, 1);
        GS.storage.set('letters', arr);
        renderMailbox();
        updateCount();
      });
      var date = document.createElement('small');
      date.textContent = new Date(l.date).toLocaleString('vi-VN');
      var body = document.createElement('div');
      body.textContent = l.text;
      li.append(del, date, body);
      list.appendChild(li);
    });
  }

  function flyEnvelope(fromEl) {
    var r = fromEl.getBoundingClientRect();
    var env = document.createElement('div');
    env.className = 'flying-letter';
    env.textContent = '✉️';
    env.style.left = (r.left + r.width / 2 - 20) + 'px';
    env.style.top = (r.top + 10) + 'px';
    env.addEventListener('animationend', function () { env.remove(); });
    document.getElementById('letterLayer').appendChild(env);
  }

  function init() {
    var form = document.getElementById('letterForm');
    var text = document.getElementById('letterText');
    countEl = document.getElementById('mailCount');
    list = document.getElementById('mailList');
    dialog = document.getElementById('mailDialog');
    updateCount();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var value = text.value.trim();
      if (!value) { text.focus(); return; }
      var arr = letters();
      arr.push({ text: value, date: Date.now() });
      GS.storage.set('letters', arr);
      updateCount();
      flyEnvelope(text);
      text.value = '';
      setTimeout(function () {
        GS.santa.fly(true);
        setTimeout(function () { GS.santa.say('Ông đã nhận được thư của con rồi! Ho ho ho!', 4000); }, 1500);
      }, 1200);
    });

    document.getElementById('btnMailbox').addEventListener('click', function () {
      renderMailbox();
      dialog.showModal();
    });
  }

  return { init: init };
})();
