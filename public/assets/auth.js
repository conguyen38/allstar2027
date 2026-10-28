/*
 * Allstar Club – đăng nhập tài khoản cá nhân.
 *
 * !!! BẢN MOCK !!!  Tài khoản và mật khẩu đang lưu trong localStorage của trình duyệt,
 * KHÔNG an toàn cho dữ liệu thật. Toàn bộ UI chỉ gọi object `api` bên dưới; khi có
 * backend, thay 4 hàm trong `api` bằng fetch tới server (xem hợp đồng ở từng hàm).
 */
(function () {
  var USERS_KEY = 'allstar_mock_users_v4';
  var SESSION_KEY = 'allstar_mock_session_v4';
  var MIN_PASSWORD = 8;

  /* ───────────── Dữ liệu mẫu (chỉ để demo) ─────────────
   * Hai chương trình có thể lệ khác nhau (xem /prm/the-le/ và /sih/the-le/):
   *  PRM: kỳ theo quý (Q1–Q4); điểm = GMV + Refer + OneHub; bonus theo mốc điểm;
   *       chi trả 80% theo quý, 20% tạm khóa theo H1/H2.
   *  SIH: kỳ theo nửa năm (H1/H2); điểm = GMV × hệ số vai trò (SA 0.8, SM 0.2);
   *       bonus theo mốc GMV chỉ cho SA; quy đổi theo xếp loại hiệu quả công việc;
   *       chi trả 80% sau đánh giá, 20% tạm khóa.
   * Dữ liệu thô bên dưới là thứ server sẽ trả về; các con số dẫn xuất (tổng, 80/20,
   * U-Point) được tính ở buildView(). */
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
      periods: [
        { id: 'q1', label: 'Quý 1/2026', status: 'closed', rank: 21, gmvPoints: 9, referPoints: 0.7, onehubPoints: 0.5, bonusPoints: 5, payoutDate: '15/05/2026', lockNote: LOCK_H1, updatedAt: '2026-04-05T09:00:00+07:00' },
        { id: 'q2', label: 'Quý 2/2026', status: 'closed', rank: 15, gmvPoints: 16.5, referPoints: 1.5, onehubPoints: 0.9, bonusPoints: 13, payoutDate: '15/08/2026', lockNote: LOCK_H1, updatedAt: '2026-07-05T09:00:00+07:00' },
        { id: 'q3', label: 'Quý 3/2026', status: 'closed', rank: 12, gmvPoints: 24.6, referPoints: 3, onehubPoints: 1.8, bonusPoints: 13, payoutDate: '15/11/2026', lockNote: LOCK_H2, updatedAt: '2026-10-05T09:00:00+07:00' },
        { id: 'q4', label: 'Quý 4/2026', status: 'current', rank: 14, gmvPoints: 20.5, referPoints: 2, onehubPoints: 1.2, bonusPoints: 13, payoutDate: '15/02/2027', lockNote: LOCK_H2, updatedAt: '2026-10-25T09:00:00+07:00' },
      ],
    },
    {
      email: 'demo.active@example.com',
      name: 'Trần Thị B',
      tempPassword: 'Allstar@2026',
      mustChange: false, // SIH vai trò SA, đã đổi mật khẩu rồi
      profile: { program: 'SIH', role: 'SA', area: 'Team HCM', branch: 'OneHousing' },
      periods: [
        { id: 'h1', label: 'H1/2026', status: 'closed', rank: 5, gmv: 95, bonusPoints: 10, rating: 'A2', lockNote: LOCK_SIH, updatedAt: '2026-08-20T09:00:00+07:00' },
        { id: 'h2', label: 'H2/2026', status: 'current', rank: 3, gmv: 140, bonusPoints: 10, rating: null, lockNote: LOCK_SIH, updatedAt: '2026-10-25T09:00:00+07:00' },
      ],
    },
    {
      email: 'demo.sm@example.com',
      name: 'Lê Văn C',
      tempPassword: 'Allstar@2026',
      mustChange: false, // SIH vai trò SM (không có bonus vượt mốc)
      profile: { program: 'SIH', role: 'SM', area: 'Team Hà Nội', branch: 'OneHousing' },
      periods: [
        { id: 'h1', label: 'H1/2026', status: 'closed', rank: 9, gmv: 210, bonusPoints: 0, rating: 'A3', lockNote: LOCK_SIH, updatedAt: '2026-08-20T09:00:00+07:00' },
        { id: 'h2', label: 'H2/2026', status: 'current', rank: 7, gmv: 95, bonusPoints: 0, rating: null, lockNote: LOCK_SIH, updatedAt: '2026-10-25T09:00:00+07:00' },
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
    return { email: user.email, name: user.name, profile: user.profile, periods: user.periods };
  }

  function loadUsers() {
    var users = read(USERS_KEY);
    if (users) return Promise.resolve(users);
    return Promise.all(SEED.map(function (seed) {
      return sha256(seed.email + ':' + seed.tempPassword).then(function (hash) {
        return { email: seed.email, name: seed.name, passHash: hash, mustChange: seed.mustChange, profile: seed.profile, periods: seed.periods };
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
    $all('[data-auth-avatar]').forEach(function (el) {
      if (!user) { el.style.backgroundImage = ''; return; }
      var hash = 0;
      var identity = String(user.email || user.name);
      for (var i = 0; i < identity.length; i += 1) hash = ((hash << 5) - hash + identity.charCodeAt(i)) | 0;
      el.style.backgroundImage = "url('/assets/images/abstract-avatar-" + (Math.abs(hash) % 6) + ".png')";
    });
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

  /* Dựng dữ liệu hiển thị theo thể lệ từng chương trình. */
  function buildView(user, d) {
    var view = { rank: d.rank, updatedAt: d.updatedAt, status: d.status };

    if (user.profile.program === 'PRM') {
      var temp = d.gmvPoints + d.referPoints + d.onehubPoints;
      var total = temp + d.bonusPoints;
      view.heroLabel = 'Tổng điểm quý';
      view.total = total;
      view.cards = [
        { label: 'Điểm tạm tính', value: fmtPts(temp), icon: 'timelapse', tone: 'white',
          sub: 'GMV ' + fmtPts(d.gmvPoints) + ' · Refer ' + fmtPts(d.referPoints) + ' · OneHub ' + fmtPts(d.onehubPoints) },
        { label: 'Điểm bonus', value: fmtPts(d.bonusPoints), icon: 'redeem', tone: 'gold', sub: 'Cộng dồn theo mốc điểm' },
        { label: 'Điểm khả dụng (80%)', value: fmtPts(total * 0.8), icon: 'account_balance_wallet', tone: 'cyan', sub: 'Chi trả ngày ' + d.payoutDate },
        { label: 'Điểm tạm khóa (20%)', value: fmtPts(total * 0.2), icon: 'lock_clock', tone: 'white', sub: 'Giải tỏa theo thể lệ, xem ghi chú bên dưới' },
      ];
      view.payout = {
        title: 'U-Point chi trả đợt này (80%)',
        value: fmtUPoint(total * 0.8),
        lines: [
          { label: 'Ngày chi trả dự kiến', value: d.payoutDate },
          { label: 'U-Point tạm khóa (20%)', value: fmtUPoint(total * 0.2) },
        ],
        note: '1 điểm = 1.000.000 U-Point. ' + d.lockNote + ' Điểm tạm tính sẽ bị thu hồi nếu giao dịch không chuyển đổi thành HĐMB.',
      };
      view.tiers = { title: 'Các mức điểm thưởng bonus', unit: 'điểm', metric: temp, list: PRM_TIERS };
      return view;
    }

    var role = user.profile.role;
    var rate = SIH_RATES[role] || 0;
    var gmvPoints = d.gmv * rate;
    var sihTotal = gmvPoints + d.bonusPoints;
    var rating = d.rating ? SIH_RATINGS[d.rating] : null;
    var factor = rating ? rating.factor : 1;
    var converted = sihTotal * factor;
    var isSA = role === 'SA';
    view.heroLabel = 'Tổng điểm (trước quy đổi)';
    view.total = sihTotal;
    view.cards = [
      { label: 'GMV thực đạt', value: fmtPts(d.gmv) + ' tỷ', icon: 'apartment', tone: 'white', sub: 'Giá trước VAT & KPBT' },
      { label: 'Điểm GMV', value: fmtPts(gmvPoints), icon: 'timelapse', tone: 'white', sub: role + ': ' + rate + ' điểm / tỷ GMV' },
      { label: 'Điểm bonus', value: isSA ? fmtPts(d.bonusPoints) : '—', icon: 'redeem', tone: 'gold',
        sub: isSA ? 'Thưởng khi vượt mốc GMV' : 'Bonus vượt mốc chỉ áp dụng cho SA' },
      { label: 'Xếp loại hiệu quả công việc', value: rating ? d.rating : 'Chờ đánh giá', icon: 'military_tech', tone: 'cyan',
        sub: rating ? rating.label + ' · quy đổi ' + Math.round(factor * 100) + '% tổng điểm' : 'Đang tạm tính theo 100% tổng điểm' },
    ];
    view.payout = {
      title: 'U-Point chi trả kỳ này (80%)' + (rating ? '' : ' – tạm tính'),
      value: fmtUPoint(converted * 0.8),
      lines: [
        { label: 'Điểm sau quy đổi theo xếp loại', value: fmtPts(converted) },
        { label: 'U-Point tạm khóa (20%)', value: fmtUPoint(converted * 0.2) },
        { label: 'Thời gian chi trả', value: 'Kỳ chi trả gần nhất sau khi có kết quả đánh giá' },
      ],
      note: '1 điểm = 1.000.000 U-Point. ' + d.lockNote,
    };
    view.tiers = isSA ? { title: 'Các mốc GMV thưởng bonus (SA)', unit: 'tỷ GMV', metric: d.gmv, list: SIH_TIERS } : null;
    return view;
  }

  function renderTiers(tiers) {
    var section = $('[data-tiers-section]');
    var bar = $('[data-progress]');
    var barWrap = bar.parentNode;
    if (!tiers) {
      section.classList.add('hidden');
      barWrap.classList.add('hidden');
      setField('nextTier', 'Vai trò của bạn không áp dụng thưởng bonus theo mốc.');
      return;
    }
    section.classList.remove('hidden');
    barWrap.classList.remove('hidden');
    setField('tiersTitle', tiers.title);

    var list = $('[data-tier-list]');
    var tpl = $('[data-tier-template]');
    list.textContent = '';
    list.style.setProperty('--tl-count', tiers.list.length);
    var next = null;
    tiers.list.forEach(function (tier, i) {
      var row = tpl.content.firstElementChild.cloneNode(true);
      var reached = tiers.metric >= tier.at;
      var isNext = !reached && !next;
      if (isNext) next = tier;
      $('[data-tier="name"]', row).textContent = 'Mốc ' + (i + 1);
      $('[data-tier="points"]', row).textContent = '≥ ' + fmtPts(tier.at) + ' ' + tiers.unit;
      $('[data-tier="bonus"]', row).textContent = '+' + fmtPts(tier.bonus) + ' bonus';
      var status = $('[data-tier="status"]', row);
      var node = $('[data-tier="node"]', row);
      var icon = $('[data-tier="icon"]', row);
      status.textContent = reached ? 'Đã đạt' : (isNext ? 'Mốc tiếp theo' : 'Chưa đạt');
      status.className += reached ? ' text-primary' : (isNext ? ' text-secondary' : ' text-white/35');
      icon.textContent = reached ? 'check' : (isNext ? 'flag' : 'lock');
      node.className += reached ? ' tl-node-done' : (isNext ? ' tl-node-next' : ' tl-node-locked');
      row.classList.toggle('opacity-60', !reached && !isNext);

      var line = $('[data-tier="line"]', row);
      var following = tiers.list[i + 1];
      if (!following) {
        line.remove();
      } else {
        var span = following.at - tier.at;
        var fill = span > 0 ? Math.max(0, Math.min(1, (tiers.metric - tier.at) / span)) : 0;
        $('.tl-fill', line).style.setProperty('--fill', Math.round(fill * 100) + '%');
      }
      list.appendChild(row);
    });

    var scroller = list.parentNode;
    var syncMore = function () {
      scroller.classList.toggle('has-more', scroller.scrollWidth - scroller.clientWidth - scroller.scrollLeft > 4);
    };
    scroller.onscroll = syncMore;
    requestAnimationFrame(syncMore);

    var top = tiers.list[tiers.list.length - 1].at;
    var pct = Math.min(100, Math.round((tiers.metric / top) * 100));
    requestAnimationFrame(function () { bar.style.width = pct + '%'; });
    setField('nextTier', next
      ? 'Còn ' + fmtPts(next.at - tiers.metric) + ' ' + tiers.unit + ' nữa để đạt Mốc ' + (tiers.list.indexOf(next) + 1) + '.'
      : 'Bạn đã đạt tất cả các mốc. Chúc mừng!');
  }

  function renderPeriod(user, d) {
    var v = buildView(user, d);
    setField('rank', '#' + v.rank);
    setField('periodStatus', v.status === 'current' ? 'Đang diễn ra' : 'Đã chốt kỳ');
    var statusEl = $('[data-period-status]');
    if (statusEl) statusEl.classList.toggle('text-secondary', v.status === 'current');
    setField('heroLabel', v.heroLabel);
    setField('totalPoints', fmtPts(v.total));
    setField('updatedAt', new Date(v.updatedAt).toLocaleString('vi-VN'));

    var grid = $('[data-cards]');
    var cardTpl = $('[data-card-template]');
    grid.textContent = '';
    v.cards.forEach(function (c) {
      var el = cardTpl.content.firstElementChild.cloneNode(true);
      el.classList.add(c.tone === 'cyan' ? 'glass-cyan' : 'glass');
      $('[data-card="label"]', el).textContent = c.label;
      var val = $('[data-card="value"]', el);
      val.textContent = c.value;
      val.classList.add(c.tone === 'gold' ? 'text-primary' : (c.tone === 'cyan' ? 'text-secondary' : 'text-white'));
      $('[data-card="icon"]', el).textContent = c.icon;
      $('[data-card="sub"]', el).textContent = c.sub || '';
      grid.appendChild(el);
    });

    setField('payoutTitle', v.payout.title);
    setField('uPointPayout', v.payout.value);
    setField('payoutNote', v.payout.note);
    var lines = $('[data-payout-lines]');
    lines.textContent = '';
    v.payout.lines.forEach(function (l) {
      var li = document.createElement('li');
      li.className = 'flex justify-between gap-4 py-2 text-sm';
      var k = document.createElement('span');
      k.className = 'text-white/50';
      k.textContent = l.label;
      var val = document.createElement('span');
      val.className = 'font-bold text-white text-right';
      val.textContent = l.value;
      li.appendChild(k);
      li.appendChild(val);
      lines.appendChild(li);
    });

    renderTiers(v.tiers);
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
    setField('email', user.email);
    setField('program', user.profile.program === 'PRM' ? 'PRM Techcombank' : 'LLB OneHousing');
    setField('role', user.profile.role);
    setField('area', user.profile.area);
    setField('branch', user.profile.branch);

    var select = $('[data-period-select]');
    select.textContent = '';
    user.periods.slice().reverse().forEach(function (period) {
      var opt = document.createElement('option');
      opt.value = period.id;
      opt.textContent = period.label + (period.status === 'current' ? ' (hiện tại)' : '');
      select.appendChild(opt);
    });
    var current = user.periods.filter(function (p) { return p.status === 'current'; })[0] || user.periods[user.periods.length - 1];
    select.value = current.id;
    select.onchange = function () {
      renderPeriod(user, user.periods.filter(function (p) { return p.id === select.value; })[0]);
    };
    renderPeriod(user, current);

    var periodTrigger = $('[data-period-trigger]');
    var periodMenu = $('[data-period-menu]');
    var periodLabel = $('[data-period-label]');
    function closePeriodMenu() {
      periodMenu.classList.add('hidden');
      periodTrigger.setAttribute('aria-expanded', 'false');
    }
    function syncPeriodMenu(periodId) {
      Array.prototype.forEach.call(periodMenu.children, function (item) {
        item.setAttribute('aria-selected', String(item.getAttribute('data-period-id') === periodId));
      });
    }
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
      if ($('[data-account-root]')) renderAccount(user);
    });
  }

  window.AllstarAuth = { api: api, open: openModal };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
