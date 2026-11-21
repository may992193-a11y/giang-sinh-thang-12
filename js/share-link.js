// Tạo thiệp và đường link lời chúc kèm nhạc để gửi bạn bè; đọc link khi người nhận mở.
// Lời chúc nằm ngay trong link, nên chạy được trên GitHub Pages mà không cần máy chủ.
// Dạng link: ?to=Lan&from=Thanh&w=3&m=silent-night&t=lang-tuyet  (lời chúc tự viết: wc=<mã hóa>)
// Nhạc YouTube: m=yt-<mã video>, chỉ nhận các bài có trong data/songs.json.
GS.share = (function () {
  var MAX_NAME = 30, MAX_WISH = 200, MAX_CODE = 2000;
  var SONG_SLUGS = {
    'jingle-bells': 'jingle', 'we-wish': 'wewish', 'silent-night': 'silent',
    'deck-the-halls': 'deck', 'o-christmas-tree': 'tree'
  };
  var incoming = null;

  // Bỏ ký tự điều khiển và ký tự đảo chiều chữ, gộp khoảng trắng, cắt theo độ dài tối đa.
  function clean(value, max) {
    if (typeof value !== 'string') return '';
    var s = value.replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩]/g, ' ')
                 .replace(/\s+/g, ' ').trim();
    return Array.from(s).slice(0, max).join('');
  }

  function encode(text) {
    var bytes = new TextEncoder().encode(text), bin = '';
    bytes.forEach(function (b) { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function decode(code) {
    if (!/^[A-Za-z0-9_-]+$/.test(code) || code.length > MAX_CODE) throw new Error('bad code');
    var b64 = code.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    var bin = atob(b64), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  }

  function slugOf(key) {
    for (var s in SONG_SLUGS) if (SONG_SLUGS[s] === key) return s;
    return 'jingle-bells';
  }

  function presets() { return GS.data.wishes.scrollWishes; }

  // Đọc thiệp từ link. Link hỏng hoặc bị sửa bậy thì bỏ qua, app chạy như bình thường.
  function parse() {
    try {
      var q = new URLSearchParams(location.search), gift;
      if (q.has('to')) {
        var wish = '';
        if (q.has('wc')) wish = decode(q.get('wc'));
        else {
          var n = parseInt(q.get('w'), 10);
          if (n >= 1 && n <= presets().length) wish = presets()[n - 1];
        }
        var m = q.get('m') || '';
        var song = m.indexOf('yt-') === 0 ? 'yt:' + m.slice(3) : SONG_SLUGS[m];
        gift = { to: q.get('to'), from: q.get('from'), wish: wish, song: song, tpl: q.get('t') };
      } else {
        // Link dạng cũ: #g=<JSON mã hóa>
        var m = /^#g=([A-Za-z0-9_-]+)$/.exec(location.hash);
        if (!m) return null;
        var d = JSON.parse(decode(m[1]));
        gift = { to: d.t, from: d.f, wish: d.w, song: d.s, tpl: 'co-dien' };
      }
      gift = {
        to: clean(gift.to, MAX_NAME), from: clean(gift.from, MAX_NAME), wish: clean(gift.wish, MAX_WISH),
        song: typeof gift.song === 'string' ? gift.song : '', tpl: GS.card.validTemplate(gift.tpl)
      };
      if (!GS.music.isValidChoice(gift.song)) gift.song = 'jingle';
      return gift.to && gift.from && gift.wish ? gift : null;
    } catch (e) {
      return null;
    }
  }

  function makeLink(gift) {
    var q = new URLSearchParams();
    q.set('to', gift.to);
    q.set('from', gift.from);
    var idx = presets().indexOf(gift.wish);
    if (idx >= 0) q.set('w', idx + 1); else q.set('wc', encode(gift.wish));
    q.set('m', gift.song.indexOf('yt:') === 0 ? 'yt-' + gift.song.slice(3) : slugOf(gift.song));
    q.set('t', gift.tpl);
    return location.origin + location.pathname + '?' + q.toString();
  }

  // Người nhận bấm "Tạo thiệp của bạn": điền sẵn form để gửi lại.
  function prefillReply(gift) {
    var note = document.getElementById('replyNote');
    note.textContent = '💌 ' + gift.from + ' gửi bạn: "' + gift.wish + '". Tạo thiệp gửi lại cho ' + gift.from + ' nhé!';
    note.hidden = false;
    document.getElementById('shTo').value = gift.from;
    document.getElementById('shFrom').value = gift.to;
    document.getElementById('shTo').dispatchEvent(new Event('input', { bubbles: true }));
    document.getElementById('shareCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function copyLink(url, status) {
    var ok = '✅ Đã sao chép link! Dán vào Zalo hoặc Messenger để gửi nhé.';
    var fallback = function () {
      var input = document.getElementById('shLink');
      input.focus();
      input.select();
      var done = false;
      try { done = document.execCommand('copy'); } catch (e) { /* trình duyệt chặn */ }
      status.textContent = done ? ok : '⚠️ Không sao chép được, hãy giữ vào ô link để chép.';
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(function () { status.textContent = ok; }, fallback);
    } else fallback();
  }

  // ---------- Người gửi: khu Tạo thiệp ----------
  function initForm() {
    var form = document.getElementById('shareForm');
    var toEl = document.getElementById('shTo');
    var fromEl = document.getElementById('shFrom');
    var wishEl = document.getElementById('shWish');
    var count = document.getElementById('shCount');
    var songSel = document.getElementById('shSong');
    var preview = document.getElementById('shPreview');
    var error = document.getElementById('shError');
    var result = document.getElementById('shResult');
    var status = document.getElementById('shStatus');
    var pngBtn = document.getElementById('shPng');
    var tpl = 'co-dien', link = '', current = null, lastSuggest = -1;

    var card = GS.card.build();
    document.getElementById('shPreviewCard').appendChild(card);

    function data() {
      return {
        to: clean(toEl.value, MAX_NAME), from: clean(fromEl.value, MAX_NAME),
        wish: clean(wishEl.value, MAX_WISH), song: songSel.value, tpl: tpl
      };
    }

    // Xem trước: tấm thiệp cập nhật ngay khi gõ, đúng như người nhận sẽ thấy.
    function refresh() {
      count.textContent = Array.from(wishEl.value).length + '/' + MAX_WISH;
      GS.card.fill(card, data());
      result.hidden = true;
    }

    // 3 mẫu thiệp
    var pick = document.getElementById('shTpl');
    GS.card.TEMPLATES.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tpl-btn tpl-' + t.key;
      b.setAttribute('role', 'radio');
      b.dataset.tpl = t.key;
      b.textContent = t.name;
      b.addEventListener('click', function () {
        tpl = t.key;
        pick.querySelectorAll('.tpl-btn').forEach(function (x) { x.setAttribute('aria-checked', x === b); });
        refresh();
      });
      pick.appendChild(b);
    });
    pick.firstChild.setAttribute('aria-checked', 'true');

    document.getElementById('shSuggest').addEventListener('click', function () {
      var list = presets(), i;
      do { i = Math.floor(Math.random() * list.length); } while (i === lastSuggest && list.length > 1);
      lastSuggest = i;
      wishEl.value = list[i];
      refresh();
    });
    wishEl.value = presets()[0];

    GS.music.fillSongSelect(songSel);

    // Nghe thử: nhạc chuông phát bằng Web Audio, bài YouTube phát trong khung video nhỏ ngay dưới.
    var ytBox = document.getElementById('shYt');
    function ytId() { return songSel.value.indexOf('yt:') === 0 ? songSel.value.slice(3) : null; }
    function previewing() {
      return ytId() ? GS.music.isYouTubePlayingIn('shYtPlayer')
                    : GS.music.isPlaying() && GS.music.currentMelody() === songSel.value;
    }
    function updatePreview() { preview.textContent = previewing() ? '⏹ Dừng' : '▶ Nghe thử'; }
    function playChoice() {
      if (ytId()) {
        ytBox.hidden = false;
        GS.music.playYouTubeIn('shYtPlayer', ytId(), {
          onError: function () { status.textContent = ''; error.hidden = false; error.textContent = 'Bài YouTube này không phát được trên web khác, bạn chọn bài khác nhé.'; }
        });
      } else {
        GS.music.stopYouTubeIn('shYtPlayer');
        ytBox.hidden = true;
        GS.music.playMelody(songSel.value);
      }
    }
    preview.addEventListener('click', function () {
      if (previewing()) {
        GS.music.setPlaying(false);
        GS.music.stopYouTubeIn('shYtPlayer');
      } else playChoice();
      // YouTube cần vài giây để tải, nên cập nhật nút thêm vài lần.
      [400, 1500, 3000].forEach(function (ms) { setTimeout(updatePreview, ms); });
      updatePreview();
    });
    songSel.addEventListener('change', function () {
      error.hidden = true;
      if (GS.music.isPlaying() || GS.music.isYouTubePlayingIn('shYtPlayer') || !ytBox.hidden) playChoice();
      updatePreview();
      setTimeout(updatePreview, 1500);
      result.hidden = true;
    });
    document.getElementById('btnMusic').addEventListener('click', updatePreview);

    [toEl, fromEl, wishEl].forEach(function (el) { el.addEventListener('input', refresh); });
    refresh();

    function check(d) {
      var missing = !d.to ? 'tên người nhận' : !d.from ? 'tên của bạn' : !d.wish ? 'lời chúc' : '';
      error.hidden = !missing;
      error.textContent = missing ? 'Bạn chưa nhập ' + missing + '.' : '';
      return !missing;
    }

    // Gửi lời chúc: ông già Noel đọc lời chúc và tạo bất ngờ, xong mới hiện link.
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = data();
      if (!check(d)) return;
      current = d;
      link = makeLink(d);
      playChoice();
      updatePreview();
      GS.santa.deliver(d.to, d.wish, function () {
        document.getElementById('shLink').value = link;
        document.getElementById('shOpen').href = link;
        status.textContent = 'Link thiệp đã sẵn sàng, bấm Sao chép hoặc Chia sẻ để gửi cho ' + d.to + '.';
        result.hidden = false;
        result.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, d.from);
    });

    pngBtn.addEventListener('click', function () {
      var d = data();
      if (!check(d)) return;
      pngBtn.disabled = true;
      GS.card.download(d).then(function () { pngBtn.disabled = false; });
    });

    document.getElementById('shCopy').addEventListener('click', function () { copyLink(link, status); });

    // Trên điện thoại, Chia sẻ mở bảng chọn ứng dụng (Zalo, Messenger...). Máy không hỗ trợ thì sao chép link.
    document.getElementById('shShare').addEventListener('click', function () {
      if (!navigator.share) return copyLink(link, status);
      navigator.share({
        title: 'Thiệp Giáng Sinh 🎄',
        text: '💌 ' + current.from + ' gửi ' + current.to + ' một tấm thiệp Giáng Sinh, mở ra xem nhé!',
        url: link
      }).catch(function () { /* người dùng đóng bảng chia sẻ */ });
    });
  }

  function init() {
    initForm();
    if (incoming) GS.card.open(incoming, prefillReply);
  }

  return {
    // Gọi trước khi khởi động các phần khác, để màn chào biết có cần bỏ qua không.
    parse: function () { incoming = parse(); return incoming; },
    hasGift: function () { return !!incoming; },
    init: init
  };
})();
