/* ============================================================
   Z-Bank — frontend под PHP-бэкенд.
   Все деньги, задания, операции — на сервере.
   Клиент — только UI. localStorage НЕ используется для баланса.
   ============================================================ */

(function () {
  'use strict';

  const API = 'api.php';
  const TASK_LIST = [
    { id: 'card',     title: 'Выпустить первую карту', desc: 'Готовую карту после 5 минут' },
    { id: 'transfer', title: 'Совершить перевод',      desc: 'Любая сумма на любой номер' },
    { id: 'deposit',  title: 'Открыть вклад',          desc: 'С любой суммой и ставкой' },
    { id: 'utilities',title: 'Оплатить ЖКХ',           desc: 'Коммунальные услуги' },
    { id: 'taxes',    title: 'Оплатить налоги',        desc: 'Штрафы и сборы' },
    { id: 'mobile',   title: 'Пополнить мобильный',    desc: 'Связь любого оператора' },
    { id: 'internet', title: 'Оплатить интернет',      desc: 'Провайдер' },
    { id: 'crypto',   title: 'Купить криптовалюту',    desc: 'BTC, ETH, SOL или TON' }
  ];

  const CRYPTO_META = {
    BTC: { name: 'Bitcoin',  symbol: '₿', price: 6500000 },
    ETH: { name: 'Ethereum', symbol: 'Ξ', price: 320000 },
    SOL: { name: 'Solana',   symbol: '◎', price: 14500 },
    TON: { name: 'Toncoin',  symbol: '◆', price: 620 }
  };

  const CATEGORY_LABELS = {
    transfer: 'Переводы', utilities: 'ЖКХ', mobile: 'Связь',
    taxes: 'Налоги', internet: 'Интернет', card: 'Карты'
  };

  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const parseMoney = v => Number(String(v).replace(/\s/g, '').replace(',', '.'));
  const money = n => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  const moneyShort = n => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n);
  const initials = (f, l) => ((f?.[0]||'') + (l?.[0]||'')).toUpperCase() || '--';

  // ---------- API ----------
  async function api(action, payload = null) {
    const url = API + '?action=' + encodeURIComponent(action);
    const opts = {
      method: payload ? 'POST' : 'GET',
      credentials: 'same-origin',
      headers: payload ? { 'Content-Type': 'application/json' } : {}
    };
    if (payload) opts.body = JSON.stringify(payload);
    const r = await fetch(url, opts);
    let data;
    try { data = await r.json(); } catch { data = { error: 'Ошибка сервера' }; }
    if (!r.ok || data.error) {
      const e = new Error(data.error || 'Ошибка');
      e.data = data;
      throw e;
    }
    return data;
  }

  // ---------- STATE (только UI) ----------
  let S = {
    user: null,
    balance: 0,
    transactions: [],
    cards: [],
    pendingCards: [],
    deposits: [],
    crypto: {},
    claimedTasks: [],
    hideBalance: false
  };

  async function refresh() {
    const data = await api('me');
    if (!data.user) { showAuth(); return; }
    S.user = data.user;
    S.balance = data.balance;
    S.transactions = data.transactions;
    S.cards = data.cards;
    S.pendingCards = data.pendingCards;
    S.deposits = data.deposits;
    S.crypto = data.crypto;
    S.claimedTasks = data.claimedTasks;
    S.hideBalance = data.user.settings.hideBalance;

    $('#setHideBalance').checked = data.user.settings.hideBalance;
    $('#setNotifications').checked = data.user.settings.notifications;

    showApp();
  }

  // ---------- SPLASH ----------
  setTimeout(() => $('#splash')?.classList.add('hide'), 3000);

  // ---------- AUTH UI ----------
  function showAuth() {
    $('#authScreen').hidden = false;
    $('#appScreen').hidden = true;
  }
  function showApp() {
    $('#authScreen').hidden = true;
    $('#appScreen').hidden = false;
    const ini = initials(S.user.firstName, S.user.lastName);
    $('#userAvatar').textContent = ini;
    $('#userAvatarTop').textContent = ini;
    $('#userName').textContent = S.user.firstName + ' ' + S.user.lastName;
    $('#cardHolder').textContent = S.user.firstName[0] + '. ' + S.user.lastName.toUpperCase();
    renderAll();
    startTickers();
  }

  $$('.auth-tab').forEach(tab => tab.addEventListener('click', () => {
    $$('.auth-tab').forEach(t => t.classList.toggle('active', t === tab));
    $$('.auth-form').forEach(f => f.classList.remove('active'));
    $('#loginForm').classList.toggle('active', tab.dataset.auth === 'login');
    $('#registerForm').classList.toggle('active', tab.dataset.auth === 'register');
  }));

  function formatPhone(val) {
    let d = String(val).replace(/\D/g, '');
    if (d.startsWith('8')) d = '7' + d.slice(1);
    if (d && !d.startsWith('7')) d = '7' + d;
    d = d.slice(0, 11);
    if (!d) return '';
    let r = '+7';
    if (d.length > 1) r += ' (' + d.slice(1, 4);
    if (d.length > 4) r += ') ' + d.slice(4, 7);
    if (d.length > 7) r += '-' + d.slice(7, 9);
    if (d.length > 9) r += '-' + d.slice(9, 11);
    return r;
  }
  ['loginPhone', 'regPhone'].forEach(id => {
    const el = document.getElementById(id);
    el.addEventListener('input', () => { el.value = formatPhone(el.value); });
  });

  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    $('#loginError').textContent = '';
    try {
      await api('login', {
        phone: $('#loginPhone').value.trim(),
        password: $('#loginPassword').value
      });
      await refresh();
      showToast('Добро пожаловать!', 'success');
    } catch (err) {
      $('#loginError').textContent = err.message;
    }
  });

  $('#registerForm').addEventListener('submit', async e => {
    e.preventDefault();
    $('#registerError').textContent = '';
    try {
      await api('register', {
        firstName: $('#regFirstName').value.trim(),
        lastName: $('#regLastName').value.trim(),
        phone: $('#regPhone').value.trim(),
        password: $('#regPassword').value
      });
      await refresh();
      showToast('Аккаунт создан', 'success');
    } catch (err) {
      $('#registerError').textContent = err.message;
    }
  });

  $('#logoutBtn').addEventListener('click', async () => {
    try { await api('logout', {}); } catch {}
    S = { user: null, balance: 0, transactions: [], cards: [], pendingCards: [], deposits: [], crypto: {}, claimedTasks: [], hideBalance: false };
    showAuth();
  });

  $('#resetBtn').addEventListener('click', () => {
    showToast('На сервере сброс делается через админку/БД', 'error');
  });

  // ---------- NAV ----------
  let currentPage = 'dashboard';
  function showPage(id) {
    const p = document.getElementById('page-' + id);
    if (!p) return;
    $$('.page').forEach(x => x.classList.toggle('active', x === p));
    $$('.nav-item').forEach(x => x.classList.toggle('active', x.dataset.page === id));
    const nav = document.querySelector(`.nav-item[data-page="${id}"]`);
    $('#pageTitle').textContent = nav?.dataset.title || 'Обзор';
    $('#sidebar').classList.remove('open');
    currentPage = id;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (id === 'crypto') renderCrypto();
    if (id === 'analytics') renderAnalytics();
    if (id === 'tasks') renderTasks();
    if (id === 'deposits') renderDeposits();
    if (id === 'cards') renderCards();
  }
  $$('.nav-item').forEach(n => n.addEventListener('click', () => showPage(n.dataset.page)));
  $$('[data-page-target]').forEach(el => el.addEventListener('click', e => {
    e.preventDefault(); showPage(el.dataset.pageTarget);
  }));
  $('#menuBtn').addEventListener('click', () => $('#sidebar').classList.toggle('open'));

  // ---------- RENDER ----------
  function renderAll() {
    renderBalance();
    renderRecent();
    renderProgress();
    renderBonus();
    if (currentPage === 'crypto') renderCrypto();
    if (currentPage === 'analytics') renderAnalytics();
    if (currentPage === 'tasks') renderTasks();
    if (currentPage === 'deposits') renderDeposits();
    if (currentPage === 'cards') renderCards();
  }

  function renderBalance() {
    $('#balanceValue').textContent = S.hideBalance ? '••••••' : money(S.balance);
    $('#toggleBalance').textContent = S.hideBalance ? 'Показать' : 'Скрыть';
    const income = S.transactions.filter(t => t.direction === 'in').reduce((a, b) => a + b.amount, 0);
    const pct = income > 0 ? ((S.balance / income) * 100 - 100) : 0;
    const el = $('#balanceTrend');
    el.textContent = (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%';
    el.className = 'trend ' + (pct >= 0 ? 'up' : 'down');
  }

  function renderRecent() {
    const c = $('#recentTransactions');
    if (!S.transactions.length) {
      c.innerHTML = '<div class="transaction"><div class="transaction-info"><strong>Пока нет операций</strong><span>Сделайте первый перевод</span></div></div>';
      return;
    }
    c.innerHTML = S.transactions.slice(0, 6).map(t => {
      const isIn = t.direction === 'in';
      const dateStr = new Date(t.date).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
      const cat = CATEGORY_LABELS[t.category]
        || (t.category === 'welcome' ? 'Бонус'
        : t.category === 'task' ? 'Задание'
        : t.category === 'deposit' ? 'Вклад'
        : t.category === 'crypto' ? 'Крипта'
        : t.category === 'bonus' ? 'Бонус'
        : t.category);
      return `
        <div class="transaction">
          <div class="transaction-icon ${isIn ? 'income' : ''}">${isIn ? '↙' : '↗'}</div>
          <div class="transaction-info"><strong>${esc(t.description)}</strong><span>${esc(cat)}</span></div>
          <div class="transaction-date">${dateStr}</div>
          <div class="transaction-amount ${isIn ? 'income' : ''}">${isIn ? '+' : '−'} ${money(t.amount)}</div>
        </div>`;
    }).join('');
  }

  function renderProgress() {
    const done = S.claimedTasks.length;
    const total = TASK_LIST.length;
    $('#progressCard').innerHTML = `
      <div class="progress-text"><strong>${done}</strong> / ${total} заданий</div>
      <div class="progress-bar"><i style="width:${(done / total) * 100}%"></i></div>
      <div class="progress-text">+${moneyShort(done * 50)} бонусов</div>`;
    $('#tasksCounter').textContent = done + ' / ' + total;
  }

  function renderBonus() {
    const last = S.user?.lastBonusAt ? S.user.lastBonusAt * 1000 : 0;
    const elapsed = Date.now() - last;
    const left = Math.max(0, 3600000 - elapsed);
    const m = Math.floor(left / 60000);
    const s = Math.floor((left % 60000) / 1000);
    const ready = left === 0;
    $('#bonusCard').innerHTML = `
      <div class="bonus-icon">🎁</div>
      <div class="bonus-info">
        <strong>${ready ? 'Бонус готов!' : 'Часовой бонус +500 ₽'}</strong>
        <small>${ready ? 'Нажмите, чтобы забрать' : 'Следующий бонус через ' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0')}</small>
      </div>
      <button class="primary-btn" id="claimBonusBtn" ${ready ? '' : 'disabled'}>${ready ? 'Забрать +500 ₽' : 'Ждать'}</button>`;
    $('#claimBonusBtn')?.addEventListener('click', async () => {
      try {
        await api('hourly_bonus', {});
        await refresh();
        showToast('+500 ₽ получено!', 'success');
      } catch (err) { showToast(err.message, 'error'); }
    });
  }

  function renderCards() {
    const grid = $('#cardsGrid');
    if (!S.cards.length) {
      grid.innerHTML = '<div class="manage-card"><h3>Нет карт</h3><p class="meta">Выпустите первую — это займёт 5 минут.</p></div>';
    } else {
      grid.innerHTML = S.cards.map(c => {
        const pct = Math.min(100, (c.spent / c.limit) * 100);
        const over = c.spent > c.limit;
        return `
          <div class="manage-card">
            <h3>•••• ${esc(c.last4)}</h3>
            <p class="meta">${esc(c.type)} · ${c.frozen ? '❄ Заморожена' : 'Активна'}</p>
            <div class="card-limit">
              <div class="card-limit-labels">
                <span>Израсходовано: ${moneyShort(c.spent)}</span>
                <span>Лимит: ${moneyShort(c.limit)}</span>
              </div>
              <div class="card-limit-bar ${over ? 'over' : ''}"><i style="width:${pct}%"></i></div>
            </div>
          </div>`;
      }).join('');
    }
    renderPendingCards();
  }

  function renderPendingCards() {
    const wrap = $('#pendingCards');
    if (!S.pendingCards.length) { wrap.innerHTML = ''; return; }
    wrap.innerHTML = S.pendingCards.map(p => {
      const left = Math.max(0, p.readyAt - Date.now());
      const m = Math.floor(left / 60000);
      const s = Math.floor((left % 60000) / 1000);
      return `<div class="pending-card">
        <div><strong>Выпускается: ${esc(p.type)}</strong><small>По готовности появится в картах</small></div>
        <span class="countdown">${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}</span>
        <button class="release-now-btn" data-release="${p.id}">Выпустить за 250 ₽</button>
      </div>`;
    }).join('');

    wrap.querySelectorAll('[data-release]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Выпустить карту немедленно за 250 ₽?')) return;
        try {
          await api('card_release', { id: Number(btn.dataset.release) });
          await refresh();
          showToast('Карта выпущена!', 'success');
        } catch (err) { showToast(err.message, 'error'); }
      });
    });
  }

  function renderDeposits() {
    const grid = $('#depositsGrid');
    if (!S.deposits.length) {
      grid.innerHTML = '<div class="deposit-card"><h3>Нет вкладов</h3><p class="meta">Откройте вклад под процент.</p></div>';
      return;
    }
    grid.innerHTML = S.deposits.map(d => {
      const totalMs = d.termMonths * 30 * 86400000;
      const elapsed = Math.min(Date.now() - d.openedAt, totalMs);
      const progress = elapsed / totalMs;
      const interest = d.amount * (d.rate / 100) * (d.termMonths / 12) * progress;
      const total = d.amount + interest;
      const daysLeft = Math.max(0, Math.ceil((d.openedAt + totalMs - Date.now()) / 86400000));
      return `
        <div class="deposit-card">
          <h3>${moneyShort(d.amount)}</h3>
          <p class="rate">${d.rate}% годовых · ${d.termMonths} мес</p>
          <div class="row"><span>Начислено</span><span>+${money(interest)}</span></div>
          <div class="row"><span>К получению</span><span>${money(total)}</span></div>
          <div class="row"><span>Осталось дней</span><span>${daysLeft}</span></div>
          <button class="ghost-btn" data-close-deposit="${d.id}">Закрыть и получить</button>
        </div>`;
    }).join('');

    grid.querySelectorAll('[data-close-deposit]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const r = await api('deposit_close', { id: Number(btn.dataset.closeDeposit) });
          await refresh();
          showToast('Вклад закрыт: +' + money(r.total), 'success');
        } catch (err) { showToast(err.message, 'error'); }
      });
    });
  }

  function renderCrypto() {
    const grid = $('#cryptoGrid');
    let total = 0;
    Object.entries(S.crypto).forEach(([sym, h]) => {
      total += h.amount * (CRYPTO_META[sym]?.price || 0);
    });
    $('#cryptoPortfolio').textContent = 'Портфель: ' + moneyShort(total);

    grid.innerHTML = Object.entries(CRYPTO_META).map(([sym, meta]) => {
      const holding = S.crypto[sym];
      const holdText = holding
        ? `У вас: ${holding.amount.toFixed(6)} ${sym} · ${moneyShort(holding.amount * meta.price)}`
        : 'Нет в портфеле';
      return `
        <div class="crypto-card">
          <div class="crypto-card-header">
            <div><div class="crypto-symbol">${meta.symbol}</div></div>
            <div style="text-align:right">
              <div class="crypto-price">${moneyShort(meta.price)}</div>
            </div>
          </div>
          <div class="crypto-holding">${meta.name} · ${holdText}</div>
          <div class="crypto-actions">
            <button class="buy-btn" data-buy="${sym}">Купить</button>
            <button class="sell-btn" data-sell="${sym}" ${holding ? '' : 'disabled'}>Продать</button>
          </div>
        </div>`;
    }).join('');

    grid.querySelectorAll('[data-buy]').forEach(btn => btn.addEventListener('click', () => openCryptoModal(btn.dataset.buy, 'buy')));
    grid.querySelectorAll('[data-sell]').forEach(btn => btn.addEventListener('click', () => openCryptoModal(btn.dataset.sell, 'sell')));
  }

  function renderTasks() {
    const list = $('#tasksList');
    list.innerHTML = TASK_LIST.map(t => {
      const done = S.claimedTasks.includes(t.id);
      return `
        <div class="task-item ${done ? 'done' : ''}">
          <div class="task-icon">${done ? '✓' : '★'}</div>
          <div class="task-info"><strong>${esc(t.title)}</strong><small>${esc(t.desc)}</small></div>
          <div class="task-reward">${done ? 'Получено' : '+' + moneyShort(50)}</div>
          ${done ? '' : `<button class="primary-btn" data-task="${t.id}">Забрать</button>`}
        </div>`;
    }).join('');

    list.querySelectorAll('[data-task]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const r = await api('task_claim', { taskId: btn.dataset.task });
          await refresh();
          showToast('Задание выполнено: +' + moneyShort(r.reward), 'success');
        } catch (err) { showToast(err.message, 'error'); }
      });
    });
    $('#tasksCounter').textContent = S.claimedTasks.length + ' / ' + TASK_LIST.length;
  }

  function renderAnalytics() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const monthly = S.transactions.filter(t =>
      t.date >= monthStart && t.direction === 'out' && CATEGORY_LABELS[t.category]
    );
    const byCat = {};
    monthly.forEach(t => { byCat[t.category] = (byCat[t.category] || 0) + t.amount; });
    const total = Object.values(byCat).reduce((a, b) => a + b, 0);
    const monthName = now.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
    $('#analyticsMonth').textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    $('#analyticsTotal').textContent = 'Расходы: ' + money(total);
    $('#analyticsCount').textContent = monthly.length + ' операций';

    const empty = $('#analyticsEmpty');
    const bars = $('#analyticsBars');
    if (!total) { bars.innerHTML = ''; empty.hidden = false; return; }
    empty.hidden = true;
    const max = Math.max(...Object.values(byCat));
    bars.innerHTML = Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([cat, sum]) => {
      const pct = (sum / max) * 100;
      return `<div class="bar-row">
        <span>${esc(CATEGORY_LABELS[cat])}</span>
        <div><i style="width:${pct}%"></i></div>
        <strong>${moneyShort(sum)}</strong>
      </div>`;
    }).join('');
  }

  // ---------- MODAL ----------
  function openModal({ eyebrow = '', title, bodyHTML, submitLabel = 'Подтвердить', onSubmit }) {
    const modal = $('#modal');
    $('#modalEyebrow').textContent = eyebrow;
    $('#modalTitle').textContent = title;
    $('#modalBody').innerHTML = `
      <form id="modalForm">
        ${bodyHTML}
        <p class="modal-error" id="modalError"></p>
        <button type="submit" class="primary-btn full">${esc(submitLabel)}</button>
      </form>`;
    modal.classList.add('open');
    setTimeout(() => $('#modalBody').querySelector('input, select')?.focus(), 60);
    $('#modalForm').addEventListener('submit', async e => {
      e.preventDefault();
      $('#modalError').textContent = '';
      try {
        await onSubmit(new FormData(e.target));
        closeModal();
      } catch (err) { $('#modalError').textContent = err.message; }
    });
  }
  function closeModal() { $('#modal').classList.remove('open'); }
  document.querySelector('[data-close]').addEventListener('click', closeModal);
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // ---------- ДЕЙСТВИЯ ----------
  $$('[data-action]').forEach(btn => btn.addEventListener('click', () => {
    const a = btn.dataset.action;
    if (a === 'transfer') openTransfer();
    if (a === 'utilities') openBill('utilities', 'ЖКХ');
    if (a === 'mobile') openBill('mobile', 'Мобильная связь');
    if (a === 'taxes') openBill('taxes', 'Налоги');
    if (a === 'internet') openBill('internet', 'Интернет');
  }));

  function openTransfer() {
    openModal({
      eyebrow: 'ПЕРЕВОД', title: 'Перевести средства', submitLabel: 'Отправить',
      bodyHTML: `
        <label>Получатель<input name="recipient" placeholder="Имя или телефон"></label>
        <label>Сумма, ₽<input name="amount" placeholder="1 000" inputmode="decimal"></label>`,
      onSubmit: async form => {
        const recipient = String(form.get('recipient') || '').trim();
        const amount = parseMoney(form.get('amount'));
        if (recipient.length < 2) throw new Error('Укажите получателя');
        if (!Number.isFinite(amount) || amount <= 0) throw new Error('Некорректная сумма');
        await api('transfer', { recipient, amount });
        await refresh();
        showToast('Перевод выполнен', 'success');
      }
    });
  }

  function openBill(category, title) {
    const services = {
      utilities: ['Электроэнергия', 'Водоснабжение', 'Отопление', 'Вывоз мусора'],
      mobile: ['МТС', 'Билайн', 'МегаФон', 'Tele2'],
      taxes: ['НДФЛ', 'Транспортный налог', 'Земельный налог', 'Штраф ГИБДД'],
      internet: ['Ростелеком', 'Дом.ру', 'МТС Home', 'Билайн Home']
    };
    const opts = services[category].map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('');
    openModal({
      eyebrow: 'ОПЛАТА', title, submitLabel: 'Оплатить',
      bodyHTML: `
        <label>Услуга<select name="service">${opts}</select></label>
        <label>Номер / счёт<input name="account" placeholder="Лицевой счёт"></label>
        <label>Сумма, ₽<input name="amount" placeholder="1 000" inputmode="decimal"></label>`,
      onSubmit: async form => {
        const service = String(form.get('service') || '');
        const account = String(form.get('account') || '').trim();
        const amount = parseMoney(form.get('amount'));
        if (account.length < 4) throw new Error('Введите номер/счёт');
        if (!Number.isFinite(amount) || amount <= 0) throw new Error('Некорректная сумма');
        await api('pay', { category, service, account, amount });
        await refresh();
        showToast('Оплачено: ' + service, 'success');
      }
    });
  }

  $('#issueCardBtn').addEventListener('click', () => {
    if (S.pendingCards.length >= 2) { showToast('Максимум 2 карты в выпуске', 'error'); return; }
    openModal({
      eyebrow: 'ВЫПУСК КАРТЫ', title: 'Новая карта', submitLabel: 'Выпустить (5 мин)',
      bodyHTML: `
        <label>Тип карты
          <select name="type">
            <option>Виртуальная</option>
            <option>Пластиковая</option>
            <option>Металлическая</option>
          </select>
        </label>
        <p class="modal-note">Через 5 минут можно будет ускорить выпуск за 250 ₽.</p>`,
      onSubmit: async form => {
        await api('card_issue', { type: String(form.get('type')) });
        await refresh();
        showToast('Карта в выпуске', 'success');
      }
    });
  });

  $('#openDepositBtn').addEventListener('click', () => {
    openModal({
      eyebrow: 'ВКЛАД', title: 'Открыть вклад', submitLabel: 'Открыть',
      bodyHTML: `
        <label>Сумма, ₽<input name="amount" placeholder="10 000" inputmode="decimal"></label>
        <label>Срок
          <select name="term">
            <option value="3">3 месяца — 12%</option>
            <option value="6">6 месяцев — 14%</option>
            <option value="12">12 месяцев — 16%</option>
          </select>
        </label>`,
      onSubmit: async form => {
        const amount = parseMoney(form.get('amount'));
        const term = Number(form.get('term'));
        if (!Number.isFinite(amount) || amount < 1000) throw new Error('Минимум 1 000 ₽');
        await api('deposit_open', { amount, term });
        await refresh();
        showToast('Вклад открыт', 'success');
      }
    });
  });

  function openCryptoModal(symbol, mode) {
    const meta = CRYPTO_META[symbol];
    const price = meta.price;
    if (mode === 'buy') {
      const quick = [1000, 5000, 10000].map(v => `<button type="button" class="chip" data-quick-buy="${v}">${v.toLocaleString('ru-RU')} ₽</button>`).join('');
      openModal({
        eyebrow: 'ПОКУПКА', title: `Купить ${symbol}`, submitLabel: 'Купить',
        bodyHTML: `
          <p class="modal-note">${meta.name}: ${money(price)} / 1 ${symbol}</p>
          <label>Сумма в ₽
            <input name="rub" placeholder="10 000" inputmode="decimal">
          </label>
          <div class="quick-chips">${quick}<button type="button" class="chip" data-quick-buy="all">Все средства</button></div>
          <p class="modal-note" id="preview"></p>`,
        onSubmit: async form => {
          const rub = parseMoney(form.get('rub'));
          if (!Number.isFinite(rub) || rub <= 0) throw new Error('Укажите сумму');
          await api('crypto_buy', { symbol, rub });
          await refresh();
          showToast(`Куплено ${symbol}`, 'success');
        }
      });
      setTimeout(() => {
        const body = $('#modalBody');
        const input = body.querySelector('[name="rub"]');
        const preview = body.querySelector('#preview');
        function updatePreview() {
          const rub = parseMoney(input.value);
          if (rub > 0) preview.textContent = `Получите ≈ ${(rub / price).toFixed(6)} ${symbol}`;
          else preview.textContent = '';
        }
        input.addEventListener('input', updatePreview);
        body.querySelectorAll('[data-quick-buy]').forEach(b => b.addEventListener('click', () => {
          const v = b.dataset.quickBuy;
          input.value = v === 'all' ? Math.floor(S.balance) : v;
          updatePreview();
        }));
      }, 60);
    } else {
      const holding = S.crypto[symbol];
      if (!holding) return;
      const pct = p => (holding.amount * p / 100).toFixed(6);
      openModal({
        eyebrow: 'ПРОДАЖА', title: `Продать ${symbol}`, submitLabel: 'Продать',
        bodyHTML: `
          <p class="modal-note">У вас ${holding.amount.toFixed(6)} ${symbol} · ${money(holding.amount * price)}</p>
          <label>Количество ${symbol}
            <input name="amount" placeholder="0.001" inputmode="decimal">
          </label>
          <div class="quick-chips">
            <button type="button" class="chip" data-sell-pct="25">25%</button>
            <button type="button" class="chip" data-sell-pct="50">50%</button>
            <button type="button" class="chip" data-sell-pct="75">75%</button>
            <button type="button" class="chip" data-sell-pct="100">Всё</button>
          </div>
          <p class="modal-note" id="preview"></p>`,
        onSubmit: async form => {
          const qty = parseMoney(form.get('amount'));
          if (!Number.isFinite(qty) || qty <= 0) throw new Error('Некорректное количество');
          await api('crypto_sell', { symbol, amount: qty });
          await refresh();
          showToast(`Продано ${qty.toFixed(6)} ${symbol}`, 'success');
        }
      });
      setTimeout(() => {
        const body = $('#modalBody');
        const input = body.querySelector('[name="amount"]');
        const preview = body.querySelector('#preview');
        function upd() {
          const q = parseMoney(input.value);
          if (q > 0) preview.textContent = `Получите ≈ ${money(q * price)}`;
          else preview.textContent = '';
        }
        input.addEventListener('input', upd);
        body.querySelectorAll('[data-sell-pct]').forEach(b => b.addEventListener('click', () => {
          const p = Number(b.dataset.sellPct);
          input.value = (holding.amount * p / 100).toFixed(8);
          upd();
        }));
      }, 60);
    }
  }

  $('#toggleBalance').addEventListener('click', async () => {
    S.hideBalance = !S.hideBalance;
    renderBalance();
    try { await api('setting', { key: 'hideBalance', value: S.hideBalance }); } catch {}
    $('#setHideBalance').checked = S.hideBalance;
  });
  $('#setHideBalance').addEventListener('change', async e => {
    S.hideBalance = e.target.checked;
    renderBalance();
    try { await api('setting', { key: 'hideBalance', value: S.hideBalance }); } catch {}
  });
  $('#setNotifications').addEventListener('change', async e => {
    try { await api('setting', { key: 'notifications', value: e.target.checked }); } catch {}
  });

  // ---------- TOAST ----------
  let toastTimer;
  function showToast(msg, type = '') {
    const t = $('#toast');
    clearTimeout(toastTimer);
    t.textContent = msg;
    t.className = 'toast show ' + type;
    toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
  }

  // ---------- ТИКЕРЫ ----------
  let started = false;
  function startTickers() {
    if (started) return;
    started = true;
    setInterval(async () => {
      if (currentPage === 'dashboard') renderBonus();
      if (currentPage === 'cards') renderPendingCards();
      // Проверяем выпущенные карты на сервере — он сам их "закрывает" по времени
      if (S.pendingCards.some(p => p.readyAt <= Date.now())) {
        try { await refresh(); } catch {}
      }
    }, 3000);
  }

  // ---------- BOOT ----------
  refresh().catch(() => showAuth());
})();