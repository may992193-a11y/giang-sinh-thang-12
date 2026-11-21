// Nhạc Jingle Bells (1857, hết bản quyền), tiếng chuông và "Ho ho ho" bằng Web Audio.
GS.music = (function () {
  var N = { C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, C5: 523.25 };
  var A = [['E4',1],['E4',1],['E4',2],['E4',1],['E4',1],['E4',2],['E4',1],['G4',1],['C4',1.5],['D4',0.5],['E4',4],
           ['F4',1],['F4',1],['F4',1.5],['F4',0.5],['F4',1],['E4',1],['E4',1],['E4',0.5],['E4',0.5]];
  var MELODY = A.concat([['E4',1],['D4',1],['D4',1],['E4',1],['D4',2],['G4',2]])
                .concat(A, [['G4',1],['G4',1],['F4',1],['D4',1],['C4',4]]);
  var BEAT = 0.26;

  var ctx = null, master = null, playing = false, timer = null, index = 0, nextTime = 0;

  function audio() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.35;
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
    while (nextTime < ctx.currentTime + 0.3) {
      var note = MELODY[index];
      var dur = note[1] * BEAT;
      tone(N[note[0]], nextTime, dur * 0.9, 'triangle', 0.45);
      tone(N[note[0]] / 2, nextTime, dur * 0.9, 'sine', 0.2);
      if (note[1] >= 1) bell(nextTime);
      nextTime += dur;
      index = (index + 1) % MELODY.length;
      if (index === 0) nextTime += BEAT * 2;
    }
  }

  function toggle() {
    if (!audio()) return false;
    playing = !playing;
    if (playing) {
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

  function init() {
    var btn = document.getElementById('btnMusic');
    btn.addEventListener('click', function () {
      var on = toggle();
      btn.textContent = on ? '🔇 Tắt nhạc' : '🎵 Bật nhạc';
    });
  }

  return { init: init, hohoho: hohoho, jingle: jingle };
})();
