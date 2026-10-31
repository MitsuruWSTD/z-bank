<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Z-Bank — Private Banking</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <!-- SPLASH -->
  <div class="splash" id="splash">
    <div class="splash-inner">
      <div class="splash-mark">Z</div>
      <p class="splash-text">Рады видеть снова!</p>
    </div>
  </div>

  <div class="noise"></div>

  <!-- AUTH -->
  <div class="auth" id="authScreen">
    <div class="auth-card">
      <div class="brand">
        <span class="brand-mark">Z</span>
        <div>
          <strong>Z-BANK</strong>
          <small>PRIVATE BANKING</small>
        </div>
      </div>

      <div class="auth-tabs">
        <button class="auth-tab active" data-auth="login">Вход</button>
        <button class="auth-tab" data-auth="register">Регистрация</button>
      </div>

      <form id="loginForm" class="auth-form active" novalidate>
        <label>Номер телефона
          <input type="tel" id="loginPhone" placeholder="+7 (999) 123-45-67" autocomplete="tel">
        </label>
        <label>Пароль
          <input type="password" id="loginPassword" placeholder="••••••••" autocomplete="current-password">
        </label>
        <p class="form-error" id="loginError"></p>
        <button type="submit" class="primary-btn full">Войти</button>
      </form>

      <form id="registerForm" class="auth-form" novalidate>
        <label>Имя
          <input type="text" id="regFirstName" placeholder="Иван" autocomplete="given-name">
        </label>
        <label>Фамилия
          <input type="text" id="regLastName" placeholder="Иванов" autocomplete="family-name">
        </label>
        <label>Номер телефона
          <input type="tel" id="regPhone" placeholder="+7 (999) 123-45-67" autocomplete="tel">
        </label>
        <label>Пароль
          <input type="password" id="regPassword" placeholder="Минимум 8 символов" autocomplete="new-password">
        </label>
        <p class="hint">Только кириллица, первая буква заглавная. Пароль: 8+ символов, буквы и цифры.</p>
        <p class="form-error" id="registerError"></p>
        <button type="submit" class="primary-btn full">Создать аккаунт</button>
      </form>
    </div>
  </div>

  <!-- APP -->
  <div class="app" id="appScreen" hidden>
    <aside class="sidebar" id="sidebar">
      <div>
        <a class="brand" href="#" data-page-target="dashboard">
          <span class="brand-mark">Z</span>
          <div>
            <strong>Z-BANK</strong>
            <small>PRIVATE</small>
          </div>
        </a>

        <nav class="nav">
          <button class="nav-item active" data-page="dashboard" data-title="Обзор"><span class="nav-icon">◈</span> Обзор</button>
          <button class="nav-item" data-page="cards" data-title="Мои карты"><span class="nav-icon">▭</span> Мои карты</button>
          <button class="nav-item" data-page="payments" data-title="Платежи"><span class="nav-icon">↗</span> Платежи</button>
          <button class="nav-item" data-page="deposits" data-title="Вклады"><span class="nav-icon">◉</span> Вклады</button>
          <button class="nav-item" data-page="crypto" data-title="Криптовалюта"><span class="nav-icon">₿</span> Криптовалюта</button>
          <button class="nav-item" data-page="tasks" data-title="Задания"><span class="nav-icon">★</span> Задания</button>
          <button class="nav-item" data-page="analytics" data-title="Аналитика"><span class="nav-icon">▥</span> Аналитика</button>
          <button class="nav-item" data-page="settings" data-title="Настройки"><span class="nav-icon">⚙</span> Настройки</button>
        </nav>
      </div>
      <div class="sidebar-bottom">
        <div class="user-mini">
          <div class="avatar" id="userAvatar">--</div>
          <div>
            <strong id="userName">—</strong>
            <small>Private client</small>
          </div>
        </div>
      </div>
    </aside>

    <main class="main">
      <header class="topbar">
        <button class="icon-btn mobile-menu" id="menuBtn" aria-label="Меню">☰</button>
        <div>
          <p class="eyebrow">Z-BANK PRIVATE</p>
          <h1 id="pageTitle">Обзор</h1>
        </div>
        <div class="topbar-actions">
          <div class="avatar" id="userAvatarTop">--</div>
        </div>
      </header>

      <section class="page active" id="page-dashboard">
        <div class="hero-grid">
          <div class="balance-card">
            <div class="balance-head">
              <span>Общий баланс</span>
              <button class="ghost-btn" id="toggleBalance">Скрыть</button>
            </div>
            <div class="balance" id="balanceValue">0,00 ₽</div>
            <div class="balance-meta">
              <span class="trend up" id="balanceTrend">+0%</span>
              <span>за всё время</span>
            </div>
            <div class="card-visual">
              <div class="card-top"><span>Z-BANK</span><span>PRIVATE</span></div>
              <div class="card-chip"></div>
              <div class="card-bottom"><span>•••• ——</span><span id="cardHolder">—</span></div>
            </div>
          </div>
          <div class="quick-panel">
            <p class="panel-label">Быстрые действия</p>
            <button class="quick-action" data-action="transfer"><span class="quick-icon">↗</span><span><strong>Перевод</strong><small>По номеру или карте</small></span></button>
            <button class="quick-action" data-action="utilities"><span class="quick-icon">⌂</span><span><strong>ЖКХ</strong><small>Коммунальные услуги</small></span></button>
            <button class="quick-action" data-action="taxes"><span class="quick-icon">§</span><span><strong>Налоги</strong><small>Штрафы и сборы</small></span></button>
          </div>
        </div>

        <div class="section-head"><h2>Быстрый прогресс</h2><button class="link-btn" data-page-target="tasks">Все задания</button></div>
        <div class="progress-card" id="progressCard"></div>

        <div class="section-head"><h2>Последние операции</h2></div>
        <div class="transactions" id="recentTransactions"></div>
      </section>

      <section class="page" id="page-cards">
        <div class="section-head">
          <h2>Управление картами</h2>
          <button class="primary-btn" id="issueCardBtn">Выпустить карту</button>
        </div>
        <div class="pending-cards" id="pendingCards"></div>
        <div class="manage-grid" id="cardsGrid"></div>
      </section>

      <section class="page" id="page-payments">
        <div class="section-head"><h2>Платежи и переводы</h2></div>
        <div class="payment-grid">
          <button class="payment-tile" data-action="transfer"><span>↗</span><strong>Перевод</strong><small>По номеру телефона</small></button>
          <button class="payment-tile" data-action="utilities"><span>⌂</span><strong>ЖКХ</strong><small>Коммунальные услуги</small></button>
          <button class="payment-tile" data-action="mobile"><span>☎</span><strong>Связь</strong><small>Мобильная связь</small></button>
          <button class="payment-tile" data-action="taxes"><span>§</span><strong>Налоги</strong><small>Штрафы и сборы</small></button>
          <button class="payment-tile" data-action="internet"><span>◍</span><strong>Интернет</strong><small>Провайдер</small></button>
        </div>
      </section>

      <section class="page" id="page-deposits">
        <div class="section-head"><h2>Вклады</h2><button class="primary-btn" id="openDepositBtn">Открыть вклад</button></div>
        <div class="deposits-grid" id="depositsGrid"></div>
      </section>

      <section class="page" id="page-crypto">
        <div class="section-head"><h2>Криптовалюта</h2><span class="pill" id="cryptoPortfolio">Портфель: 0 ₽</span></div>
        <div class="crypto-grid" id="cryptoGrid"></div>
      </section>

      <section class="page" id="page-tasks">
        <div class="section-head"><h2>Задания за бонусы</h2><span class="pill" id="tasksCounter">0 / 0</span></div>
        <p class="lead-small">Выполняйте задания и получайте по 50 ₽ на счёт. Начисления автоматические.</p>
        <div class="tasks-list" id="tasksList"></div>
      </section>

      <section class="page" id="page-analytics">
        <div class="section-head"><h2>Аналитика расходов</h2></div>
        <div class="analytics-card">
          <div class="analytics-head">
            <div>
              <p class="panel-label" id="analyticsMonth">—</p>
              <h3 id="analyticsTotal">Расходы: 0 ₽</h3>
            </div>
            <span class="pill" id="analyticsCount">0 операций</span>
          </div>
          <div class="bars" id="analyticsBars"></div>
          <p class="analytics-empty" id="analyticsEmpty" hidden>Пока нет расходов за этот месяц</p>
        </div>
      </section>

      <section class="page" id="page-settings">
        <div class="section-head"><h2>Настройки</h2><button class="ghost-btn" id="logoutBtn">Выйти</button></div>
        <div class="settings-card">
          <label class="setting-row"><span><strong>Скрывать баланс</strong><small>Повышенная приватность</small></span><input type="checkbox" class="switch" id="setHideBalance"></label>
          <label class="setting-row"><span><strong>Уведомления</strong><small>Всплывающие сообщения</small></span><input type="checkbox" class="switch" id="setNotifications" checked></label>
          <label class="setting-row"><span><strong>Сбросить все данные</strong><small>Удалить аккаунт и историю</small></span><button class="ghost-btn danger" id="resetBtn">Сбросить</button></label>
        </div>
      </section>
    </main>
  </div>

  <div class="modal" id="modal">
    <div class="modal-box">
      <button class="modal-close" data-close>×</button>
      <p class="eyebrow" id="modalEyebrow"></p>
      <h2 id="modalTitle"></h2>
      <div id="modalBody"></div>
    </div>
  </div>

  <div class="toast" id="toast"></div>

  <script src="app.js"></script>
</body>
</html>