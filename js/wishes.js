// Gửi lời chúc: nhập tên người nhận, ông già Noel mang cuộn thư chúc tới, rồi sao chép để gửi bạn bè.
GS.wishes = (function () {
  var lastWish = '';

  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  // Mỗi lần gửi là một lời chúc khác lần trước.
  function nextWish() {
    var list = GS.data.wishes.scrollWishes, w;
    do { w = pick(list); } while (w === lastWish && list.length > 1);
    lastWish = w;
    return w;
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () { return copyFallback(text); });
    }
    return copyFallback(text);
  }

  // Cách cũ cho trình duyệt chặn Clipboard API: chọn chữ trong ô ẩn rồi chép.
  function copyFallback(text) {
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { /* trình duyệt chặn */ }
      ta.remove();
      ok ? resolve() : reject();
    });
  }

  function init() {
    var form = document.getElementById('wishForm');
    var input = document.getElementById('wishName');
    var out = document.getElementById('wishOut');
    var actions = document.getElementById('wishActions');
    var copyBtn = document.getElementById('btnCopyWish');
    var message = '';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = input.value.trim();
      if (!name) {
        input.placeholder = 'Hãy nhập tên người nhận nhé!';
        input.focus();
        return;
      }
      GS.storage.set('name', name);
      var wish = nextWish();
      message = 'Gửi ' + name + ': ' + wish;
      out.hidden = true;
      actions.hidden = true;
      GS.santa.deliver(name, wish, function () {
        out.textContent = message;
        out.hidden = false;
        actions.hidden = false;
        copyBtn.textContent = '📋 Sao chép lời chúc';
        actions.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });

    copyBtn.addEventListener('click', function () {
      var link = location.origin + location.pathname;
      copyText(message + ' 🎄🎅\n— Ông già Noel gửi từ app Giáng Sinh Tháng 12: ' + link)
        .then(function () { copyBtn.textContent = '✅ Đã sao chép! Dán vào Zalo, Messenger, TikTok nhé'; })
        .catch(function () { copyBtn.textContent = '⚠️ Không sao chép được, hãy bôi đen để chép'; });
    });

    document.getElementById('btnWishAgain').addEventListener('click', function () {
      input.value = '';
      out.hidden = true;
      actions.hidden = true;
      input.focus();
    });
  }

  return { init: init, pick: pick };
})();
