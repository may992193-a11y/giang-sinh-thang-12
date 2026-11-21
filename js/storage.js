// Đọc/ghi localStorage an toàn: app vẫn chạy khi trình duyệt chặn lưu trữ.
window.GS = window.GS || {};

GS.storage = (function () {
  var PREFIX = 'gs12_';
  var memory = {};

  function get(key, fallback) {
    try {
      var raw = localStorage.getItem(PREFIX + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
      return key in memory ? memory[key] : fallback;
    }
  }

  function set(key, value) {
    memory[key] = value;
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (e) { /* bị chặn: giữ trong bộ nhớ tạm */ }
  }

  return { get: get, set: set };
})();
