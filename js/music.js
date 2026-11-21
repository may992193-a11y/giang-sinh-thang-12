// 5 bài Giáng Sinh đã hết bản quyền, tiếng chuông và "Ho ho ho" bằng Web Audio; trình phát nhạc YouTube.
GS.music = (function () {
  // Đổi tên nốt (vd "F#4") sang tần số Hz.
  var STEPS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function freq(name) {
    var m = /^([A-G])(#|b)?(\d)$/.exec(name);
    var midi = 12 * (Number(m[3]) + 1) + STEPS[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  var JB = [['E4',1],['E4',1],['E4',2],['E4',1],['E4',1],['E4',2],['E4',1],['G4',1],['C4',1.5],['D4',0.5],['E4',4],
            ['F4',1],['F4',1],['F4',1.5],['F4',0.5],['F4',1],['E4',1],['E4',1],['E4',0.5],['E4',0.5]];
  var SN = [['G4',1.5],['A4',0.5],['G4',1],['E4',3]];
  var SN2 = [['A4',2],['A4',1],['C5',1.5],['B4',0.5],['A4',1]];
  var DK = [['G4',1.5],['F4',0.5],['E4',1],['D4',1],['C4',1],['D4',1],['E4',1],['C4',1],
            ['D4',0.5],['E4',0.5],['F4',0.5],['D4',0.5],['E4',1.5],['D4',0.5],['C4',1],['B3',1],['C4',2]];
  var OT = [['G3',1],['C4',0.75],['C4',0.25],['C4',1.5],['D4',0.5],['E4',0.75],['E4',0.25],['E4',1.5],['E4',0.5],
            ['D4',0.5],['E4',0.5],['F4',1],['B3',1],['D4',1],['C4',2]];

  // Các bài đều sáng tác từ thế kỷ 16–19, đã hết bản quyền.
  var SONGS = {
    jingle: { name: 'Jingle Bells', beat: 0.26, bells: true,
      notes: JB.concat([['E4',1],['D4',1],['D4',1],['E4',1],['D4',2],['G4',2]], JB, [['G4',1],['G4',1],['F4',1],['D4',1],['C4',4]]) },
    wewish: { name: 'We Wish You a Merry Christmas', beat: 0.3, bells: true,
      notes: [['D4',1],['G4',1],['G4',0.5],['A4',0.5],['G4',0.5],['F#4',0.5],['E4',1],['C4',1],['E4',1],
              ['A4',1],['A4',0.5],['B4',0.5],['A4',0.5],['G4',0.5],['F#4',1],['D4',1],['D4',1],
              ['B4',1],['B4',0.5],['C5',0.5],['B4',0.5],['A4',0.5],['G4',1],['E4',1],['D4',0.5],['D4',0.5],
              ['E4',1],['A4',1],['F#4',1],['G4',2]] },
    silent: { name: 'Silent Night (Đêm thánh vô cùng)', beat: 0.36, bells: false,
      notes: SN.concat(SN, [['D5',2],['D5',1],['B4',3],['C5',2],['C5',1],['G4',3]], SN2, SN, SN2, SN,
              [['D5',2],['D5',1],['F5',1.5],['D5',0.5],['B4',1],['C5',3],['E5',3],
               ['C5',1.5],['G4',0.5],['E4',1],['G4',1.5],['F4',0.5],['D4',1],['C4',6]]) },
    deck: { name: 'Deck the Halls', beat: 0.27, bells: true,
      notes: DK.concat(DK, [['D4',1.5],['E4',0.5],['F4',1],['D4',1],['E4',1.5],['F4',0.5],['G4',1],['D4',1],
              ['E4',0.5],['F#4',0.5],['G4',1],['A4',0.5],['B4',0.5],['C5',1],['B4',1],['A4',1],['G4',2],
              ['G4',1.5],['F4',0.5],['E4',1],['D4',1],['C4',1],['D4',1],['E4',1],['C4',1],
              ['A4',0.5],['A4',0.5],['A4',0.5],['A4',0.5],['G4',1.5],['F4',0.5],['E4',1],['D4',1],['C4',2]]) },
    tree: { name: 'O Christmas Tree', beat: 0.34, bells: false,
      notes: OT.concat([['G4',0.5],['G4',0.5],['E4',0.5],['A4',1.5],['G4',0.5],['G4',0.5],['F4',0.5],['F4',1.5],
              ['F4',0.5],['F4',0.5],['D4',0.5],['G4',1.5],['F4',0.5],['F4',0.5],['E4',1.5]], OT) }
  };
  var current = 'jingle';

  var ctx = null, master = null, playing = false, timer = null, index = 0, nextTime = 0;
  var MAX_GAIN = 0.5;
  var volume = 70, muted = false;   // 0–100, dùng chung cho Web Audio và YouTube

  function audio() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = effectiveVolume() / 100 * MAX_GAIN;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, start, dur, type, vol) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'triangle';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol || 0.5, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g).connect(master);
    o.start(start);
    o.stop(start + dur + 0.05);
  }

  // Tiếng chuông leng keng: vài sóng sin cao, tắt nhanh.
  function bell(start) {
    [2637, 3520, 4186].forEach(function (f, i) { tone(f, start, 0.35 - i * 0.08, 'sine', 0.08); });
  }

  function schedule() {
    var song = SONGS[current];
    while (nextTime < ctx.currentTime + 0.3) {
      var note = song.notes[index];
      var dur = note[1] * song.beat, f = freq(note[0]);
      tone(f, nextTime, dur * 0.9, 'triangle', 0.45);
      tone(f / 2, nextTime, dur * 0.9, 'sine', 0.2);
      if (song.bells && note[1] >= 1) bell(nextTime);
      nextTime += dur;
      index = (index + 1) % song.notes.length;
      if (index === 0) nextTime += song.beat * 2;
    }
  }

  function toggle() {
    if (!audio()) return false;
    playing = !playing;
    if (playing) {
      pauseYouTube();
      index = 0;
      nextTime = ctx.currentTime + 0.1;
      schedule();
      timer = setInterval(schedule, 100);
    } else {
      clearInterval(timer);
    }
    return playing;
  }

  function jingle() {
    if (!audio()) return;
    for (var i = 0; i < 4; i++) bell(ctx.currentTime + i * 0.12);
  }

  // "Ho ho ho": tiếng trầm, cao độ hạ dần, qua bộ lọc cho giống giọng nói.
  function hohoho() {
    if (!audio()) return;
    var t = ctx.currentTime;
    var filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 700;
    filter.Q.value = 6;
    filter.connect(master);
    for (var i = 0; i < 3; i++) {
      var s = t + i * 0.32;
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(150 - i * 6, s);
      o.frequency.exponentialRampToValueAtTime(100, s + 0.25);
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(0.9, s + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, s + 0.26);
      o.connect(g).connect(filter);
      o.start(s);
      o.stop(s + 0.3);
    }
  }

  // Tiếng vỗ tay: một chùm nhiễu trắng ngắn qua bộ lọc.
  function clap() {
    if (!audio()) return;
    var t = ctx.currentTime;
    for (var k = 0; k < 2; k++) {
      var len = Math.floor(ctx.sampleRate * 0.12);
      var buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
      var src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = buf;
      f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 0.8;
      g.gain.value = 1.4;
      src.connect(f).connect(g).connect(master);
      src.start(t + k * 0.012);
    }
  }

  function updateButton() {
    var btn = document.getElementById('btnMusic');
    if (btn) btn.textContent = playing ? '🔇 Tắt nhạc' : '🎵 Bật nhạc';
  }

  function setPlaying(on) {
    if (on !== playing) toggle();
    updateButton();
  }

  // Phát một bài cụ thể từ đầu (dùng cho Nghe thử và khi mở link quà).
  function playMelody(key) {
    if (!SONGS[key]) key = 'jingle';
    if (playing) setPlaying(false);
    current = key;
    setPlaying(true);
  }

  function songList() {
    return Object.keys(SONGS).map(function (k) { return { key: k, name: SONGS[k].name }; });
  }

  // ---------- Nhạc Giáng Sinh trên YouTube (trình phát nhúng chính thức) ----------
  var yt = { player: null, index: 0, playing: false, errors: 0, songs: [], group: 'all', query: '', shuffle: false };

  function loadYouTubeApi(cb) {
    if (window.YT && window.YT.Player) return cb();
    var prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () { if (prev) prev(); cb(); };
    if (!document.getElementById('ytApi')) {
      var s = document.createElement('script');
      s.id = 'ytApi';
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    }
  }

  // Bỏ dấu để tìm "ong gia noel" vẫn ra "Ông Già Noel".
  function plain(s) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();
  }

  // Chỉ số các bài đang hiện theo nhóm và từ khóa tìm kiếm.
  function visible() {
    var q = plain(yt.query.trim());
    var out = [];
    yt.songs.forEach(function (s, i) {
      if (yt.group !== 'all' && s.group !== yt.group) return;
      if (q && plain(s.title + ' ' + s.artist).indexOf(q) === -1) return;
      out.push(i);
    });
    return out;
  }

  // Bài kế tiếp (step = 1) hoặc bài trước (step = -1) trong danh sách đang hiện; bật Ngẫu nhiên thì chọn bừa.
  function step(dir) {
    var list = visible();
    if (!list.length) list = yt.songs.map(function (s, i) { return i; });
    if (yt.shuffle && list.length > 1) {
      var r;
      do { r = list[Math.floor(Math.random() * list.length)]; } while (r === yt.index);
      return playSong(r);
    }
    var pos = list.indexOf(yt.index);
    playSong(list[pos === -1 ? 0 : (pos + dir + list.length) % list.length]);
  }

  function renderSongs() {
    var list = document.getElementById('songList');
    var shown = visible();
    list.replaceChildren();
    document.getElementById('songCount').textContent = shown.length
      ? 'Có ' + shown.length + ' / ' + yt.songs.length + ' bài'
      : 'Không tìm thấy bài nào, thử từ khóa khác nhé.';
    shown.forEach(function (i) {
      var song = yt.songs[i];
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'song' + (i === yt.index && yt.player ? ' active' : '');
      var t = document.createElement('b');
      t.textContent = song.title;
      var a = document.createElement('span');
      a.textContent = song.artist;
      b.append(t, a);
      b.addEventListener('click', function () { playSong(i); });
      li.appendChild(b);
      list.appendChild(li);
    });
  }

  function showNow(text) {
    document.getElementById('ytNow').textContent = text;
  }

  function playSong(i) {
    yt.index = (i + yt.songs.length) % yt.songs.length;
    var song = yt.songs[yt.index];
    setPlaying(false);
    document.getElementById('ytBox').hidden = false;
    document.getElementById('ytBar').hidden = false;
    showNow('🎶 ' + song.title + ' – ' + song.artist);
    if (yt.player) {
      yt.player.loadVideoById(song.id);
    } else {
      loadYouTubeApi(function () {
        yt.player = new YT.Player('ytPlayer', {
          host: 'https://www.youtube-nocookie.com',
          width: '100%', height: '100%',
          videoId: yt.songs[yt.index].id,
          playerVars: { autoplay: 1, playsinline: 1, rel: 0 },
          events: {
            onReady: function (e) { e.target.setVolume(effectiveVolume()); e.target.playVideo(); },
            onStateChange: onYtState,
            onError: onYtError
          }
        });
      });
    }
    renderSongs();
  }

  function onYtState(e) {
    if (e.data === YT.PlayerState.PLAYING) {
      yt.playing = true;
      yt.errors = 0;
      setPlaying(false);
    } else if (e.data === YT.PlayerState.ENDED) {
      yt.playing = false;
      step(1);
    } else if (e.data === YT.PlayerState.PAUSED) {
      yt.playing = false;
    }
  }

  // Một số video bị chủ kênh chặn phát trên web khác: báo rồi chuyển bài.
  function onYtError() {
    yt.playing = false;
    yt.errors++;
    if (yt.errors >= yt.songs.length) return showNow('⚠️ Hiện không phát được bài nào, bạn thử lại sau nhé.');
    showNow('⚠️ Bài này không phát được ở đây, đang chuyển bài tiếp...');
    setTimeout(function () { step(1); }, 1500);
  }

  // ---------- Âm lượng ----------
  function effectiveVolume() { return muted ? 0 : volume; }

  function applyVolume() {
    var v = effectiveVolume();
    if (master) master.gain.setTargetAtTime(v / 100 * MAX_GAIN, ctx.currentTime, 0.05);
    if (yt.player && yt.player.setVolume) yt.player.setVolume(v);
    document.getElementById('volRange').value = volume;
    document.getElementById('volText').textContent = muted ? 'Tắt' : volume + '%';
    document.getElementById('volMute').textContent = muted || volume === 0 ? '🔇' : volume < 40 ? '🔉' : '🔊';
    GS.storage.set('volume', { value: volume, muted: muted });
  }

  function setVolume(v) {
    volume = Math.max(0, Math.min(100, Math.round(v / 5) * 5));
    if (volume > 0) muted = false;
    applyVolume();
  }

  function initVolume() {
    var saved = GS.storage.get('volume', null);
    if (saved) { volume = saved.value; muted = saved.muted; }
    applyVolume();
    document.getElementById('volRange').addEventListener('input', function (e) { setVolume(Number(e.target.value)); });
    document.getElementById('volDown').addEventListener('click', function () { setVolume(volume - 10); });
    document.getElementById('volUp').addEventListener('click', function () { setVolume(volume + 10); });
    document.getElementById('volMute').addEventListener('click', function () { muted = !muted; applyVolume(); });
  }

  function pauseYouTube() {
    if (yt.player && yt.player.pauseVideo && yt.playing) yt.player.pauseVideo();
  }

  function init() {
    document.getElementById('btnMusic').addEventListener('click', function () {
      toggle();
      if (playing) pauseYouTube();
      updateButton();
    });
    initVolume();
    yt.songs = (GS.data && GS.data.songs) || [];
    renderSongs();
    document.getElementById('ytPrev').addEventListener('click', function () { step(-1); });
    document.getElementById('ytNext').addEventListener('click', function () { step(1); });

    var tabs = document.querySelectorAll('#songTabs button');
    tabs.forEach(function (b) {
      b.addEventListener('click', function () {
        yt.group = b.dataset.group;
        tabs.forEach(function (x) { x.setAttribute('aria-selected', x === b); });
        renderSongs();
      });
    });
    document.getElementById('songSearch').addEventListener('input', function (e) {
      yt.query = e.target.value;
      renderSongs();
    });
    var shuffle = document.getElementById('songShuffle');
    shuffle.addEventListener('click', function () {
      yt.shuffle = !yt.shuffle;
      shuffle.setAttribute('aria-pressed', yt.shuffle);
      if (yt.shuffle && !yt.player) step(1);
    });
  }

  return {
    init: init, hohoho: hohoho, jingle: jingle, clap: clap,
    setPlaying: setPlaying, isPlaying: function () { return playing; },
    playMelody: playMelody, songList: songList, currentMelody: function () { return current; },
    isYouTubePlaying: function () { return yt.playing; }
  };
})();
