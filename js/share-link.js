// Tạo đường link lời chúc kèm nhạc để gửi bạn bè, và mở quà khi người nhận vào link.
// Lời chúc nằm ngay trong link (phần sau dấu #), nên chạy được trên GitHub Pages mà không cần máy chủ.
GS.share = (function () {
  var MAX_NAME = 30, MAX_WISH = 200, MAX_CODE = 2000;
  var incoming = null;

  // Bỏ ký tự điều khiển và ký tự đảo chiều chữ, gộp khoảng trắng, cắt theo độ dài tối đa.
  function clean(value, max) {
    if (typeof value !== 'string') return '';
    var s = value.replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩]/g, ' ')
                 .replace(/\s+/g, ' ').trim();
    return Array.from(s).slice(0, max).join('');
  }

  function encode(obj) {
    var bytes = new TextEncoder().encode(JSON.stringify(obj)), bin = '';
    bytes.forEach(function (b) { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function decode(code) {
    var b64 = code.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    var bin = atob(b64), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  }

  // Đọc quà từ link. Link hỏng hoặc bị sửa bậy thì bỏ qua, app chạy như bình thường.
  function parse() {
    var m = /^#g=([A-Za-z0-9_-]+)$/.exec(location.hash);
    if (!m || m[1].length > MAX_CODE) return null;
    try {
      var d = decode(m[1]);
      if (!d || typeof d !== 'object') return null;
      var gift = { to: clean(d.t, MAX_NAME), from: clean(d.f, MAX_NAME), wish: clean(d.w, MAX_WISH), song: clean(d.s, 10) };
      var keys = GS.music.songList().map(function (s) { return s.key; });
      if (keys.indexOf(gift.song) === -1) gift.song = 'jingle';
      return gift.to && gift.from && gift.wish ? gift : null;
    } catch (e) {
      return null;
    }
  }

  function baseUrl() { return location.origin + location.pathname; }

  function makeLink(gift) {
    return baseUrl() + '#g=' + encode({ t: gift.to, f: gift.from, w: gift.wish, s: gift.song });
  }

  // ---------- Người nhận: hộp quà, chạm để phát nhạc rồi ông đọc lời chúc ----------
  function openGift(gift) {
    var box = document.getElementById('giftLink');
    var btn = document.getElementById('glGift');
    document.getElementById('glTitle').textContent = 'Có quà Giáng Sinh gửi ' + gift.to + ' từ ' + gift.from + '!';
    var flakes = box.querySelector('.intro-flakes');
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
    box.hidden = false;

    // Trình duyệt điện thoại chỉ cho phát nhạc sau khi người dùng chạm, nên nhạc bắt đầu ở đây.
    btn.addEventListener('click', function () {
      if (btn.classList.contains('open')) return;
      btn.classList.add('open');
      GS.music.playMelody(gift.song);
      setTimeout(function () {
        box.classList.add('leaving');
        setTimeout(function () {
          box.hidden = true;
          GS.santa.deliver(gift.to, gift.wish, function () { showReply(gift); }, gift.from);
        }, 600);
      }, 700);
    });
  }

  // Sau khi nghe xong: điền sẵn form để người nhận gửi lại lời chúc.
  function showReply(gift) {
    var note = document.getElementById('replyNote');
    note.textContent = '💌 ' + gift.from + ' gửi bạn: "' + gift.wish + '". Gửi lại một lời chúc cho ' + gift.from + ' nhé!';
    note.hidden = false;
    document.getElementById('shTo').value = gift.from;
    document.getElementById('shFrom').value = gift.to;
    document.getElementById('shareCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---------- Người gửi: form tạo link ----------
  function copyLink(url, status) {
    var done = function () { status.textContent = '✅ Đã sao chép link! Dán vào Zalo hoặc Messenger để gửi nhé.'; };
    var fallback = function () {
      var input = document.getElementById('shLink');
      input.focus();
      input.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { /* trình duyệt chặn */ }
      status.textContent = ok ? '✅ Đã sao chép link! Dán vào Zalo hoặc Messenger để gửi nhé.'
                              : '⚠️ Không sao chép được, hãy giữ vào ô link để chép.';
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(done, fallback);
    else fallback();
  }

  function initForm() {
    var wishSel = document.getElementById('shWish');
    var custom = document.getElementById('shCustom');
    var songSel = document.getElementById('shSong');
    var preview = document.getElementById('shPreview');
    var error = document.getElementById('shError');
    var result = document.getElementById('shResult');
    var status = document.getElementById('shStatus');
    var link = '', current = null;

    GS.data.wishes.scrollWishes.forEach(function (w) {
      var o = document.createElement('option');
      o.value = w;
      o.textContent = w;
      wishSel.appendChild(o);
    });
    var own = document.createElement('option');
    own.value = '';
    own.textContent = '✏️ Tự viết lời chúc...';
    wishSel.appendChild(own);
    wishSel.addEventListener('change', function () {
      custom.hidden = wishSel.value !== '';
      if (!custom.hidden) custom.focus();
    });

    GS.music.songList().forEach(function (s) {
      var o = document.createElement('option');
      o.value = s.key;
      o.textContent = '🎵 ' + s.name;
      songSel.appendChild(o);
    });

    function previewing() { return GS.music.isPlaying() && GS.music.currentMelody() === songSel.value; }
    function updatePreview() { preview.textContent = previewing() ? '⏹ Dừng' : '▶ Nghe thử'; }
    preview.addEventListener('click', function () {
      if (previewing()) GS.music.setPlaying(false);
      else GS.music.playMelody(songSel.value);
      updatePreview();
    });
    songSel.addEventListener('change', function () {
      if (GS.music.isPlaying()) GS.music.playMelody(songSel.value);
      updatePreview();
    });
    document.getElementById('btnMusic').addEventListener('click', updatePreview);

    document.getElementById('shareForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var gift = {
        to: clean(document.getElementById('shTo').value, MAX_NAME),
        from: clean(document.getElementById('shFrom').value, MAX_NAME),
        wish: clean(wishSel.value || custom.value, MAX_WISH),
        song: songSel.value
      };
      var missing = !gift.to ? 'tên người nhận' : !gift.from ? 'tên của bạn' : !gift.wish ? 'lời chúc' : '';
      error.hidden = !missing;
      if (missing) { error.textContent = 'Bạn chưa nhập ' + missing + '.'; result.hidden = true; return; }
      current = gift;
      link = makeLink(gift);
      document.getElementById('shLink').value = link;
      document.getElementById('shOpen').href = link;
      status.textContent = 'Link đã sẵn sàng, bấm Sao chép hoặc Chia sẻ để gửi cho ' + gift.to + '.';
      result.hidden = false;
      GS.music.jingle();
    });

    document.getElementById('shCopy').addEventListener('click', function () { copyLink(link, status); });

    // Trên điện thoại, Chia sẻ mở bảng chọn ứng dụng (Zalo, Messenger...). Máy không hỗ trợ thì sao chép link.
    document.getElementById('shShare').addEventListener('click', function () {
      if (!navigator.share) return copyLink(link, status);
      navigator.share({
        title: 'Quà Giáng Sinh 🎁',
        text: '🎁 ' + current.from + ' gửi ' + current.to + ' một món quà Giáng Sinh, mở ra xem nhé!',
        url: link
      }).catch(function () { /* người dùng đóng bảng chia sẻ */ });
    });
  }

  function init() {
    initForm();
    if (incoming) openGift(incoming);
  }

  return {
    // Gọi trước khi khởi động các phần khác, để màn chào biết có cần bỏ qua không.
    parse: function () { incoming = parse(); return incoming; },
    hasGift: function () { return !!incoming; },
    init: init
  };
})();
