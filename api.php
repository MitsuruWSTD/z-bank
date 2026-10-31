<?php
declare(strict_types=1);

require __DIR__ . '/db.php';

session_set_cookie_params([
    'httponly' => true,
    'samesite' => 'Lax',
    // 'secure' => true,  // включить на HTTPS
]);
session_start();

const NAME_RE     = '/^[А-ЯЁ][а-яё]{1,29}$/u';
const PHONE_RE    = '/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/';
const PASSWORD_RE = '/^(?=.*[A-Za-zА-Яа-яЁё])(?=.*\d).{8,}$/u';
const WELCOME_BONUS   = 500.0;
const TASK_REWARD     = 50.0;
const HOURLY_BONUS    = 500.0;
const HOURLY_INTERVAL = 3600;
const CARD_ISSUE_SEC  = 300;
const CARD_RELEASE_COST = 250.0;
const MONTHLY_LIMIT   = 500000.0;

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

try {
    match (true) {
        $action === 'register'       && $method === 'POST' => do_register(),
        $action === 'login'          && $method === 'POST' => do_login(),
        $action === 'logout'         && $method === 'POST' => do_logout(),
        $action === 'me'             && $method === 'GET'  => do_me(),
        $action === 'transfer'       && $method === 'POST' => do_transfer(),
        $action === 'pay'            && $method === 'POST' => do_pay(),
        $action === 'deposit_open'   && $method === 'POST' => do_deposit_open(),
        $action === 'deposit_close'  && $method === 'POST' => do_deposit_close(),
        $action === 'crypto_buy'     && $method === 'POST' => do_crypto_buy(),
        $action === 'crypto_sell'    && $method === 'POST' => do_crypto_sell(),
        $action === 'card_issue'     && $method === 'POST' => do_card_issue(),
        $action === 'card_release'   && $method === 'POST' => do_card_release(),
        $action === 'task_claim'     && $method === 'POST' => do_task_claim(),
        $action === 'hourly_bonus'   && $method === 'POST' => do_hourly_bonus(),
        $action === 'setting'        && $method === 'POST' => do_setting(),
        default => json_out(['error' => 'Неизвестный экшен'], 404),
    };
} catch (RuntimeException $e) {
    json_out(['error' => $e->getMessage()], 400);
} catch (Throwable $e) {
    json_out(['error' => 'Внутренняя ошибка', 'detail' => $e->getMessage()], 500);
}

// -------- AUTH --------
function do_register(): void
{
    $in = json_in();
    $first = trim((string)($in['firstName'] ?? ''));
    $last  = trim((string)($in['lastName'] ?? ''));
    $phone = trim((string)($in['phone'] ?? ''));
    $pass  = (string)($in['password'] ?? '');

    if (!preg_match(NAME_RE, $first))  json_out(['error' => 'Имя: только кириллица, первая заглавная, 2–30 букв.'], 400);
    if (!preg_match(NAME_RE, $last))   json_out(['error' => 'Фамилия: только кириллица, первая заглавная, 2–30 букв.'], 400);
    if (!preg_match(PHONE_RE, $phone)) json_out(['error' => 'Телефон в формате +7 (XXX) XXX-XX-XX.'], 400);
    if (!preg_match(PASSWORD_RE, $pass)) json_out(['error' => 'Пароль: минимум 8 символов, буквы и цифры.'], 400);

    $exists = db()->prepare("SELECT 1 FROM users WHERE phone = :p");
    $exists->execute([':p' => $phone]);
    if ($exists->fetchColumn()) json_out(['error' => 'Аккаунт с этим номером уже существует.'], 409);

    $stmt = db()->prepare("
        INSERT INTO users (first_name, last_name, phone, password_hash, created_at)
        VALUES (:f, :l, :p, :h, :c)
    ");
    $stmt->execute([
        ':f' => $first, ':l' => $last, ':p' => $phone,
        ':h' => password_hash($pass, PASSWORD_DEFAULT),
        ':c' => time(),
    ]);
    $uid = (int) db()->lastInsertId();

    add_tx($uid, 'in', WELCOME_BONUS, 'welcome', 'Приветственный бонус');

    session_regenerate_id(true);
    $_SESSION['uid'] = $uid;

    json_out(['ok' => true]);
}

function do_login(): void
{
    $in = json_in();
    $phone = trim((string)($in['phone'] ?? ''));
    $pass  = (string)($in['password'] ?? '');

    $stmt = db()->prepare("SELECT id, password_hash, is_blocked FROM users WHERE phone = :p");
    $stmt->execute([':p' => $phone]);
    $row = $stmt->fetch();
    if (!$row || !password_verify($pass, $row['password_hash'])) {
        json_out(['error' => 'Неверный телефон или пароль'], 401);
    }
    if ((int) $row['is_blocked'] === 1) {
        json_out(['error' => 'Аккаунт заблокирован. Обратитесь в поддержку.'], 403);
    }
    session_regenerate_id(true);
    $_SESSION['uid'] = (int) $row['id'];
    json_out(['ok' => true]);
}

function do_logout(): void
{
    $_SESSION = [];
    session_destroy();
    json_out(['ok' => true]);
}

function do_me(): void
{
    $uid = current_user_id();
    if (!$uid) json_out(['user' => null]);

    $u = db()->prepare("SELECT id, first_name, last_name, phone, created_at, last_bonus_at, hide_balance, notifications FROM users WHERE id = :u");
    $u->execute([':u' => $uid]);
    $user = $u->fetch();

    $tx = db()->prepare("SELECT id, direction, amount, category, description, created_at FROM transactions WHERE user_id = :u ORDER BY created_at DESC, id DESC LIMIT 100");
    $tx->execute([':u' => $uid]);

    $cards = db()->prepare("SELECT id, type, last4, monthly_limit, spent, frozen, issued_at FROM cards WHERE user_id = :u ORDER BY issued_at DESC");
    $cards->execute([':u' => $uid]);

    $pending = db()->prepare("SELECT id, type, ready_at FROM pending_cards WHERE user_id = :u ORDER BY ready_at ASC");
    $pending->execute([':u' => $uid]);

    $deposits = db()->prepare("SELECT id, amount, term_months, rate, opened_at FROM deposits WHERE user_id = :u ORDER BY opened_at DESC");
    $deposits->execute([':u' => $uid]);

    $holdings = db()->prepare("SELECT symbol, amount, avg_price FROM crypto_holdings WHERE user_id = :u");
    $holdings->execute([':u' => $uid]);
    $crypto = [];
    foreach ($holdings->fetchAll() as $h) {
        $crypto[$h['symbol']] = ['amount' => (float) $h['amount'], 'avgPrice' => (float) $h['avg_price']];
    }

    $tasks = db()->prepare("SELECT task_id FROM claimed_tasks WHERE user_id = :u");
    $tasks->execute([':u' => $uid]);

    json_out([
        'user' => [
            'firstName' => $user['first_name'],
            'lastName'  => $user['last_name'],
            'phone'     => $user['phone'],
            'lastBonusAt' => (int) $user['last_bonus_at'],
            'settings' => [
                'hideBalance'   => (bool) $user['hide_balance'],
                'notifications' => (bool) $user['notifications'],
            ],
        ],
        'balance' => balance_of($uid),
        'transactions' => array_map(fn($r) => [
            'id' => (int) $r['id'],
            'direction' => $r['direction'],
            'amount' => (float) $r['amount'],
            'category' => $r['category'],
            'description' => $r['description'],
            'date' => (int) $r['created_at'] * 1000,
        ], $tx->fetchAll()),
        'cards' => array_map(fn($r) => [
            'id' => (int) $r['id'], 'type' => $r['type'], 'last4' => $r['last4'],
            'limit' => (float) $r['monthly_limit'], 'spent' => (float) $r['spent'],
            'frozen' => (bool) $r['frozen'],
        ], $cards->fetchAll()),
        'pendingCards' => array_map(fn($r) => [
            'id' => (int) $r['id'], 'type' => $r['type'],
            'readyAt' => (int) $r['ready_at'] * 1000,
        ], $pending->fetchAll()),
        'deposits' => array_map(fn($r) => [
            'id' => (int) $r['id'], 'amount' => (float) $r['amount'],
            'termMonths' => (int) $r['term_months'], 'rate' => (float) $r['rate'],
            'openedAt' => (int) $r['opened_at'] * 1000,
        ], $deposits->fetchAll()),
        'crypto' => $crypto,
        'claimedTasks' => array_column($tasks->fetchAll(), 'task_id'),
    ]);
}

// -------- ОПЕРАЦИИ --------
function do_transfer(): void
{
    $uid = require_auth();
    $in = json_in();
    $recipient = trim((string)($in['recipient'] ?? ''));
    $amount = (float) ($in['amount'] ?? 0);

    if (mb_strlen($recipient) < 2) throw new RuntimeException('Укажите получателя');
    if ($amount <= 0) throw new RuntimeException('Некорректная сумма');

    add_tx($uid, 'out', $amount, 'transfer', 'Перевод: ' . $recipient);
    bump_card_spent($uid, $amount);
    json_out(['ok' => true]);
}

function do_pay(): void
{
    $uid = require_auth();
    $in = json_in();
    $category = (string)($in['category'] ?? '');
    $allowed = ['utilities','mobile','taxes','internet'];
    if (!in_array($category, $allowed, true)) throw new RuntimeException('Неверная категория');

    $service = trim((string)($in['service'] ?? ''));
    $account = trim((string)($in['account'] ?? ''));
    $amount  = (float)($in['amount'] ?? 0);

    if ($service === '') throw new RuntimeException('Выберите услугу');
    if (mb_strlen($account) < 4) throw new RuntimeException('Введите номер/счёт');
    if ($amount <= 0) throw new RuntimeException('Некорректная сумма');

    add_tx($uid, 'out', $amount, $category, $service . ' · ' . substr($account, -4));
    bump_card_spent($uid, $amount);
    json_out(['ok' => true]);
}

function bump_card_spent(int $uid, float $amount): void
{
    $c = db()->prepare("SELECT id FROM cards WHERE user_id = :u ORDER BY issued_at DESC LIMIT 1");
    $c->execute([':u' => $uid]);
    $cardId = $c->fetchColumn();
    if ($cardId) {
        db()->prepare("UPDATE cards SET spent = spent + :a WHERE id = :id")
            ->execute([':a' => $amount, ':id' => $cardId]);
    }
}

// -------- ВКЛАДЫ --------
function do_deposit_open(): void
{
    $uid = require_auth();
    $in = json_in();
    $amount = (float)($in['amount'] ?? 0);
    $term = (int)($in['term'] ?? 0);

    if ($amount < 1000) throw new RuntimeException('Минимум 1 000 ₽');
    $rates = [3 => 12.0, 6 => 14.0, 12 => 16.0];
    if (!isset($rates[$term])) throw new RuntimeException('Неверный срок');

    add_tx($uid, 'out', $amount, 'deposit', "Открытие вклада на {$term} мес");
    db()->prepare("INSERT INTO deposits (user_id, amount, term_months, rate, opened_at) VALUES (:u, :a, :t, :r, :o)")
        ->execute([':u' => $uid, ':a' => $amount, ':t' => $term, ':r' => $rates[$term], ':o' => time()]);
    json_out(['ok' => true]);
}

function do_deposit_close(): void
{
    $uid = require_auth();
    $in = json_in();
    $id = (int)($in['id'] ?? 0);

    $stmt = db()->prepare("SELECT * FROM deposits WHERE id = :i AND user_id = :u");
    $stmt->execute([':i' => $id, ':u' => $uid]);
    $d = $stmt->fetch();
    if (!$d) throw new RuntimeException('Вклад не найден');

    $totalMs = $d['term_months'] * 30 * 86400;
    $elapsed = min(time() - (int)$d['opened_at'], $totalMs);
    $progress = $totalMs > 0 ? $elapsed / $totalMs : 0;
    $interest = $d['amount'] * ($d['rate'] / 100) * ($d['term_months'] / 12) * $progress;
    $total = round($d['amount'] + $interest, 2);

    db()->prepare("DELETE FROM deposits WHERE id = :i")->execute([':i' => $id]);
    add_tx($uid, 'in', $total, 'deposit', 'Закрытие вклада (' . $d['rate'] . '%)');
    json_out(['ok' => true, 'total' => $total]);
}

// -------- КРИПТА --------
function crypto_price(string $symbol): float
{
    // В реальном проекте — внешний API (CoinGecko и т.п.).
    // Здесь — фиксированный "прайс", чтобы демо было предсказуемым.
    return [
        'BTC' => 6500000.0,
        'ETH' => 320000.0,
        'SOL' => 14500.0,
        'TON' => 620.0,
    ][$symbol] ?? 0.0;
}

function do_crypto_buy(): void
{
    $uid = require_auth();
    $in = json_in();
    $symbol = strtoupper((string)($in['symbol'] ?? ''));
    $qty = (float)($in['amount'] ?? 0);
    $rub = (float)($in['rub'] ?? 0);

    if (!in_array($symbol, ['BTC','ETH','SOL','TON'], true)) throw new RuntimeException('Неизвестная монета');
    $price = crypto_price($symbol);

    if ($qty <= 0 && $rub > 0) $qty = $rub / $price;
    if ($qty <= 0) throw new RuntimeException('Укажите сумму или количество');

    $cost = round($qty * $price, 2);
    add_tx($uid, 'out', $cost, 'crypto', 'Покупка ' . $symbol);

    $stmt = db()->prepare("SELECT amount, avg_price FROM crypto_holdings WHERE user_id = :u AND symbol = :s");
    $stmt->execute([':u' => $uid, ':s' => $symbol]);
    $h = $stmt->fetch();

    if ($h) {
        $newAmount = (float)$h['amount'] + $qty;
        $newAvg = ($newAmount > 0)
            ? ((float)$h['amount'] * (float)$h['avg_price'] + $qty * $price) / $newAmount
            : $price;
        db()->prepare("UPDATE crypto_holdings SET amount = :a, avg_price = :p WHERE user_id = :u AND symbol = :s")
            ->execute([':a' => $newAmount, ':p' => $newAvg, ':u' => $uid, ':s' => $symbol]);
    } else {
        db()->prepare("INSERT INTO crypto_holdings (user_id, symbol, amount, avg_price) VALUES (:u, :s, :a, :p)")
            ->execute([':u' => $uid, ':s' => $symbol, ':a' => $qty, ':p' => $price]);
    }
    json_out(['ok' => true]);
}

function do_crypto_sell(): void
{
    $uid = require_auth();
    $in = json_in();
    $symbol = strtoupper((string)($in['symbol'] ?? ''));
    $qty = (float)($in['amount'] ?? 0);

    if (!in_array($symbol, ['BTC','ETH','SOL','TON'], true)) throw new RuntimeException('Неизвестная монета');
    if ($qty <= 0) throw new RuntimeException('Некорректное количество');

    $stmt = db()->prepare("SELECT amount FROM crypto_holdings WHERE user_id = :u AND symbol = :s");
    $stmt->execute([':u' => $uid, ':s' => $symbol]);
    $have = (float)($stmt->fetchColumn() ?: 0);
    if ($qty > $have + 1e-9) throw new RuntimeException('Недостаточно средств');

    $price = crypto_price($symbol);
    $proceeds = round($qty * $price, 2);
    $remaining = $have - $qty;

    if ($remaining < 1e-9) {
        db()->prepare("DELETE FROM crypto_holdings WHERE user_id = :u AND symbol = :s")
            ->execute([':u' => $uid, ':s' => $symbol]);
    } else {
        db()->prepare("UPDATE crypto_holdings SET amount = :a WHERE user_id = :u AND symbol = :s")
            ->execute([':a' => $remaining, ':u' => $uid, ':s' => $symbol]);
    }
    add_tx($uid, 'in', $proceeds, 'crypto', 'Продажа ' . $symbol);
    json_out(['ok' => true, 'proceeds' => $proceeds]);
}

// -------- КАРТЫ --------
function do_card_issue(): void
{
    $uid = require_auth();
    $in = json_in();
    $type = trim((string)($in['type'] ?? 'Виртуальная'));
    if (!in_array($type, ['Виртуальная','Пластиковая','Металлическая'], true)) {
        throw new RuntimeException('Неверный тип карты');
    }

    $cnt = db()->prepare("SELECT COUNT(*) FROM pending_cards WHERE user_id = :u");
    $cnt->execute([':u' => $uid]);
    if ((int)$cnt->fetchColumn() >= 2) throw new RuntimeException('Максимум 2 карты в выпуске');

    db()->prepare("INSERT INTO pending_cards (user_id, type, ready_at) VALUES (:u, :t, :r)")
        ->execute([':u' => $uid, ':t' => $type, ':r' => time() + CARD_ISSUE_SEC]);
    json_out(['ok' => true]);
}

function do_card_release(): void
{
    $uid = require_auth();
    $in = json_in();
    $id = (int)($in['id'] ?? 0);

    $stmt = db()->prepare("SELECT * FROM pending_cards WHERE id = :i AND user_id = :u");
    $stmt->execute([':i' => $id, ':u' => $uid]);
    $p = $stmt->fetch();
    if (!$p) throw new RuntimeException('Заявка не найдена');

    add_tx($uid, 'out', CARD_RELEASE_COST, 'card', 'Ускоренный выпуск карты');
    finish_card($uid, $p);
    json_out(['ok' => true]);
}

function finish_card(int $uid, array $p): void
{
    db()->prepare("DELETE FROM pending_cards WHERE id = :i")->execute([':i' => $p['id']]);
    $last4 = str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);
    db()->prepare("INSERT INTO cards (user_id, type, last4, monthly_limit, spent, frozen, issued_at) VALUES (:u, :t, :l4, :lim, 0, 0, :i)")
        ->execute([
            ':u' => $uid, ':t' => $p['type'], ':l4' => $last4,
            ':lim' => MONTHLY_LIMIT, ':i' => time(),
        ]);
}

// -------- ЗАДАНИЯ --------
function check_task(int $uid, string $taskId): bool
{
    $pdo = db();
    switch ($taskId) {
        case 'card':
            $s = $pdo->prepare("SELECT COUNT(*) FROM cards WHERE user_id = :u"); $s->execute([':u' => $uid]);
            return (int) $s->fetchColumn() > 0;
        case 'transfer':
            $s = $pdo->prepare("SELECT 1 FROM transactions WHERE user_id = :u AND category = 'transfer' LIMIT 1"); $s->execute([':u' => $uid]);
            return (bool) $s->fetchColumn();
        case 'deposit':
            $s = $pdo->prepare("SELECT COUNT(*) FROM deposits WHERE user_id = :u"); $s->execute([':u' => $uid]);
            return (int) $s->fetchColumn() > 0;
        case 'crypto':
            $s = $pdo->prepare("SELECT COUNT(*) FROM crypto_holdings WHERE user_id = :u"); $s->execute([':u' => $uid]);
            return (int) $s->fetchColumn() > 0;
        case 'utilities': case 'taxes': case 'mobile': case 'internet':
            $s = $pdo->prepare("SELECT 1 FROM transactions WHERE user_id = :u AND category = :c LIMIT 1");
            $s->execute([':u' => $uid, ':c' => $taskId]);
            return (bool) $s->fetchColumn();
    }
    return false;
}

function do_task_claim(): void
{
    $uid = require_auth();
    $in = json_in();
    $taskId = (string)($in['taskId'] ?? '');

    $known = ['card','transfer','deposit','utilities','taxes','mobile','internet','crypto'];
    if (!in_array($taskId, $known, true)) throw new RuntimeException('Неизвестное задание');

    $s = db()->prepare("SELECT 1 FROM claimed_tasks WHERE user_id = :u AND task_id = :t");
    $s->execute([':u' => $uid, ':t' => $taskId]);
    if ($s->fetchColumn()) throw new RuntimeException('Задание уже выполнено');

    if (!check_task($uid, $taskId)) throw new RuntimeException('Условие задания ещё не выполнено');

    db()->prepare("INSERT INTO claimed_tasks (user_id, task_id, claimed_at) VALUES (:u, :t, :ts)")
        ->execute([':u' => $uid, ':t' => $taskId, ':ts' => time()]);
    add_tx($uid, 'in', TASK_REWARD, 'task', 'Бонус за задание: ' . $taskId);
    json_out(['ok' => true, 'reward' => TASK_REWARD]);
}

// -------- ЧАСОВОЙ БОНУС --------
function do_hourly_bonus(): void
{
    $uid = require_auth();
    $s = db()->prepare("SELECT last_bonus_at FROM users WHERE id = :u");
    $s->execute([':u' => $uid]);
    $last = (int) $s->fetchColumn();

    if (time() - $last < HOURLY_INTERVAL) {
        $left = HOURLY_INTERVAL - (time() - $last);
        json_out(['error' => 'Рано', 'secondsLeft' => $left], 400);
    }
    db()->prepare("UPDATE users SET last_bonus_at = :t WHERE id = :u")
        ->execute([':t' => time(), ':u' => $uid]);
    add_tx($uid, 'in', HOURLY_BONUS, 'bonus', 'Часовой бонус');
    json_out(['ok' => true, 'reward' => HOURLY_BONUS]);
}

// -------- НАСТРОЙКИ --------
function do_setting(): void
{
    $uid = require_auth();
    $in = json_in();
    $key = (string)($in['key'] ?? '');
    $value = (bool)($in['value'] ?? false);

    $col = match ($key) {
        'hideBalance'   => 'hide_balance',
        'notifications' => 'notifications',
        default => throw new RuntimeException('Неизвестная настройка'),
    };
    db()->prepare("UPDATE users SET {$col} = :v WHERE id = :u")
        ->execute([':v' => $value ? 1 : 0, ':u' => $uid]);
    json_out(['ok' => true]);
}