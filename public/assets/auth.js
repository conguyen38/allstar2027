/*
 * Allstar Club – đăng nhập tài khoản cá nhân.
 *
 * !!! BẢN MOCK !!!  Tài khoản và mật khẩu đang lưu trong localStorage của trình duyệt,
 * KHÔNG an toàn cho dữ liệu thật. Toàn bộ UI chỉ gọi object `api` bên dưới; khi có
 * backend, thay 4 hàm trong `api` bằng fetch tới server (xem hợp đồng ở từng hàm).
 */
(function () {
  var USERS_KEY = 'allstar_mock_users_v6';
  var SESSION_KEY = 'allstar_mock_session_v6';
  var WARN_KEY = 'allstar_mock_warn_seen_v6_';
  var MIN_PASSWORD = 8;
  var ALL_ID = 'all';

  /* ───────────── Dữ liệu mẫu (chỉ để demo) ─────────────
   * Hai chương trình có thể lệ khác nhau (xem /prm/the-le/ và /sih/the-le/):
   *  PRM: kỳ theo quý (Q1–Q4); điểm = GMV + Refer + OneHub; bonus theo mốc điểm;
   *       chi trả 80% theo quý, 20% tạm khóa theo H1/H2.
   *  SIH: kỳ theo nửa năm (H1/H2); điểm = GMV × hệ số vai trò (SA 0.8, SM 0.2);
   *       bonus theo mốc GMV chỉ cho SA; quy đổi theo xếp loại hiệu quả công việc;
   *       chi trả 80% sau đánh giá, 20% tạm khóa.
   * Dữ liệu thô bên dưới là thứ server sẽ trả về; các con số dẫn xuất (tổng, 80/20,
   * U-Point) được tính ở buildView().
   *
   * Mỗi kỳ có `from`/`to` (trạng thái "đang diễn ra / đã hoàn thành" suy ra từ ngày này) và
   * `units` = các căn ghi nhận trong kỳ:
   *   PRM: [mã căn, dự án, điểm, đã chi trả (1/0)]
   *   SIH: [mã căn, dự án, GMV tỷ, đã chi trả (1/0), SA ghi nhận (chỉ để SM xem)]
   * `membership.monthsNoHbk` = số tháng liên tiếp chưa phát sinh HBK (dùng cho cảnh báo duy trì). */
  var PRM_TIERS = [
    { at: 10, bonus: 5 }, { at: 18, bonus: 8 }, { at: 32, bonus: 12 }, { at: 80, bonus: 40 },
    { at: 150, bonus: 32 }, { at: 320, bonus: 68 }, { at: 680, bonus: 138 },
  ];
  var SIH_TIERS = [
    { at: 32, bonus: 5 }, { at: 80, bonus: 10 }, { at: 150, bonus: 20 }, { at: 320, bonus: 30 }, { at: 680, bonus: 60 },
  ];
  var SIH_RATES = { SA: 0.8, SM: 0.2 };
  var SIH_RATINGS = {
    A1: { label: 'Vượt trội', factor: 1.1 },
    A2: { label: 'Xuất sắc', factor: 1.05 },
    A3: { label: 'Đạt yêu cầu', factor: 1 },
    B: { label: 'Cần cải thiện', factor: 0.8 },
    C: { label: 'Không đạt yêu cầu', factor: 0 },
  };
  // Gamification "hành trình du lịch" (PRM, theo nửa năm). CÁC SỐ NÀY LÀ GIÁ TRỊ MẪU – thay bằng quy tắc thật.
  // Mỗi chương trình có thang điểm khác nhau nên quy tắc vé cũng khác: PRM 10 điểm = 1 vé (cần 3 vé), SIH 20 điểm = 1 vé (cần 4 vé).
  var JOURNEY_RULES = { PRM: { ticket: 10, min: 3 }, SIH: { ticket: 20, min: 4 } };
  var MIN_POINTS = 5;       // dưới mức này bị cảnh báo duy trì thành viên
  var MAX_MONTHS_NO_HBK = 6; // quá số tháng liên tiếp không có HBK thì bị cảnh báo
  var LOCK_H1 = '20% tạm khóa H1, giải tỏa theo thể lệ nếu Quý 3 (hoặc Quý 4) phát sinh ít nhất 1 HBK.';
  var LOCK_H2 = '20% tạm khóa H2, giải tỏa theo thể lệ nếu Quý 1/2027 (hoặc Quý 2/2027) phát sinh ít nhất 1 HBK.';
  var LOCK_SIH = '20% tạm khóa, giải tỏa theo thể lệ nếu kỳ kế tiếp phát sinh ít nhất 1 HBK.';

  var SEED = [
    {
      email: 'demo.newuser@example.com',
      name: 'Nguyễn Văn A',
      tempPassword: 'Allstar@2026',
      mustChange: true, // PRM, chưa đổi mật khẩu lần đầu
      profile: { program: 'PRM', role: 'LLTV', area: 'Miền Bắc', branch: 'Techcombank Hội sở' },
      membership: { monthsNoHbk: 7 }, // đủ điều kiện để test cảnh báo "không phát sinh HBK"
      periods: [
        { id: 'q1-25', label: 'Quý 1/2025', from: '2025-01-01', to: '2025-03-31', rank: 30, gmvPoints: 6, referPoints: 0.3, onehubPoints: 0.2, bonusPoints: 0, payoutDate: '15/05/2025', lockNote: LOCK_H1, updatedAt: '2025-04-05T09:00:00+07:00',
          units: [['TCB-2501', 'Vinhomes Ocean Park', 3.5, 1], ['TCB-2507', 'Ecopark', 2.5, 1]] },
        { id: 'q2-25', label: 'Quý 2/2025', from: '2025-04-01', to: '2025-06-30', rank: 27, gmvPoints: 8, referPoints: 0.5, onehubPoints: 0.4, bonusPoints: 0, payoutDate: '15/08/2025', lockNote: LOCK_H1, updatedAt: '2025-07-05T09:00:00+07:00',
          units: [['TCB-2512', 'Masteri Centre Point', 5, 1], ['TCB-2518', 'Sun Grand City', 3, 1]] },
        { id: 'q3-25', label: 'Quý 3/2025', from: '2025-07-01', to: '2025-09-30', rank: 22, gmvPoints: 11, referPoints: 0.8, onehubPoints: 0.6, bonusPoints: 5, payoutDate: '15/11/2025', lockNote: LOCK_H2, updatedAt: '2025-10-05T09:00:00+07:00',
          units: [['TCB-2531', 'The Global City', 6, 1], ['TCB-2536', 'Vinhomes Grand Park', 5, 1]] },
        { id: 'q4-25', label: 'Quý 4/2025', from: '2025-10-01', to: '2025-12-31', rank: 19, gmvPoints: 14, referPoints: 1.2, onehubPoints: 0.9, bonusPoints: 5, payoutDate: '15/02/2026', lockNote: LOCK_H2, updatedAt: '2026-01-05T09:00:00+07:00',
          units: [['TCB-2544', 'Masterise Grand Marina', 8, 1], ['TCB-2549', 'Ecopark', 6, 1]] },
        { id: 'q1', label: 'Quý 1/2026', from: '2026-01-01', to: '2026-03-31', rank: 21, gmvPoints: 9, referPoints: 0.7, onehubPoints: 0.5, bonusPoints: 5, payoutDate: '15/05/2026', lockNote: LOCK_H1, updatedAt: '2026-04-05T09:00:00+07:00',
          units: [['TCB-0101', 'Vinhomes Ocean Park', 4, 1], ['TCB-0107', 'Masterise Grand Marina', 3, 1], ['TCB-0115', 'The Global City', 2, 1]] },
        { id: 'q2', label: 'Quý 2/2026', from: '2026-04-01', to: '2026-06-30', rank: 15, gmvPoints: 16.5, referPoints: 1.5, onehubPoints: 0.9, bonusPoints: 13, payoutDate: '15/08/2026', lockNote: LOCK_H1, updatedAt: '2026-07-05T09:00:00+07:00',
          units: [['TCB-0204', 'Vinhomes Smart City', 6, 1], ['TCB-0211', 'Ecopark', 5.5, 1], ['TCB-0219', 'Masteri Centre Point', 5, 1]] },
        { id: 'q3', label: 'Quý 3/2026', from: '2026-07-01', to: '2026-09-30', rank: 12, gmvPoints: 24.6, referPoints: 3, onehubPoints: 1.8, bonusPoints: 13, payoutDate: '15/11/2026', lockNote: LOCK_H2, updatedAt: '2026-10-05T09:00:00+07:00',
          units: [['TCB-0302', 'The Global City', 8.6, 1], ['TCB-0309', 'Vinhomes Grand Park', 9, 1], ['TCB-0318', 'Sun Grand City', 7, 0]] },
        { id: 'q4', label: 'Quý 4/2026', from: '2026-10-01', to: '2026-12-31', rank: 14, gmvPoints: 20.5, referPoints: 2, onehubPoints: 1.2, bonusPoints: 13, payoutDate: '15/02/2027', lockNote: LOCK_H2, updatedAt: '2026-10-25T09:00:00+07:00',
          units: [['TCB-0401', 'Masterise Grand Marina', 7.5, 1], ['TCB-0406', 'Vinhomes Ocean Park', 6, 0], ['TCB-0412', 'Ecopark', 4, 0], ['TCB-0420', 'Sun Grand City', 3, 0]] },
      ],
    },
    {
      email: 'demo.active@example.com',
      name: 'Trần Thị B',
      tempPassword: 'Allstar@2026',
      mustChange: false, // SIH vai trò SA, đã đổi mật khẩu rồi
      profile: { program: 'SIH', role: 'SA', team: 'Team HCM' },
      membership: { monthsNoHbk: 0 },
      periods: [
        { id: 'h1-25', label: 'H1/2025', from: '2025-01-01', to: '2025-06-30', rank: 8, gmv: 60, bonusPoints: 5, rating: 'A3', lockNote: LOCK_SIH, updatedAt: '2025-08-20T09:00:00+07:00',
          units: [['OH-2501', 'Vinhomes Grand Park', 40, 1], ['OH-2509', 'Sun Urban City', 20, 1]] },
        { id: 'h2-25', label: 'H2/2025', from: '2025-07-01', to: '2025-12-31', rank: 6, gmv: 85, bonusPoints: 10, rating: 'A2', lockNote: LOCK_SIH, updatedAt: '2026-02-20T09:00:00+07:00',
          units: [['OH-2521', 'Masteri Centre Point', 50, 1], ['OH-2530', 'The Global City', 35, 1]] },
        { id: 'h1', label: 'H1/2026', from: '2026-01-01', to: '2026-06-30', rank: 5, gmv: 95, bonusPoints: 10, rating: 'A2', lockNote: LOCK_SIH, updatedAt: '2026-08-20T09:00:00+07:00',
          units: [['OH-1001', 'Vinhomes Grand Park', 40, 1], ['OH-1008', 'Masteri Centre Point', 35, 1], ['OH-1016', 'Sun Urban City', 20, 1]] },
        { id: 'h2', label: 'H2/2026', from: '2026-07-01', to: '2026-12-31', rank: 3, gmv: 140, bonusPoints: 10, rating: null, lockNote: LOCK_SIH, updatedAt: '2026-10-25T09:00:00+07:00',
          units: [['OH-2003', 'Vinhomes Ocean Park', 60, 1], ['OH-2011', 'The Global City', 45, 0], ['OH-2019', 'Sun Urban City', 25, 0], ['OH-2024', 'Masteri Centre Point', 10, 0]] },
      ],
    },
    {
      email: 'demo.sm@example.com',
      name: 'Lê Văn C',
      tempPassword: 'Allstar@2026',
      mustChange: false, // SIH vai trò SM (không có bonus vượt mốc)
      profile: { program: 'SIH', role: 'SM', team: 'Team Hà Nội' },
      membership: { monthsNoHbk: 0 },
      periods: [
        { id: 'h1-25', label: 'H1/2025', from: '2025-01-01', to: '2025-06-30', rank: 12, gmv: 150, bonusPoints: 0, rating: 'A3', lockNote: LOCK_SIH, updatedAt: '2025-08-20T09:00:00+07:00',
          units: [['HN-2501', 'Vinhomes Smart City', 90, 1, 'Phạm Quốc D'], ['HN-2509', 'Ecopark', 60, 1, 'Võ Minh E']] },
        { id: 'h2-25', label: 'H2/2025', from: '2025-07-01', to: '2025-12-31', rank: 10, gmv: 180, bonusPoints: 0, rating: 'A3', lockNote: LOCK_SIH, updatedAt: '2026-02-20T09:00:00+07:00',
          units: [['HN-2521', 'Masteri West Heights', 100, 1, 'Phạm Quốc D'], ['HN-2530', 'Vinhomes Smart City', 80, 1, 'Trần Thị B']] },
        { id: 'h1', label: 'H1/2026', from: '2026-01-01', to: '2026-06-30', rank: 9, gmv: 210, bonusPoints: 0, rating: 'A3', lockNote: LOCK_SIH, updatedAt: '2026-08-20T09:00:00+07:00',
          units: [['HN-0201', 'Vinhomes Smart City', 90, 1, 'Phạm Quốc D'], ['HN-0210', 'Ecopark', 70, 1, 'Võ Minh E'], ['HN-0222', 'Masteri West Heights', 50, 1, 'Trần Thị B']] },
        { id: 'h2', label: 'H2/2026', from: '2026-07-01', to: '2026-12-31', rank: 7, gmv: 95, bonusPoints: 0, rating: null, lockNote: LOCK_SIH, updatedAt: '2026-10-25T09:00:00+07:00',
          units: [['HN-0301', 'Vinhomes Smart City', 45, 1, 'Phạm Quốc D'], ['HN-0309', 'Ecopark', 30, 0, 'Võ Minh E'], ['HN-0317', 'Masteri West Heights', 20, 0, 'Trần Thị B']] },
      ],
    },
    {
      email: 'demo.low@example.com',
      name: 'Phạm Thị D',
      tempPassword: 'Allstar@2026',
      mustChange: false, // PRM, điểm lũy kế dưới 5 → để test cảnh báo "dưới 5 điểm"
      profile: { program: 'PRM', role: 'LLTV', area: 'Miền Nam', branch: 'Techcombank Chi nhánh Sài Gòn' },
      membership: { monthsNoHbk: 3 },
      periods: [
        { id: 'q1-25', label: 'Quý 1/2025', from: '2025-01-01', to: '2025-03-31', rank: 90, gmvPoints: 1, referPoints: 0, onehubPoints: 0, bonusPoints: 0, payoutDate: '15/05/2025', lockNote: LOCK_H1, updatedAt: '2025-04-05T09:00:00+07:00',
          units: [['TCB-2511', 'The Global City', 1, 1]] },
        { id: 'q2-25', label: 'Quý 2/2025', from: '2025-04-01', to: '2025-06-30', rank: 88, gmvPoints: 0.5, referPoints: 0, onehubPoints: 0, bonusPoints: 0, payoutDate: '15/08/2025', lockNote: LOCK_H1, updatedAt: '2025-07-05T09:00:00+07:00',
          units: [['TCB-2512', 'Ecopark', 0.5, 1]] },
        { id: 'q3-25', label: 'Quý 3/2025', from: '2025-07-01', to: '2025-09-30', rank: 79, gmvPoints: 2, referPoints: 0, onehubPoints: 0.2, bonusPoints: 0, payoutDate: '15/11/2025', lockNote: LOCK_H2, updatedAt: '2025-10-05T09:00:00+07:00',
          units: [['TCB-2531', 'Vinhomes Ocean Park', 2, 1]] },
        { id: 'q4-25', label: 'Quý 4/2025', from: '2025-10-01', to: '2025-12-31', rank: 70, gmvPoints: 3, referPoints: 0.3, onehubPoints: 0, bonusPoints: 0, payoutDate: '15/02/2026', lockNote: LOCK_H2, updatedAt: '2026-01-05T09:00:00+07:00',
          units: [['TCB-2544', 'Sun Grand City', 3, 1]] },
        { id: 'q1', label: 'Quý 1/2026', from: '2026-01-01', to: '2026-03-31', rank: 80, gmvPoints: 0, referPoints: 0, onehubPoints: 0, bonusPoints: 0, payoutDate: '15/05/2026', lockNote: LOCK_H1, updatedAt: '2026-04-05T09:00:00+07:00', units: [] },
        { id: 'q2', label: 'Quý 2/2026', from: '2026-04-01', to: '2026-06-30', rank: 74, gmvPoints: 0, referPoints: 0, onehubPoints: 0.2, bonusPoints: 0, payoutDate: '15/08/2026', lockNote: LOCK_H1, updatedAt: '2026-07-05T09:00:00+07:00', units: [] },
        { id: 'q3', label: 'Quý 3/2026', from: '2026-07-01', to: '2026-09-30', rank: 61, gmvPoints: 1.5, referPoints: 0, onehubPoints: 0.3, bonusPoints: 0, payoutDate: '15/11/2026', lockNote: LOCK_H2, updatedAt: '2026-10-05T09:00:00+07:00',
          units: [['TCB-0501', 'Vinhomes Ocean Park', 1.5, 1]] },
        { id: 'q4', label: 'Quý 4/2026', from: '2026-10-01', to: '2026-12-31', rank: 58, gmvPoints: 2, referPoints: 0, onehubPoints: 0.5, bonusPoints: 0, payoutDate: '15/02/2027', lockNote: LOCK_H2, updatedAt: '2026-10-25T09:00:00+07:00',
          units: [['TCB-0602', 'The Global City', 2, 0]] },
      ],
    },
  ];

  /* ───────────── Tiện ích ───────────── */
  function read(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* bỏ qua */ }
  }
  function sha256(text) {
    if (!(window.crypto && crypto.subtle)) return Promise.resolve('plain:' + text);
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (buf) {
      return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    });
  }
  function delay(value) {
    return new Promise(function (resolve) { setTimeout(function () { resolve(value); }, 350); });
  }
  function fail(message) {
    return delay(null).then(function () { throw new Error(message); });
  }
  function normEmail(email) { return String(email || '').trim().toLowerCase(); }
  function publicUser(user) {
    return { email: user.email, name: user.name, profile: user.profile, membership: user.membership, periods: user.periods };
  }

  // Dữ liệu lưu từ phiên bản cũ (thiếu ngày kỳ, thiếu hồ sơ…) sẽ làm trang tài khoản lỗi giữa chừng → nạp lại từ dữ liệu mẫu.
  function validUsers(users) {
    return Array.isArray(users) && users.length > 0 && users.every(function (u) {
      return u && u.passHash && u.profile && u.membership && Array.isArray(u.periods) && u.periods.length > 0 &&
        u.periods.every(function (p) { return p && p.from && p.to && Array.isArray(p.units); });
    });
  }

  function loadUsers() {
    var users = read(USERS_KEY);
    if (validUsers(users)) return Promise.resolve(users);
    return Promise.all(SEED.map(function (seed) {
      return sha256(seed.email + ':' + seed.tempPassword).then(function (hash) {
        return { email: seed.email, name: seed.name, passHash: hash, mustChange: seed.mustChange, profile: seed.profile, membership: seed.membership, periods: seed.periods };
      });
    })).then(function (list) { write(USERS_KEY, list); return list; });
  }

  /* ───────────── API (thay phần này bằng backend thật) ───────────── */
  var api = {
    /** POST /api/login {email,password} -> { mustChange:boolean, user? }  (lỗi: 401) */
    login: function (email, password) {
      email = normEmail(email);
      return Promise.all([loadUsers(), sha256(email + ':' + password)]).then(function (res) {
        var user = res[0].filter(function (u) { return u.email === email; })[0];
        if (!user || user.passHash !== res[1]) return fail('Email hoặc mật khẩu không đúng.');
        if (user.mustChange) return delay({ mustChange: true });
        write(SESSION_KEY, { email: user.email, name: user.name, program: user.profile.program });
        return delay({ mustChange: false, user: publicUser(user) });
      });
    },
    /** POST /api/change-password {email,currentPassword,newPassword} -> { user }  (đặt session) */
    changePassword: function (email, currentPassword, newPassword) {
      email = normEmail(email);
      return Promise.all([loadUsers(), sha256(email + ':' + currentPassword), sha256(email + ':' + newPassword)]).then(function (res) {
        var users = res[0];
        var user = users.filter(function (u) { return u.email === email; })[0];
        if (!user || user.passHash !== res[1]) return fail('Phiên đổi mật khẩu không hợp lệ, vui lòng đăng nhập lại.');
        user.passHash = res[2];
        user.mustChange = false;
        write(USERS_KEY, users);
        write(SESSION_KEY, { email: user.email, name: user.name, program: user.profile.program });
        return delay({ user: publicUser(user) });
      });
    },
    /** GET /api/me -> { user } hoặc null nếu chưa đăng nhập */
    me: function () {
      var session = read(SESSION_KEY);
      if (!session) return Promise.resolve(null);
      return loadUsers().then(function (users) {
        var user = users.filter(function (u) { return u.email === session.email; })[0];
        return user ? publicUser(user) : null;
      });
    },
    /** POST /api/logout */
    logout: function () {
      try { localStorage.removeItem(SESSION_KEY); } catch (e) { /* bỏ qua */ }
      return Promise.resolve();
    },
  };

  /* ───────────── Header + modal ───────────── */
  var modal, loginForm, changeForm, pending = null, lastFocus = null;

  function $(selector, root) { return (root || document).querySelector(selector); }
  function $all(selector) { return Array.prototype.slice.call(document.querySelectorAll(selector)); }

  function showError(form, message) {
    var box = $('.auth-error', form);
    box.textContent = message || '';
    box.classList.toggle('hidden', !message);
  }
  function setBusy(form, busy) {
    var btn = $('button[type="submit"]', form);
    btn.disabled = busy;
  }
  function showView(name) {
    loginForm.classList.toggle('hidden', name !== 'login');
    changeForm.classList.toggle('hidden', name !== 'change');
    showError(loginForm, '');
    showError(changeForm, '');
    var focusTarget = name === 'login' ? $('#auth-email') : $('#auth-new-password');
    if (focusTarget) focusTarget.focus();
  }
  function openModal() {
    if (!modal) return;
    lastFocus = document.activeElement;
    pending = null;
    loginForm.reset();
    changeForm.reset();
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    showView('login');
  }
  function closeModal() {
    if (!modal) return;
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    pending = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  // Mỗi chương trình có trang tài khoản riêng: /prm/tai-khoan/ và /sih/tai-khoan/.
  function accountUrl(user) {
    return '/' + (user && user.profile ? user.profile.program.toLowerCase() : 'prm') + '/tai-khoan/';
  }

  function renderHeader(user) {
    $all('[data-auth="guest"]').forEach(function (el) { el.classList.toggle('hidden', !!user); });
    $all('[data-auth="user"]').forEach(function (el) {
      el.classList.toggle('hidden', !user);
      el.classList.toggle('flex', !!user);
    });
    $all('[data-auth-name]').forEach(function (el) { el.textContent = user ? user.name : ''; });
    $all('[data-auth-account-link]').forEach(function (el) { el.setAttribute('href', accountUrl(user)); });
  }

  function validateNewPassword(newPw, confirmPw, currentPw) {
    if (newPw.length < MIN_PASSWORD) return 'Mật khẩu cần tối thiểu ' + MIN_PASSWORD + ' ký tự.';
    if (!/[A-Za-z]/.test(newPw) || !/\d/.test(newPw)) return 'Mật khẩu cần có cả chữ và số.';
    if (newPw === currentPw) return 'Mật khẩu mới phải khác mật khẩu được cấp.';
    if (newPw !== confirmPw) return 'Hai mật khẩu nhập vào chưa khớp.';
    return '';
  }

  function onLoginSubmit(event) {
    event.preventDefault();
    var email = loginForm.email.value;
    var password = loginForm.password.value;
    if (!email || !password) { showError(loginForm, 'Vui lòng nhập email và mật khẩu.'); return; }
    showError(loginForm, '');
    setBusy(loginForm, true);
    api.login(email, password).then(function (res) {
      if (res.mustChange) {
        pending = { email: email, password: password };
        showView('change');
        return;
      }
      window.location.href = accountUrl(res.user);
    }).catch(function (err) {
      showError(loginForm, err.message);
    }).then(function () { setBusy(loginForm, false); });
  }

  function onChangeSubmit(event) {
    event.preventDefault();
    if (!pending) { showView('login'); return; }
    var problem = validateNewPassword(changeForm.newPassword.value, changeForm.confirmPassword.value, pending.password);
    if (problem) { showError(changeForm, problem); return; }
    showError(changeForm, '');
    setBusy(changeForm, true);
    api.changePassword(pending.email, pending.password, changeForm.newPassword.value).then(function (res) {
      pending = null;
      window.location.href = accountUrl(res.user);
    }).catch(function (err) {
      showError(changeForm, err.message);
    }).then(function () { setBusy(changeForm, false); });
  }

  function logout() {
    api.logout().then(function () {
      renderHeader(null);
      if ($('[data-account-root]')) window.location.reload();
    });
  }

  /* ───────────── Trang tài khoản ───────────── */
  function fmt(n) { return Math.round(Number(n || 0)).toLocaleString('vi-VN'); }
  function fmtPts(n) { return Number(n || 0).toLocaleString('vi-VN', { maximumFractionDigits: 1 }); }
  function fmtUPoint(points) { return fmt(points * 1000000); }
  function setField(name, text) {
    $all('[data-field="' + name + '"]').forEach(function (el) { el.textContent = text; });
  }
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  /* Trạng thái kỳ suy ra từ ngày bắt đầu/kết thúc (giờ Việt Nam). */
  function periodState(p) {
    var now = Date.now();
    var from = new Date(p.from + 'T00:00:00+07:00').getTime();
    var to = new Date(p.to + 'T23:59:59+07:00').getTime();
    if (now < from) return 'upcoming';
    return now <= to ? 'current' : 'closed';
  }
  function activePeriods(user) {
    var list = user.periods.filter(function (p) { return periodState(p) !== 'upcoming'; });
    return list.length ? list : user.periods.slice(0, 1);
  }
  function currentPeriod(user) {
    var list = activePeriods(user);
    return list.filter(function (p) { return periodState(p) === 'current'; })[0] || list[list.length - 1];
  }

  /* Số liệu một kỳ, tính theo thể lệ từng chương trình. */
  function periodStats(user, d) {
    var isPRM = user.profile.program === 'PRM';
    var base, bonus, factor = 1, rating = null, metric;
    var rate = SIH_RATES[user.profile.role] || 0;
    if (isPRM) {
      base = d.gmvPoints + d.referPoints + d.onehubPoints;
      bonus = d.bonusPoints;
      metric = base;
    } else {
      base = d.gmv * rate;
      bonus = user.profile.role === 'SA' ? d.bonusPoints : 0;
      rating = d.rating ? SIH_RATINGS[d.rating] : null;
      factor = rating ? rating.factor : 1;
      metric = d.gmv;
    }
    var total = base + bonus;
    var converted = total * factor;
    var units = (d.units || []).map(function (u) {
      var pts = isPRM ? u[2] : u[2] * rate;
      return { code: u[0], project: u[1], gmv: isPRM ? null : u[2], pts: pts, paid: !!u[3], sa: u[4] || '', period: d.label };
    });
    var pending = units.filter(function (u) { return !u.paid; }).reduce(function (s, u) { return s + u.pts; }, 0);
    return {
      base: base, bonus: bonus, total: total, converted: converted, factor: factor, rating: rating, metric: metric,
      available: converted * 0.8, locked: converted * 0.2, pending: pending, units: units,
    };
  }
  function sumStats(list) {
    var zero = { base: 0, bonus: 0, total: 0, converted: 0, available: 0, locked: 0, pending: 0, units: [] };
    return list.reduce(function (acc, s) {
      ['base', 'bonus', 'total', 'converted', 'available', 'locked', 'pending'].forEach(function (k) { acc[k] += s[k]; });
      acc.units = acc.units.concat(s.units);
      return acc;
    }, zero);
  }

  /* Dựng dữ liệu hiển thị cho kỳ đang chọn (hoặc lũy kế tới hiện tại). */
  function buildView(user, selection) {
    var isPRM = user.profile.program === 'PRM';
    var isSA = user.profile.role === 'SA';
    var isSM = user.profile.role === 'SM';
    var cumulative = selection === ALL_ID;
    var active = activePeriods(user);
    var picked = cumulative ? null : user.periods.filter(function (p) { return p.id === selection; })[0];
    var inRange = cumulative ? active : [picked];
    var upToIdx = cumulative ? active.length - 1 : user.periods.indexOf(picked);
    var upTo = cumulative ? active : user.periods.slice(0, upToIdx + 1);
    var last = inRange[inRange.length - 1];

    var sPeriod = sumStats(inRange.map(function (p) { return periodStats(user, p); }));
    var sCum = sumStats(upTo.map(function (p) { return periodStats(user, p); }));
    var sAll = sumStats(active.map(function (p) { return periodStats(user, p); }));
    var scope = cumulative ? '' : ' trong kỳ';

    var view = {
      cumulative: cumulative,
      rank: last.rank,
      updatedAt: last.updatedAt,
      statusText: cumulative ? 'Lũy kế từ đầu chương trình đến hiện tại' : (periodState(picked) === 'current' ? 'Kỳ đang diễn ra' : 'Kỳ đã hoàn thành'),
      isCurrent: !cumulative && periodState(picked) === 'current',
      heroLabel: cumulative ? 'Tổng điểm lũy kế' : (isPRM ? 'Tổng điểm quý' : 'Tổng điểm (trước quy đổi)'),
      total: sPeriod.total,
    };

    // 5 chỉ số điểm (FB-02). Điểm tạm tính = điểm cơ bản + điểm bonus.
    var basicLabel = isPRM ? 'Điểm cơ bản (GMV + Refer + OneHub)' : 'Điểm cơ bản (GMV × hệ số ' + user.profile.role + ')';
    view.cards = [
      { label: 'Điểm tạm tính' + scope, value: fmtPts(sPeriod.total), icon: 'timelapse', tone: 'white',
        sub: isPRM ? 'Bấm để xem điểm cơ bản và bonus' : 'GMV ' + fmtPts(inRange.reduce(function (s, p) { return s + p.gmv; }, 0)) + ' tỷ · bấm để xem chi tiết',
        detail: [{ label: basicLabel, value: fmtPts(sPeriod.base) }, { label: 'Điểm bonus', value: fmtPts(sPeriod.bonus) }] },
      { label: 'Điểm tạm tính lũy kế', value: fmtPts(sCum.total), icon: 'stacked_line_chart', tone: 'white',
        sub: cumulative ? 'Từ đầu chương trình đến hiện tại' : 'Từ đầu chương trình đến hết ' + picked.label,
        detail: [{ label: 'Điểm cơ bản', value: fmtPts(sCum.base) }, { label: 'Điểm bonus', value: fmtPts(sCum.bonus) }] },
      { label: 'Điểm khả dụng' + scope + ' (80%)', value: fmtPts(sPeriod.available), icon: 'account_balance_wallet', tone: 'cyan',
        sub: 'Phần điểm được chi trả' },
      { label: 'Điểm tạm khóa' + scope + ' (20%)', value: fmtPts(sPeriod.locked), icon: 'lock_clock', tone: 'white',
        sub: 'Phần điểm chưa được chi trả' },
      { label: 'Điểm tích lũy', value: fmtPts(sAll.locked + sAll.pending), icon: 'savings', tone: 'gold',
        sub: '20% tạm khóa ' + fmtPts(sAll.locked) + ' + căn chưa HĐMB / chưa đối soát CĐT ' + fmtPts(sAll.pending) },
    ];

    // U-Point chi trả
    if (isPRM) {
      view.payout = {
        title: 'U-Point chi trả' + (cumulative ? ' lũy kế' : ' đợt này') + ' (80%)',
        value: fmtUPoint(sPeriod.available),
        lines: [
          { label: 'Ngày chi trả dự kiến', value: cumulative ? 'Theo từng quý' : picked.payoutDate },
          { label: 'U-Point tạm khóa (20%)', value: fmtUPoint(sPeriod.locked) },
        ],
        note: '1 điểm = 1.000.000 U-Point. ' + last.lockNote + ' Điểm tạm tính sẽ bị thu hồi nếu giao dịch không chuyển đổi thành HĐMB.',
      };
    } else {
      var rating = cumulative ? null : periodStats(user, picked).rating;
      view.payout = {
        title: 'U-Point chi trả' + (cumulative ? ' lũy kế' : ' kỳ này') + ' (80%)' + (!cumulative && !rating ? ' – tạm tính' : ''),
        value: fmtUPoint(sPeriod.available),
        lines: [
          { label: cumulative ? 'Điểm sau quy đổi (lũy kế)' : 'Điểm sau quy đổi theo xếp loại', value: fmtPts(sPeriod.converted) },
          { label: 'U-Point tạm khóa (20%)', value: fmtUPoint(sPeriod.locked) },
          { label: 'Xếp loại hiệu quả công việc', value: cumulative ? 'Theo từng kỳ' : (rating ? picked.rating + ' · ' + rating.label : 'Chờ đánh giá (tạm tính 100%)') },
          { label: 'Thời gian chi trả', value: 'Kỳ chi trả gần nhất sau khi có kết quả đánh giá' },
        ],
        note: '1 điểm = 1.000.000 U-Point. ' + last.lockNote,
      };
    }

    // Tiến độ tới mốc bonus của kỳ đang chọn (ẩn khi xem lũy kế hoặc vai trò không có bonus)
    var tiers = isPRM ? PRM_TIERS : (isSA ? SIH_TIERS : null);
    view.progress = tiers && !cumulative
      ? { unit: isPRM ? 'điểm' : 'tỷ GMV', metric: periodStats(user, picked).metric, list: tiers }
      : null;

    // Danh sách căn ghi nhận (FB-03) – SM xem căn của cả team (FB-05)
    view.units = {
      list: sPeriod.units,
      showGmv: !isPRM,
      showSa: isSM,
      title: isSM ? 'Danh sách căn của team' : 'Danh sách căn ghi nhận',
      sub: isSM
        ? 'Các căn do SA thuộc team bạn quản lý ghi nhận' + (cumulative ? ' từ đầu chương trình đến hiện tại.' : ' trong ' + picked.label + '.')
        : (cumulative ? 'Các căn ghi nhận từ đầu chương trình đến hiện tại.' : 'Các căn ghi nhận trong ' + picked.label + '.'),
    };
    return view;
  }

  /* Các mốc bonus theo từng kỳ (FB-04): PRM 4 quý, SA/SIH 2 nửa năm. */
  function buildBonusPeriods(user) {
    var isPRM = user.profile.program === 'PRM';
    var tiers = isPRM ? PRM_TIERS : (user.profile.role === 'SA' ? SIH_TIERS : null);
    if (!tiers) return null;
    return {
      title: 'Các mốc bonus theo kỳ',
      unit: isPRM ? 'điểm' : 'tỷ GMV',
      rows: user.periods.map(function (p) {
        var s = periodStats(user, p);
        var state = periodState(p);
        return {
          label: p.label, state: state, total: s.base, metric: s.metric,
          unlocked: s.bonus, // lấy đúng điểm bonus backend đã ghi nhận cho kỳ (không tự cộng dồn các mốc)
          tiers: tiers.map(function (t, i) { return { name: 'Mốc ' + (i + 1), at: t.at, bonus: t.bonus, reached: s.metric >= t.at }; }),
        };
      }),
    };
  }

  function renderBonusPeriods(data) {
    var section = $('[data-tiers-section]');
    if (!data) { section.classList.add('hidden'); return; }
    section.classList.remove('hidden');
    setField('tiersTitle', data.title);
    var wrap = $('[data-bonus-periods]');
    wrap.textContent = '';
    wrap.style.setProperty('--bp-count', data.rows.length);
    data.rows.forEach(function (row) {
      var card = el('article', 'glass rounded-2xl p-5 bp-card' + (row.state === 'upcoming' ? ' opacity-60' : ''));
      var head = el('div', 'flex items-start justify-between gap-3');
      var left = el('div');
      left.appendChild(el('p', 'font-arena uppercase tracking-wide text-white text-2xl leading-none', row.label));
      left.appendChild(el('p', 'text-[11px] font-bold uppercase tracking-wider mt-1.5 ' + (row.state === 'current' ? 'text-secondary' : 'text-white/40'),
        row.state === 'current' ? 'Kỳ đang diễn ra' : (row.state === 'closed' ? 'Kỳ đã hoàn thành' : 'Chưa bắt đầu')));
      head.appendChild(left);
      var right = el('div', 'text-right');
      right.appendChild(el('p', 'text-xs font-bold uppercase tracking-normal text-white/65 font-body', 'Tổng điểm tạm tính'));
      right.appendChild(el('p', 'font-wide italic font-black text-2xl text-white leading-tight', fmtPts(row.total)));
      head.appendChild(right);
      card.appendChild(head);

      card.appendChild(el('p', 'text-xs text-white/55 mt-3',
        'Đạt ' + fmtPts(row.metric) + ' ' + data.unit + ' · đã mở khóa +' + fmtPts(row.unlocked) + ' điểm bonus'));

      var chips = el('ul', 'mt-3 flex flex-wrap gap-2');
      row.tiers.forEach(function (t) {
        var chip = el('li', 'bp-chip ' + (t.reached ? 'bp-chip-on' : 'bp-chip-off'));
        chip.appendChild(el('span', 'material-symbols-outlined text-[16px]', t.reached ? 'lock_open' : 'lock'));
        chip.appendChild(el('span', null, t.name + ' · ≥' + fmtPts(t.at) + ' · +' + fmtPts(t.bonus)));
        chips.appendChild(chip);
      });
      card.appendChild(chips);
      wrap.appendChild(card);
    });
  }

  function renderProgress(progress) {
    var seg = $('[data-progress-segments]');
    if (!progress) {
      seg.classList.add('hidden');
      setField('nextTier', '');
      return;
    }
    seg.classList.remove('hidden');
    var next = progress.list.filter(function (t) { return progress.metric < t.at; })[0];
    var nextIdx = progress.list.indexOf(next);
    var from = nextIdx > 0 ? progress.list[nextIdx - 1].at : 0;
    var pct = next ? Math.max(0, Math.min(100, Math.round((progress.metric - from) / (next.at - from) * 100))) : 100;

    // Mỗi mốc là một đoạn bằng nhau: đoạn đã qua đầy, đoạn đang đi đầy theo phần trăm chặng, các đoạn sau trống.
    seg.textContent = '';
    var row = el('div', 'prog-row');
    var labels = el('div', 'prog-row mt-2');
    var fills = [];
    progress.list.forEach(function (tier, i) {
      var lo = i > 0 ? progress.list[i - 1].at : 0;
      var frac = Math.max(0, Math.min(1, (progress.metric - lo) / (tier.at - lo)));
      var cell = el('div', 'prog-seg' + (frac >= 1 ? ' prog-seg-done' : '') + (i === nextIdx ? ' prog-seg-now' : ''));
      var fill = el('div', 'prog-seg-fill');
      cell.appendChild(fill);
      row.appendChild(cell);
      fills.push([fill, frac]);

      var label = el('div', 'prog-label' + (progress.metric >= tier.at ? ' prog-label-on' : ''));
      label.appendChild(el('span', 'prog-label-n', 'Mốc ' + (i + 1)));
      label.appendChild(el('span', 'prog-label-v', fmtPts(tier.at)));
      labels.appendChild(label);
    });
    seg.appendChild(row);
    seg.appendChild(labels);
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      fills.forEach(function (f) { f[0].style.width = Math.round(f[1] * 100) + '%'; });
    }); });
    setField('nextTier', next
      ? (nextIdx > 0 ? 'Mốc ' + nextIdx + ' (' + fmtPts(from) + ') → Mốc ' + (nextIdx + 1) + ' (' + fmtPts(next.at) + '): đã đi ' + pct + '% chặng. ' : '')
        + 'Còn ' + fmtPts(next.at - progress.metric) + ' ' + progress.unit + ' nữa để đạt Mốc ' + (nextIdx + 1) + '.'
      : 'Bạn đã đạt tất cả các mốc. Chúc mừng!');
  }

  function renderCards(cards) {
    var grid = $('[data-cards]');
    var cardTpl = $('[data-card-template]');
    grid.textContent = '';
    cards.forEach(function (c) {
      var node = cardTpl.content.firstElementChild.cloneNode(true);
      node.classList.add(c.tone === 'cyan' ? 'glass-cyan' : (c.tone === 'gold' ? 'glass-gold' : 'glass'));
      $('[data-card="label"]', node).textContent = c.label;
      var val = $('[data-card="value"]', node);
      val.textContent = c.value;
      val.classList.add(c.tone === 'gold' ? 'text-primary' : (c.tone === 'cyan' ? 'text-secondary' : 'text-white'));
      $('[data-card="icon"]', node).textContent = c.icon;
      $('[data-card="sub"]', node).textContent = c.sub || '';

      var detail = $('[data-card="detail"]', node);
      if (c.detail) {
        c.detail.forEach(function (d) {
          var line = el('div', 'flex justify-between gap-3 text-xs py-1');
          line.appendChild(el('span', 'text-white/55', d.label));
          line.appendChild(el('span', 'font-bold text-white whitespace-nowrap', d.value));
          detail.appendChild(line);
        });
        node.classList.add('card-expandable');
        node.setAttribute('role', 'button');
        node.setAttribute('tabindex', '0');
        node.setAttribute('aria-expanded', 'false');
        var toggle = function () {
          var open = node.getAttribute('aria-expanded') !== 'true';
          node.setAttribute('aria-expanded', String(open));
          detail.classList.toggle('hidden', !open);
        };
        node.addEventListener('click', toggle);
        node.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
        });
      } else {
        $('[data-card="chev"]', node).remove();
      }
      grid.appendChild(node);
    });
  }

  function renderUnits(units) {
    setField('unitsTitle', units.title);
    setField('unitsSub', units.sub);
    var head = $('[data-units-head]');
    var body = $('[data-units-body]');
    var empty = $('[data-units-empty]');
    head.textContent = '';
    body.textContent = '';

    var cols = ['Mã căn', 'Dự án', 'Kỳ'];
    if (units.showSa) cols.push('SA ghi nhận');
    if (units.showGmv) cols.push('GMV (tỷ)');
    cols.push('Điểm', 'Trạng thái');
    var tr = el('tr');
    cols.forEach(function (c, i) { tr.appendChild(el('th', 'units-th' + (i >= cols.length - (units.showGmv ? 3 : 2) ? ' text-right' : ''), c)); });
    head.appendChild(tr);

    empty.classList.toggle('hidden', units.list.length > 0);
    units.list.forEach(function (u) {
      var row = el('tr', 'units-row');
      row.appendChild(el('td', 'units-td font-bold text-white', u.code));
      row.appendChild(el('td', 'units-td', u.project));
      row.appendChild(el('td', 'units-td text-white/60', u.period));
      if (units.showSa) row.appendChild(el('td', 'units-td', u.sa));
      if (units.showGmv) row.appendChild(el('td', 'units-td text-right', fmtPts(u.gmv)));
      row.appendChild(el('td', 'units-td text-right font-bold text-white', fmtPts(u.pts)));
      row.appendChild(el('td', 'units-td text-right font-bold ' + (u.paid ? 'unit-paid' : 'unit-unpaid'),
        u.paid ? 'Đã chi trả' : 'Chưa chi trả & đối soát'));
      body.appendChild(row);
    });
  }

  function renderPeriod(user, selection) {
    var v = buildView(user, selection);
    setField('rank', '#' + v.rank);
    setField('rankLabel', v.cumulative ? 'Thứ hạng hiện tại' : 'Thứ hạng');
    setField('periodStatus', v.statusText);
    var statusEl = $('[data-period-status]');
    if (statusEl) statusEl.classList.toggle('text-secondary', v.isCurrent);
    setField('heroLabel', v.heroLabel);
    setField('totalPoints', fmtPts(v.total));
    setField('updatedAt', new Date(v.updatedAt).toLocaleString('vi-VN'));

    renderCards(v.cards);

    setField('payoutTitle', v.payout.title);
    setField('uPointPayout', v.payout.value);
    setField('payoutNote', v.payout.note);
    var lines = $('[data-payout-lines]');
    lines.textContent = '';
    v.payout.lines.forEach(function (l) {
      var li = el('li', 'flex justify-between gap-4 py-2 text-sm');
      li.appendChild(el('span', 'text-white/50', l.label));
      li.appendChild(el('span', 'font-bold text-white text-right', l.value));
      lines.appendChild(li);
    });

    renderProgress(v.progress);
    renderUnits(v.units);
  }

  /* ───────────── Nhiều năm: năm nay xem được cả các năm trước ───────────── */
  function periodYear(p) { return Number(String(p.from).slice(0, 4)); }
  function yearsOf(user) {
    var seen = {};
    user.periods.forEach(function (p) { seen[periodYear(p)] = true; });
    return Object.keys(seen).map(Number).sort(function (a, b) { return b - a; });
  }
  /* Bản sao của user chỉ gồm các kỳ trong một năm: mọi hàm tính điểm bên trên dùng lại được nguyên vẹn. */
  function scopeUser(user, year) {
    return {
      email: user.email, name: user.name, profile: user.profile, membership: user.membership,
      periods: user.periods.filter(function (p) { return periodYear(p) === year; }),
    };
  }

  /* ───────────── Hành trình du lịch (gamification, theo nửa năm, PRM và SIH) ─────────────
   * Vé = điểm / số điểm mỗi vé (làm tròn xuống); đủ số vé tối thiểu trong nửa năm thì được đi du lịch.
   * % quãng đường = điểm / (số vé tối thiểu × số điểm mỗi vé). PRM gộp 2 quý thành nửa năm, SIH vốn tính theo H1/H2. */
  function buildJourney(scoped) {
    var rule = JOURNEY_RULES[scoped.profile.program] || JOURNEY_RULES.PRM;
    var halves = [{ key: 'H1', months: [0, 5] }, { key: 'H2', months: [6, 11] }];
    var year = scoped.periods.length ? periodYear(scoped.periods[0]) : null;
    return halves.map(function (h) {
      var list = scoped.periods.filter(function (p) {
        var m = Number(String(p.from).slice(5, 7)) - 1;
        return m >= h.months[0] && m <= h.months[1];
      });
      var points = list.reduce(function (s, p) { return s + periodStats(scoped, p).total; }, 0);
      var tickets = Math.floor(points / rule.ticket + 1e-9);
      var states = list.map(periodState);
      var state = !list.length || states.every(function (s) { return s === 'upcoming'; }) ? 'upcoming'
        : (states.indexOf('current') >= 0 || states.indexOf('upcoming') >= 0 ? 'ongoing' : 'closed');
      var reached = tickets >= rule.min;
      var message;
      if (state === 'upcoming') message = 'Hành trình ' + h.key + ' chưa bắt đầu.';
      else if (state === 'ongoing') message = reached
        ? 'Bạn đã đủ vé cho chuyến đi ' + h.key + ', tiếp tục tích thêm nhé!'
        : 'Còn ' + (rule.min - tickets) + ' vé nữa để lên đường, cố lên!';
      else if (reached) message = 'Ôi vui quá, bạn thật tuyệt vời! Hẹn bạn trên chuyến du lịch ' + h.key + '.';
      else message = h.key === 'H1' ? 'Ôi buồn quá, bạn chờ tiếp H2 nhé!' : 'Rất tiếc, hẹn bạn ở mùa giải sau nhé!';
      return {
        key: h.key, year: year, state: state, reached: reached, tickets: tickets, points: points,
        min: rule.min, ticketPoints: rule.ticket,
        percent: Math.min(100, Math.round(points / (rule.min * rule.ticket) * 100)), message: message,
      };
    });
  }

  function renderJourney(scoped) {
    var section = $('[data-journey-section]');
    if (!section) return;
    section.classList.remove('hidden');
    var wrap = $('[data-journey]');
    wrap.textContent = '';
    buildJourney(scoped).forEach(function (j) {
      var tone = j.state === 'closed' ? (j.reached ? 'journey-win' : 'journey-miss') : '';
      var card = el('article', 'glass rounded-2xl p-5 md:p-6 journey-card ' + tone + (j.state === 'upcoming' ? ' opacity-60' : ''));

      var head = el('div', 'flex items-start justify-between gap-3');
      var left = el('div');
      left.appendChild(el('p', 'font-arena uppercase tracking-wide text-white text-2xl leading-none', 'Hành trình ' + j.key + '/' + j.year));
      left.appendChild(el('p', 'text-[11px] font-bold uppercase tracking-wider mt-1.5 ' + (j.state === 'ongoing' ? 'text-secondary' : 'text-white/40'),
        j.state === 'ongoing' ? 'Đang trên đường' : (j.state === 'closed' ? 'Đã khép lại' : 'Chưa bắt đầu')));
      head.appendChild(left);
      var right = el('div', 'flex items-center gap-2 journey-tickets');
      right.appendChild(el('span', 'material-symbols-outlined text-[26px] text-primary', 'confirmation_number'));
      var num = el('div', 'text-right');
      num.appendChild(el('p', 'font-wide italic font-black text-3xl text-white leading-none', String(j.tickets)));
      num.appendChild(el('p', 'text-xs font-bold uppercase tracking-normal text-white/65 font-body', 'vé'));
      right.appendChild(num);
      head.appendChild(right);
      card.appendChild(head);

      // Con đường: các trạm là vé tối thiểu, điểm cuối là chuyến du lịch
      var road = el('div', 'journey-road');
      var track = el('div', 'journey-track');
      var fill = el('div', 'journey-fill');
      fill.style.width = '0%';
      track.appendChild(fill);
      for (var i = 1; i <= j.min; i += 1) {
        var stop = el('span', 'journey-stop ' + (j.tickets >= i ? 'journey-stop-on' : ''));
        stop.style.left = (i / j.min * 100) + '%';
        stop.appendChild(el('span', 'material-symbols-outlined text-[16px]', i === j.min ? 'beach_access' : 'confirmation_number'));
        road.appendChild(stop);
      }
      var rider = el('span', 'journey-rider');
      rider.style.left = '0%';
      var plane = el('span', 'material-symbols-outlined text-[24px] journey-plane', 'flight');
      rider.appendChild(plane);
      road.appendChild(track);
      road.appendChild(rider);
      card.appendChild(road);
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        fill.style.width = j.percent + '%';
        rider.style.left = j.percent + '%';
      }); });

      card.appendChild(el('p', 'text-sm text-white/65 mt-6',
        'Đã đi ' + j.percent + '% quãng đường · ' + j.tickets + '/' + j.min + ' vé tối thiểu (' + fmtPts(j.points) + ' điểm, ' + j.ticketPoints + ' điểm = 1 vé)'));
      card.appendChild(el('p', 'journey-msg mt-3 font-bold', j.message));
      wrap.appendChild(card);
    });
  }

  function renderYearTabs(years, selected, onPick) {
    var box = $('[data-year-tabs]');
    box.textContent = '';
    box.classList.toggle('hidden', years.length < 2);
    years.forEach(function (y) {
      var b = el('button', 'year-tab', 'Năm ' + y);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(y === selected));
      b.onclick = function () { onPick(y); };
      box.appendChild(b);
    });
  }

  /* Dòng thông tin profile cạnh tên (FB-06): PRM có Vùng + Chi nhánh, SA có Team trực thuộc, SM có Team quản lý. */
  function profileLine(user) {
    var p = user.profile;
    var parts = [p.role];
    if (p.program === 'PRM') {
      parts.push('Vùng: ' + p.area, 'Chi nhánh: ' + p.branch);
    } else if (p.role === 'SM') {
      parts.push('Team SM quản lý: ' + p.team);
    } else {
      parts.push('Team SA trực thuộc: ' + p.team);
    }
    parts.push(user.email);
    return parts.join(' · ');
  }

  /* Cảnh báo duy trì thành viên (FB-07): dưới 5 điểm hoặc 6 tháng liên tiếp không có HBK. */
  function membershipWarnings(user) {
    var total = sumStats(activePeriods(user).map(function (p) { return periodStats(user, p); })).total;
    var months = (user.membership && user.membership.monthsNoHbk) || 0;
    var list = [];
    if (total < MIN_POINTS) {
      list.push({ title: 'Điểm lũy kế dưới ' + MIN_POINTS + ' điểm',
        body: 'Tổng điểm lũy kế của bạn hiện là ' + fmtPts(total) + ' điểm, chưa đạt mức tối thiểu ' + MIN_POINTS + ' điểm để duy trì thành viên.' });
    }
    if (months >= MAX_MONTHS_NO_HBK) {
      list.push({ title: 'Chưa phát sinh HBK ' + months + ' tháng liên tiếp',
        body: 'Bạn chưa phát sinh HBK trong ' + months + ' tháng liên tiếp, vượt ngưỡng ' + MAX_MONTHS_NO_HBK + ' tháng của điều kiện duy trì thành viên.' });
    }
    return list;
  }

  function showMembershipWarning(user) {
    var warnings = membershipWarnings(user);
    var modalEl = $('[data-warn-modal]');
    if (!warnings.length || !modalEl) return;
    var seenKey = WARN_KEY + user.email;
    try { if (sessionStorage.getItem(seenKey)) return; } catch (e) { /* vẫn hiện */ }

    var list = $('[data-warn-list]');
    list.textContent = '';
    warnings.forEach(function (w) {
      var item = el('li', 'warn-item');
      item.appendChild(el('p', 'font-bold text-white', w.title));
      item.appendChild(el('p', 'text-sm text-white/65 mt-1', w.body));
      list.appendChild(item);
    });
    modalEl.classList.remove('hidden');
    var closeBtn = $('[data-warn-close]', modalEl);
    var close = function () {
      modalEl.classList.add('hidden');
      try { sessionStorage.setItem(seenKey, '1'); } catch (e) { /* bỏ qua */ }
    };
    $all('[data-warn-close]').forEach(function (b) { b.onclick = close; });
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape' && !modalEl.classList.contains('hidden')) { close(); document.removeEventListener('keydown', onKey); }
    });
    closeBtn.focus();
  }

  function renderAccount(user) {
    var guest = $('[data-account-guest]');
    var view = $('[data-account-view]');
    var loading = $('[data-account-loading]');
    if (loading) loading.classList.add('hidden');
    if (!user) {
      guest.classList.remove('hidden');
      view.classList.add('hidden');
      return;
    }
    // Mỗi chương trình có trang riêng: đưa người dùng về đúng trang của mình.
    var pageProgram = $('[data-account-root]').getAttribute('data-account-program');
    if (pageProgram && pageProgram !== user.profile.program.toLowerCase()) {
      window.location.replace(accountUrl(user));
      return;
    }
    guest.classList.add('hidden');
    view.classList.remove('hidden');
    setField('name', user.name);
    setField('profileLine', profileLine(user));

    var select = $('[data-period-select]');
    var periodTrigger = $('[data-period-trigger]');
    var periodMenu = $('[data-period-menu]');
    var periodLabel = $('[data-period-label]');
    var latest = currentPeriod(user);
    var latestYear = periodYear(latest);
    var years = yearsOf(user);

    function closePeriodMenu() {
      periodMenu.classList.add('hidden');
      periodTrigger.setAttribute('aria-expanded', 'false');
    }
    function syncPeriodMenu(periodId) {
      Array.prototype.forEach.call(periodMenu.children, function (item) {
        item.setAttribute('aria-selected', String(item.getAttribute('data-period-id') === periodId));
      });
    }

    // Chọn một năm: dựng lại danh sách kỳ, khu mốc bonus, bảng căn và hành trình của năm đó.
    function selectYear(year) {
      var scoped = scopeUser(user, year);
      var isLatestYear = year === latestYear;
      var startPeriod = isLatestYear ? latest : activePeriods(scoped).slice(-1)[0];

      select.textContent = '';
      var optAll = document.createElement('option');
      optAll.value = ALL_ID;
      optAll.textContent = isLatestYear ? 'Lũy kế tới hiện tại' : 'Lũy kế cả năm ' + year;
      select.appendChild(optAll);
      activePeriods(scoped).slice().reverse().forEach(function (period) {
        var opt = document.createElement('option');
        opt.value = period.id;
        opt.textContent = period.label + (periodState(period) === 'current' ? ' (hiện tại)' : '');
        select.appendChild(opt);
      });
      select.value = startPeriod.id;
      select.onchange = function () { renderPeriod(scoped, select.value); };

      periodMenu.textContent = '';
      Array.prototype.forEach.call(select.options, function (option) {
        var item = document.createElement('button');
        item.type = 'button';
        item.className = 'period-menu-item';
        item.setAttribute('role', 'option');
        item.setAttribute('data-period-id', option.value);
        item.textContent = option.textContent;
        item.onclick = function () {
          select.value = option.value;
          periodLabel.textContent = option.textContent;
          syncPeriodMenu(option.value);
          closePeriodMenu();
          select.dispatchEvent(new Event('change', { bubbles: true }));
        };
        periodMenu.appendChild(item);
      });
      periodLabel.textContent = select.options[select.selectedIndex].textContent;
      syncPeriodMenu(select.value);

      renderYearTabs(years, year, selectYear);
      renderPeriod(scoped, startPeriod.id);
      renderBonusPeriods(buildBonusPeriods(scoped));
      renderJourney(scoped);
    }

    periodTrigger.onclick = function () {
      var willOpen = periodMenu.classList.contains('hidden');
      periodMenu.classList.toggle('hidden', !willOpen);
      periodTrigger.setAttribute('aria-expanded', String(willOpen));
    };
    document.addEventListener('click', function (event) {
      if (!event.target.closest('.period-picker')) closePeriodMenu();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closePeriodMenu();
    });

    selectYear(latestYear);
    showMembershipWarning(scopeUser(user, latestYear));
  }

  /* ───────────── Khởi tạo ───────────── */
  function init() {
    modal = $('#auth-modal');
    if (modal) {
      loginForm = $('#auth-login-form');
      changeForm = $('#auth-change-form');
      loginForm.addEventListener('submit', onLoginSubmit);
      changeForm.addEventListener('submit', onChangeSubmit);
      $all('[data-auth-close]').forEach(function (el) { el.addEventListener('click', closeModal); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
      });
    }
    $all('[data-auth-open]').forEach(function (el) {
      el.addEventListener('click', function () {
        var menu = document.getElementById('mobile-menu');
        if (menu && !menu.classList.contains('hidden') && window.toggleMobileMenu) window.toggleMobileMenu();
        openModal();
      });
    });
    $all('[data-auth-logout]').forEach(function (el) { el.addEventListener('click', logout); });

    api.me().then(function (user) {
      renderHeader(user);
      if ($('[data-account-root]')) {
        try {
          renderAccount(user);
        } catch (err) {
          // Không để trang trống im lặng: báo rõ và hướng dẫn cách xử lý
          console.error('[account]', err);
          var box = $('[data-account-loading]');
          if (box) {
            box.classList.remove('hidden');
            box.textContent = 'Không tải được dữ liệu tài khoản. Vui lòng tải lại trang (Ctrl + F5); nếu vẫn lỗi, hãy đăng xuất rồi đăng nhập lại.';
          }
        }
      }
    });
  }

  window.AllstarAuth = { api: api, open: openModal };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
