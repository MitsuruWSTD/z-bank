/* ================================================================
   Z-Bank Demo. Демо на клиенте. Не подключать к реальным деньгам.
   ================================================================ */

const STORAGE_KEY = 'zbank_v2_state';
const WELCOME_BONUS = 500;
const TASK_REWARD = 50;
const CARD_ISSUE_MS = 5 * 60 * 1000;
const MONTHLY_LIMIT = 500000;

const CATEGORY_LABELS = {
  transfer: 'Переводы',
  utilities: 'ЖКХ',
  mobile: 'Связь',
  taxes: 'Налоги',
  internet: 'Интернет',
  card: 'Карты'
};

const TASKS = [
  { id: 'card',        title: 'Выпустить первую карту',    desc: 'Готовую карту после 5 минут', check: s => s.cards.length > 0 },
  { id: 'transfer',    title: 'Совершить перевод',         desc: 'Любая сумма на любой номер',   check: s => s.transactions.some(t => t.category === 'transfer') },
  { id: 'deposit',     title: 'Открыть вклад',             desc: 'С любой суммой и ставкой',     check: s => s.deposits.length > 0 },
  { id: 'utilities',   title: 'Оплатить ЖКХ',              desc: 'Коммунальные услуги',          check: s => s.transactions.some(t => t.category === 'utilities') },
  { id: 'taxes',       title: 'Оплатить налоги',           desc: 'Штрафы и сборы',               check: s => s.transactions.some(t => t.category === 'taxes') },
  { id: 'mobile',      title: 'Пополнить мобильный',       desc: 'Связь любого оператора',       check: s => s.transactions.some(t => t.category === 'mobile') },
  { id: 'internet',    title: 'Оплатить интернет',         desc: 'Провайдер',                    check: s => s.transactions.some(t => t.category === 'internet') },
  { id: 'crypto',      title: 'Купить криптовалюту',       desc: 'BTC, ETH, SOL или TON',        check: s => Object.keys(s.crypto).length > 0 }
];

const CRYPTO_META = {
  BTC: { name: 'Bitcoin',  symbol: '₿' },
  ETH: { name: 'Ethereum', symbol: 'Ξ' },
  SOL: { name: 'Solana',   symbol: '◎' },
  TON: { name: 'Toncoin',  symbol: '◆' }
};

const cryptoPrices = {
  BTC: { price: 6500000, dayOpen: 6500000 },
  ETH: { price: 320000,  dayOpen: 320000 },
  SOL: { price: 14500,   dayOpen: 14500 },
  TON: { price: 620,     dayOpen: 620 }
};

/* -------- STATE -------- */
let state = loadState();

function defaultState() {
  return {
    user: null,
    balance: 0,
    transactions: [],
    cards: [],
    pendingCards: [],
    deposits: [],
    crypto: {},
    claimedTasks: [],
    settings: { hideBalance: false, notifications: true }
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultState(), ...JSON.parse(raw) } : defaultState();
  } catch {
    return defaultState();
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* -------- UTILS -------- */
const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

const money = n => new Intl.NumberFormat('ru-RU', {
  style: 'currency', currency: 'RUB', minimumFractionDigits: 2, maximumFractionDigits: 2
}).format(n);

const moneyShort = n => new Intl.NumberFormat('ru-RU', {
  style: 'currency', currency: 'RUB', maximumFractionDigits: 0
}).format(n);

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const parseMoney = v => Number(String(v).replace(/\s/g, '').replace(',', '.'));

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const initials = (f, l) => ((f?.[0] || '') + (l?.[0] || '')).toUpperCase() || '--';

const formatPhone = val => {
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
};

/* -------- VALIDATION -------- */
const NAME_RE = /^[А-ЯЁ][а-яё]{1,29}$/;
const PHONE_RE = /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/;
const PASSWORD_RE = /^(?=.*[A-Za-zА-Яа-яЁё])(?=.*\d).{8,}$/;

function validateRegistration(data) {
  if (!NAME_RE.test(data.firstName)) return 'Имя: только кириллица, первая заглавная, 2–30 букв.';
  if (!NAME_RE.test(data.lastName))  return 'Фамилия: только кириллица, первая заглавная, 2–30 букв.';
  if (!PHONE_RE.test(data.phone))    return 'Телефон в формате +7 (XXX) XXX-XX-XX.';
  if (!PASSWORD_RE.test(data.password)) return 'Пароль: минимум 8 символов, содержит буквы и цифры.';
  return null;
}

/* -------- AUTH -------- */
function showAuth() {
  $('#authScreen').hidden = false;
  $('#appScreen').hidden = true;
}

function showApp() {
  $('#authScreen').hidden = true;
  $('#appScreen').hidden = false;
  renderAll();
  startTickers();
  if (state.user) {
    const ini = initials(state.user.firstName, state.user.lastName);
    $('#userAvatar').textContent = ini;
    $('#userAvatarTop').textContent = ini;
    $('#userName').textContent = `${state.user.firstName} ${state.user.lastName}`;
    $('#cardHolder').textContent = `${state.user.firstName[0]}. ${state.user.lastName.toUpperCase()}`;
  }
}

document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    $$('.auth-tab').forEach(t => t.classList.toggle('active', t === tab));
    $$('.auth-form').forEach(f => f.classList.remove('active'));
    $('#loginForm').classList.toggle('active', tab.dataset.auth === 'login');
    $('#registerForm').classList.toggle('active', tab.dataset.auth === 'register');
  });
});

// auto-format phone inputs
['loginPhone', 'regPhone'].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('input', () => {
    el.value = formatPhone(el.value);
  });
});

$('#loginForm').addEventListener('submit', e => {
  e.preventDefault();
  const err = $('#loginError');
  err.textContent = '';

  const phone = $('#loginPhone').value.trim();
  const password = $('#loginPassword').value;

  if (!state.user) { err.textContent = 'Аккаунта нет. Зарегистрируйтесь.'; return; }
  if (state.user.phone !== phone) { err.textContent = 'Неверный номер телефона.'; return; }
  if (state.user.password !== password) { err.textContent = 'Неверный пароль.'; return; }

  showApp();
  showToast('Добро пожаловать, ' + state.user.firstName + '!', 'success');
});

$('#registerForm').addEventListener('submit', e => {
  e.preventDefault();
  const err = $('#registerError');
  err.textContent = '';

  const data = {
    firstName: $('#regFirstName').value.trim(),
    lastName: $('#regLastName').value.trim(),
    phone: $('#regPhone').value.trim(),
    password: $('#regPassword').value
  };

  const validationError = validateRegistration(data);
  if (validationError) { err.textContent = validationError; return; }

  if (state.user && state.user.phone === data.phone) {
    err.textContent = 'Аккаунт с этим номером уже существует.'; return;
  }

  state.user = { ...data, createdAt: Date.now() };
  state.balance = WELCOME_BONUS;
  addTransaction({
    direction: 'in', amount: WELCOME_BONUS, category: 'welcome',
    description: 'Приветственный бонус'
  });

  save();
  showApp();
  showToast('Аккаунт создан. Начислено ' + money(WELCOME_BONUS), 'success');
});

$('#logoutBtn').addEventListener('click', () => {
  showAuth();
});

$('#resetBtn').addEventListener('click', () => {
  if (confirm('Удалить аккаунт и всю историю?')) {
    localStorage.removeItem(STORAGE_KEY);
    state = defaultState();
    showAuth();
  }
});

/* -------- NAVIGATION -------- */
let currentPage = 'dashboard';

function showPage(id) {
  const page = document.getElementById('page-' + id);
  if (!page) return;
  $$('.page').forEach(p => p.classList.toggle('active', p === page));
  $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === id));
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
  e.preventDefault();
  showPage(el.dataset.pageTarget);
}));

$('#menuBtn').addEventListener('click', () => $('#sidebar').classList.toggle('open'));

/* -------- TRANSACTIONS -------- */
function addTransaction({ direction, amount, category, description }) {
  state.transactions.unshift({
    id: uid(),
    direction,
    amount,
    category,
    description,
    date: Date.now()
  });
  if (state.transactions.length > 200) state.transactions.length = 200;
}

function debit(amount, category, description) {
  if (amount <= 0) throw new Error('Сумма должна быть больше нуля');
  if (amount > state.balance) throw new Error('Недостаточно средств');
  state.balance -= amount;
  addTransaction({ direction: 'out', amount, category, description });
  // списываем с первой карты лимит
  if (state.cards.length) state.cards[0].spent = (state.cards[0].spent || 0) + amount;
  save();
  checkTasks();
  renderAll();
}

function credit(amount, category, description) {
  state.balance += amount;
  addTransaction({ direction: 'in', amount, category, description });
  save();
  renderAll();
}

/* -------- RENDER -------- */
function renderAll() {
  renderBalance();
  renderRecent();
  renderCards();
  renderProgress();
  if (currentPage === 'analytics') renderAnalytics();
  if (currentPage === 'tasks') renderTasks();
  if (currentPage === 'deposits') renderDeposits();
  if (currentPage === 'crypto') renderCrypto();
}

function renderBalance() {
  const hidden = state.settings.hideBalance;
  $('#balanceValue').textContent = hidden ? '••••••' : money(state.balance);
  $('#toggleBalance').textContent = hidden ? 'Показать' : 'Скрыть';

  const income = state.transactions.filter(t => t.direction === 'in').reduce((a, b) => a + b.amount, 0);
  const outgoing = state.transactions.filter(t => t.direction === 'out').reduce((a, b) => a + b.amount, 0);
  const pct = income > 0 ? ((state.balance / income) * 100 - 100) : 0;
  const el = $('#balanceTrend');
  el.textContent = (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%';
  el.className = 'trend ' + (pct >= 0 ? 'up' : 'down');
}

function renderRecent() {
  const container = $('#recentTransactions');
  const items = state.transactions.slice(0, 6);
  if (!items.length) {
    container.innerHTML = '<div class="transaction"><div class="transaction-info"><strong>Пока нет операций</strong><span>Сделайте первый перевод или оплату</span></div></div>';
    return;
  }
  container.innerHTML = items.map(t => {
    const isIn = t.direction === 'in';
    const icon = isIn ? '↙' : '↗';
    const d = new Date(t.date);
    const dateStr = d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    return `
      <div class="transaction">
        <div class="transaction-icon ${isIn ? 'income' : ''}">${icon}</div>
        <div class="transaction-info">
          <strong>${esc(t.description)}</strong>
          <span>${esc(CATEGORY_LABELS[t.category] || (t.category === 'welcome' ? 'Бонус' : t.category === 'task' ? 'Задание' : t.category === 'deposit' ? 'Вклад' : t.category === 'crypto' ? 'Крипта' : t.category))}</span>
        </div>
        <div class="transaction-date">${dateStr}</div>
        <div class="transaction-amount ${isIn ? 'income' : ''}">${isIn ? '+' : '−'} ${money(t.amount)}</div>
      </div>`;
  }).join('');
}

function renderProgress() {
  const done = state.claimedTasks.length;
  const total = TASKS.length;
  $('#progressCard').innerHTML = `
    <div class="progress-text"><strong>${done}</strong> / ${total} заданий</div>
    <div class="progress-bar"><i style="width:${(done / total) * 100}%"></i></div>
    <div class="progress-text">+${moneyShort(done * TASK_REWARD)} бонусов</div>
  `;
  $('#tasksCounter').textContent = `${done} / ${total}`;
}

function renderCards() {
  const grid = $('#cardsGrid');
  if (!state.cards.length) {
    grid.innerHTML = '<div class="manage-card"><h3>Нет карт</h3><p class="meta">Выпустите первую карту — это займёт 5 минут.</p></div>';
  } else {
    grid.innerHTML = state.cards.map(c => {
      const spentPct = Math.min(100, (c.spent / c.limit) * 100);
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
            <div class="card-limit-bar ${over ? 'over' : ''}"><i style="width:${spentPct}%"></i></div>
          </div>
          <div class="manage-actions">
            <button class="freeze-btn ${c.frozen ? 'active' : ''}" data-freeze="${c.id}">
              ${c.frozen ? 'Разморозить' : 'Заморозить'}
            </button>
            <button class="ghost-btn" data-reset-limit="${c.id}">Сбросить лимит</button>
          </div>
        </div>`;
    }).join('');
  }

  grid.querySelectorAll('[data-freeze]').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = state.cards.find(c => c.id === btn.dataset.freeze);
      if (!card) return;
      card.frozen = !card.frozen;
      save();
      renderCards();
      showToast(`Карта •••• ${card.last4} ${card.frozen ? 'заморожена' : 'разморожена'}`);
    });
  });

  grid.querySelectorAll('[data-reset-limit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = state.cards.find(c => c.id === btn.dataset.resetLimit);
      if (!card) return;
      card.spent = 0;
      save();
      renderCards();
      showToast('Лимит по карте сброшен');
    });
  });

  renderPendingCards();
}

function renderPendingCards() {
  const wrap = $('#pendingCards');
  if (!state.pendingCards.length) { wrap.innerHTML = ''; return; }
  wrap.innerHTML = state.pendingCards.map(p => {
    const left = Math.max(0, p.readyAt - Date.now());
    const m = Math.floor(left / 60000);
    const s = Math.floor((left % 60000) / 1000);
    return `<div class="pending-card">
      <div>
        <strong>Выпускается: ${esc(p.type)}</strong>
        <small>Карта появится по готовности</small>
      </div>
      <span class="countdown">${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}</span>
    </div>`;
  }).join('');
}

function renderDeposits() {
  const grid = $('#depositsGrid');
  if (!state.deposits.length) {
    grid.innerHTML = '<div class="deposit-card"><h3>Нет вкладов</h3><p class="meta">Откройте вклад под процент и получайте доход.</p></div>';
    return;
  }
  grid.innerHTML = state.deposits.map(d => {
    const info = depositInfo(d);
    const daysLeft = Math.max(0, Math.ceil((d.openedAt + d.termMonths * 30 * 86400000 - Date.now()) / 86400000));
    return `
      <div class="deposit-card">
        <h3>${moneyShort(d.amount)}</h3>
        <p class="rate">${d.rate}% годовых · ${d.termMonths} мес</p>
        <div class="row"><span>Начислено</span><span>+${money(info.interest)}</span></div>
        <div class="row"><span>К получению</span><span>${money(info.total)}</span></div>
        <div class="row"><span>Осталось дней</span><span>${daysLeft}</span></div>
        <button class="ghost-btn" data-close-deposit="${d.id}">Закрыть и получить</button>
      </div>`;
  }).join('');

  grid.querySelectorAll('[data-close-deposit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = state.deposits.findIndex(d => d.id === btn.dataset.closeDeposit);
      if (idx < 0) return;
      const d = state.deposits[idx];
      const info = depositInfo(d);
      state.deposits.splice(idx, 1);
      credit(info.total, 'deposit', `Закрытие вклада (${d.rate}%)`);
      showToast(`Вклад закрыт: +${money(info.total)}`, 'success');
    });
  });
}

function depositInfo(d) {
  const totalMs = d.termMonths * 30 * 86400000;
  const elapsed = Math.min(Date.now() - d.openedAt, totalMs);
  const progress = elapsed / totalMs;
  const interest = d.amount * (d.rate / 100) * (d.termMonths / 12) * progress;
  return { interest, total: d.amount + interest };
}

function renderCrypto() {
  const grid = $('#cryptoGrid');
  let total = 0;
  Object.entries(state.crypto).forEach(([sym, h]) => {
    const p = cryptoPrices[sym]?.price || 0;
    total += h.amount * p;
  });
  $('#cryptoPortfolio').textContent = 'Портфель: ' + moneyShort(total);

  grid.innerHTML = Object.entries(CRYPTO_META).map(([sym, meta]) => {
    const p = cryptoPrices[sym];
    const change = ((p.price - p.dayOpen) / p.dayOpen) * 100;
    const cls = change >= 0 ? 'up' : 'down';
    const sign = change >= 0 ? '+' : '';
    const holding = state.crypto[sym];
    const holdText = holding
      ? `У вас: ${holding.amount.toFixed(4)} ${sym} · ${moneyShort(holding.amount * p.price)}`
      : 'Нет в портфеле';
    return `
      <div class="crypto-card">
        <div class="crypto-card-header">
          <div>
            <div class="crypto-symbol">${meta.symbol}</div>
          </div>
          <div style="text-align:right">
            <div class="crypto-price">${moneyShort(p.price)}</div>
            <div class="crypto-change trend ${cls}">${sign}${change.toFixed(2)}%</div>
          </div>
        </div>
        <div class="crypto-holding">${meta.name} · ${holdText}</div>
        <div class="crypto-actions">
          <button class="buy-btn" data-buy="${sym}">Купить</button>
          <button class="sell-btn" data-sell="${sym}" ${holding ? '' : 'disabled'}>Продать</button>
        </div>
      </div>`;
  }).join('');

  grid.querySelectorAll('[data-buy]').forEach(btn => {
    btn.addEventListener('click', () => openCryptoModal(btn.dataset.buy, 'buy'));
  });
  grid.querySelectorAll('[data-sell]').forEach(btn => {
    btn.addEventListener('click', () => openCryptoModal(btn.dataset.sell, 'sell'));
  });
}

function renderTasks() {
  const list = $('#tasksList');
  list.innerHTML = TASKS.map(t => {
    const done = state.claimedTasks.includes(t.id);
    return `
      <div class="task-item ${done ? 'done' : ''}">
        <div class="task-icon">${done ? '✓' : '★'}</div>
        <div class="task-info">
          <strong>${esc(t.title)}</strong>
          <small>${esc(t.desc)}</small>
        </div>
        <div class="task-reward">${done ? 'Получено' : '+' + moneyShort(TASK_REWARD)}</div>
      </div>`;
  }).join('');
  $('#tasksCounter').textContent = `${state.claimedTasks.length} / ${TASKS.length}`;
}

function checkTasks() {
  TASKS.forEach(t => {
    if (state.claimedTasks.includes(t.id)) return;
    if (!t.check(state)) return;
    state.claimedTasks.push(t.id);
    state.balance += TASK_REWARD;
    addTransaction({
      direction: 'in', amount: TASK_REWARD, category: 'task',
      description: 'Бонус за задание: ' + t.title
    });
    save();
    if (state.settings.notifications) showToast(`Задание выполнено: ${t.title} (+${moneyShort(TASK_REWARD)})`, 'success');
  });
}

function renderAnalytics() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const monthly = state.transactions.filter(t =>
    t.date >= monthStart && t.direction === 'out' && CATEGORY_LABELS[t.category]
  );

  const byCat = {};
  monthly.forEach(t => {
    byCat[t.category] = (byCat[t.category] || 0) + t.amount;
  });

  const total = Object.values(byCat).reduce((a, b) => a + b, 0);
  const monthName = now.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
  $('#analyticsMonth').textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  $('#analyticsTotal').textContent = 'Расходы: ' + money(total);
  $('#analyticsCount').textContent = monthly.length + ' операций';

  const empty = $('#analyticsEmpty');
  const bars = $('#analyticsBars');

  if (!total) {
    bars.innerHTML = '';
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  const max = Math.max(...Object.values(byCat));
  bars.innerHTML = Object.entries(byCat)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, sum]) => {
      const pct = (sum / max) * 100;
      return `<div class="bar-row">
        <span>${esc(CATEGORY_LABELS[cat])}</span>
        <div><i style="width:${pct}%"></i></div>
        <strong>${moneyShort(sum)}</strong>
      </div>`;
    }).join('');
}

/* -------- MODAL -------- */
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

  $('#modalForm').addEventListener('submit', e => {
    e.preventDefault();
    const errEl = $('#modalError');
    errEl.textContent = '';
    try {
      const result = onSubmit(new FormData(e.target));
      if (result === false) return;
      closeModal();
    } catch (err) {
      errEl.textContent = err.message || 'Ошибка';
    }
  });
}

function closeModal() {
  $('#modal').classList.remove('open');
}

document.querySelector('[data-close]').addEventListener('click', closeModal);
$('#modal').addEventListener('click', e => {
  if (e.target.id === 'modal') closeModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

/* -------- PAYMENTS -------- */
$$('[data-action]').forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    if (action === 'transfer') openTransferModal();
    if (action === 'utilities') openBillModal('utilities', 'ЖКХ');
    if (action === 'mobile') openBillModal('mobile', 'Мобильная связь');
    if (action === 'taxes') openBillModal('taxes', 'Налоги');
    if (action === 'internet') openBillModal('internet', 'Интернет');
  });
});

function openTransferModal() {
  openModal({
    eyebrow: 'ПЕРЕВОД',
    title: 'Перевести средства',
    submitLabel: 'Отправить',
    bodyHTML: `
      <label>Получатель
        <input name="recipient" placeholder="Имя или телефон" autocomplete="off">
      </label>
      <label>Сумма, ₽
        <input name="amount" placeholder="1 000" inputmode="decimal" autocomplete="off">
      </label>
    `,
    onSubmit: form => {
      const recipient = String(form.get('recipient') || '').trim();
      const amount = parseMoney(form.get('amount'));
      if (recipient.length < 2) throw new Error('Укажите получателя');
      if (!Number.isFinite(amount) || amount <= 0) throw new Error('Некорректная сумма');
      debit(amount, 'transfer', 'Перевод: ' + recipient);
      showToast(`Перевод на ${money(amount)} выполнен`, 'success');
    }
  });
}

function openBillModal(category, title) {
  const services = {
    utilities: ['Электроэнергия', 'Водоснабжение', 'Отопление', 'Вывоз мусора'],
    mobile: ['МТС', 'Билайн', 'МегаФон', 'Tele2'],
    taxes: ['НДФЛ', 'Транспортный налог', 'Земельный налог', 'Штраф ГИБДД'],
    internet: ['Ростелеком', 'Дом.ру', 'МТС Home', 'Билайн Home']
  };
  const options = services[category].map((s, i) =>
    `<option value="${i}">${esc(s)}</option>`).join('');

  openModal({
    eyebrow: 'ОПЛАТА',
    title,
    submitLabel: 'Оплатить',
    bodyHTML: `
      <label>Услуга
        <select name="service">${options}</select>
      </label>
      <label>Номер / счёт
        <input name="account" placeholder="Лицевой счёт" autocomplete="off">
      </label>
      <label>Сумма, ₽
        <input name="amount" placeholder="1 000" inputmode="decimal" autocomplete="off">
      </label>
    `,
    onSubmit: form => {
      const service = services[category][+form.get('service')];
      const account = String(form.get('account') || '').trim();
      const amount = parseMoney(form.get('amount'));
      if (account.length < 4) throw new Error('Введите номер/счёт');
      if (!Number.isFinite(amount) || amount <= 0) throw new Error('Некорректная сумма');
      debit(amount, category, `${service} · ${account.slice(-4).padStart(4, '•')}`);
      showToast(`Оплачено: ${service}`, 'success');
    }
  });
}

/* -------- CARDS ISSUE -------- */
$('#issueCardBtn').addEventListener('click', () => {
  if (state.pendingCards.length >= 2) {
    showToast('Максимум 2 карты в выпуске одновременно', 'error');
    return;
  }
  openModal({
    eyebrow: 'ВЫПУСК КАРТЫ',
    title: 'Новая карта',
    submitLabel: 'Выпустить (5 мин)',
    bodyHTML: `
      <label>Тип карты
        <select name="type">
          <option>Виртуальная</option>
          <option>Пластиковая</option>
          <option>Металлическая</option>
        </select>
      </label>
      <p class="modal-note">Карта будет выпущена через 5 минут и появится в разделе «Мои карты».</p>
    `,
    onSubmit: form => {
      state.pendingCards.push({
        id: uid(),
        type: String(form.get('type')),
        readyAt: Date.now() + CARD_ISSUE_MS
      });
      save();
      renderCards();
      showToast('Карта в выпуске. Ожидайте 5 минут.', 'success');
    }
  });
});

/* -------- DEPOSITS -------- */
$('#openDepositBtn').addEventListener('click', () => {
  openModal({
    eyebrow: 'ВКЛАД',
    title: 'Открыть вклад',
    submitLabel: 'Открыть',
    bodyHTML: `
      <label>Сумма, ₽
        <input name="amount" placeholder="10 000" inputmode="decimal">
      </label>
      <label>Срок
        <select name="term">
          <option value="3">3 месяца — 12%</option>
          <option value="6">6 месяцев — 14%</option>
          <option value="12">12 месяцев — 16%</option>
        </select>
      </label>
      <p class="modal-note">Доход рассчитывается пропорционально времени. Закрыть можно в любой момент.</p>
    `,
    onSubmit: form => {
      const amount = parseMoney(form.get('amount'));
      const term = +form.get('term');
      if (!Number.isFinite(amount) || amount < 1000) throw new Error('Минимум 1 000 ₽');
      if (amount > state.balance) throw new Error('Недостаточно средств');
      state.balance -= amount;
      addTransaction({ direction: 'out', amount, category: 'deposit', description: `Открытие вклада на ${term} мес` });
      const rates = { 3: 12, 6: 14, 12: 16 };
      state.deposits.push({
        id: uid(), amount, termMonths: term, rate: rates[term],
        openedAt: Date.now()
      });
      save();
      checkTasks();
      renderAll();
      renderDeposits();
      showToast('Вклад открыт', 'success');
    }
  });
});

/* -------- CRYPTO TRADE -------- */
function openCryptoModal(symbol, mode) {
  const meta = CRYPTO_META[symbol];
  const price = cryptoPrices[symbol].price;
  const holding = state.crypto[symbol];

  if (mode === 'buy') {
    openModal({
      eyebrow: 'ПОКУПКА',
      title: `Купить ${symbol}`,
      submitLabel: 'Купить',
      bodyHTML: `
        <p class="modal-note">${meta.name}: ${money(price)} / 1 ${symbol}</p>
        <label>Сумма в ₽
          <input name="rub" placeholder="10 000" inputmode="decimal">
        </label>
        <label>Или количество ${symbol}
          <input name="amount" placeholder="0.001" inputmode="decimal">
        </label>
      `,
      onSubmit: form => {
        const rub = parseMoney(form.get('rub'));
        const amt = parseMoney(form.get('amount'));
        let qty;
        if (rub > 0) {
          if (rub > state.balance) throw new Error('Недостаточно средств');
          qty = rub / price;
        } else if (amt > 0) {
          qty = amt;
          const cost = qty * price;
          if (cost > state.balance) throw new Error('Недостаточно средств');
        } else {
          throw new Error('Укажите сумму или количество');
        }
        const cost = qty * price;
        state.balance -= cost;
        addTransaction({ direction: 'out', amount: cost, category: 'crypto', description: `Покупка ${symbol}` });
        const h = state.crypto[symbol] || { amount: 0, avgPrice: 0 };
        const newAmount = h.amount + qty;
        h.avgPrice = newAmount > 0 ? (h.amount * h.avgPrice + qty * price) / newAmount : price;
        h.amount = newAmount;
        state.crypto[symbol] = h;
        save();
        checkTasks();
        renderAll();
        showToast(`Куплено ${qty.toFixed(6)} ${symbol}`, 'success');
      }
    });
  } else {
    if (!holding || holding.amount <= 0) return;
    openModal({
      eyebrow: 'ПРОДАЖА',
      title: `Продать ${symbol}`,
      submitLabel: 'Продать',
      bodyHTML: `
        <p class="modal-note">У вас ${holding.amount.toFixed(6)} ${symbol} · ${money(holding.amount * price)}</p>
        <label>Количество ${symbol}
          <input name="amount" placeholder="0.001" inputmode="decimal">
        </label>
      `,
      onSubmit: form => {
        const qty = parseMoney(form.get('amount'));
        if (!Number.isFinite(qty) || qty <= 0) throw new Error('Некорректное количество');
        if (qty > holding.amount) throw new Error('Недостаточно средств');
        const proceeds = qty * price;
        holding.amount -= qty;
        if (holding.amount < 1e-9) delete state.crypto[symbol];
        state.balance += proceeds;
        addTransaction({ direction: 'in', amount: proceeds, category: 'crypto', description: `Продажа ${symbol}` });
        save();
        renderAll();
        showToast(`Продано ${qty.toFixed(6)} ${symbol} за ${money(proceeds)}`, 'success');
      }
    });
  }
}

/* -------- SETTINGS -------- */
$('#toggleBalance').addEventListener('click', () => {
  state.settings.hideBalance = !state.settings.hideBalance;
  save();
  renderBalance();
  $('#setHideBalance').checked = state.settings.hideBalance;
});

$('#setHideBalance').checked = state.settings.hideBalance;
$('#setHideBalance').addEventListener('change', e => {
  state.settings.hideBalance = e.target.checked;
  save();
  renderBalance();
});

$('#setNotifications').checked = state.settings.notifications;
$('#setNotifications').addEventListener('change', e => {
  state.settings.notifications = e.target.checked;
  save();
});

/* -------- TOAST -------- */
let toastTimer;
function showToast(msg, type = '') {
  const toast = $('#toast');
  if (!state.settings.notifications && type !== 'error') return;
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.className = 'toast show ' + type;
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

/* -------- TICKERS -------- */
let tickersStarted = false;
function startTickers() {
  if (tickersStarted) return;
  tickersStarted = true;

  // крипта
  setInterval(() => {
    Object.values(cryptoPrices).forEach(p => {
      const change = (Math.random() - 0.5) * 0.02;
      p.price = Math.max(1, p.price * (1 + change));
    });
    if (currentPage === 'crypto') renderCrypto();
  }, 3000);

  // 5-минутный выпуск карт
  setInterval(() => {
    const now = Date.now();
    const ready = state.pendingCards.filter(c => c.readyAt <= now);
    if (ready.length) {
      ready.forEach(p => {
        state.cards.push({
          id: p.id, type: p.type,
          last4: String(Math.floor(Math.random() * 10000)).padStart(4, '0'),
          limit: MONTHLY_LIMIT, spent: 0, frozen: false, issuedAt: now
        });
      });
      state.pendingCards = state.pendingCards.filter(c => c.readyAt > now);
      save();
      renderCards();
      checkTasks();
      ready.forEach(() => showToast('🎉 Карта выпущена!', 'success'));
    } else if (state.pendingCards.length) {
      renderPendingCards();
    }
  }, 1000);
}

/* -------- BOOT -------- */
(function boot() {
  if (state.user) {
    showApp();
  } else {
    showAuth();
  }
})();