<?php
declare(strict_types=1);

const DB_PATH = __DIR__ . '/data/zbank.sqlite';

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;

    if (!is_dir(__DIR__ . '/data')) {
        mkdir(__DIR__ . '/data', 0775, true);
    }

    $pdo = new PDO('sqlite:' . DB_PATH, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $pdo->exec('PRAGMA journal_mode = WAL');
    $pdo->exec('PRAGMA foreign_keys = ON');

    initSchema($pdo);
    return $pdo;
}

function initSchema(PDO $pdo): void
{
    $pdo->exec("
    CREATE TABLE IF NOT EXISTS users (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name    TEXT NOT NULL,
        last_name     TEXT NOT NULL,
        phone         TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at    INTEGER NOT NULL,
        last_bonus_at INTEGER NOT NULL DEFAULT 0,
        hide_balance  INTEGER NOT NULL DEFAULT 0,
        notifications INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS transactions (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id     INTEGER NOT NULL,
        direction   TEXT NOT NULL CHECK (direction IN ('in','out')),
        amount      REAL NOT NULL,
        category    TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at  INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_tx_user ON transactions(user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS cards (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id       INTEGER NOT NULL,
        type          TEXT NOT NULL,
        last4         TEXT NOT NULL,
        monthly_limit REAL NOT NULL,
        spent         REAL NOT NULL DEFAULT 0,
        frozen        INTEGER NOT NULL DEFAULT 0,
        issued_at     INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pending_cards (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id    INTEGER NOT NULL,
        type       TEXT NOT NULL,
        ready_at   INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS deposits (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id     INTEGER NOT NULL,
        amount      REAL NOT NULL,
        term_months INTEGER NOT NULL,
        rate        REAL NOT NULL,
        opened_at   INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS crypto_holdings (
        user_id   INTEGER NOT NULL,
        symbol    TEXT NOT NULL,
        amount    REAL NOT NULL,
        avg_price REAL NOT NULL,
        PRIMARY KEY (user_id, symbol),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS claimed_tasks (
        user_id    INTEGER NOT NULL,
        task_id    TEXT NOT NULL,
        claimed_at INTEGER NOT NULL,
        PRIMARY KEY (user_id, task_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS admins (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        username      TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at    INTEGER NOT NULL
    );
    ");

    // Безопасная миграция: добавляем is_blocked в существующую users
    try {
        $pdo->exec("ALTER TABLE users ADD COLUMN is_blocked INTEGER NOT NULL DEFAULT 0");
    } catch (PDOException) {
        // колонка уже есть
    }

    // Сид админа по умолчанию
    $cnt = (int) $pdo->query("SELECT COUNT(*) FROM admins")->fetchColumn();
    if ($cnt === 0) {
        $pdo->prepare("INSERT INTO admins (username, password_hash, created_at) VALUES (:u, :h, :t)")
            ->execute([
                ':u' => 'admin',
                ':h' => password_hash('admin123', PASSWORD_DEFAULT),
                ':t' => time(),
            ]);
    }
}

function balance_of(int $userId): float
{
    $stmt = db()->prepare("
        SELECT COALESCE(SUM(CASE WHEN direction='in' THEN amount ELSE -amount END), 0) AS b
        FROM transactions WHERE user_id = :u
    ");
    $stmt->execute([':u' => $userId]);
    return round((float) $stmt->fetchColumn(), 2);
}

function add_tx(int $userId, string $direction, float $amount, string $category, string $description): void
{
    if ($amount <= 0) throw new RuntimeException('Сумма должна быть больше нуля');
    if ($direction === 'out' && $amount > balance_of($userId)) {
        throw new RuntimeException('Недостаточно средств');
    }
    $stmt = db()->prepare("
        INSERT INTO transactions (user_id, direction, amount, category, description, created_at)
        VALUES (:u, :d, :a, :c, :desc, :ts)
    ");
    $stmt->execute([
        ':u' => $userId,
        ':d' => $direction,
        ':a' => round($amount, 2),
        ':c' => $category,
        ':desc' => $description,
        ':ts' => time(),
    ]);
}

function current_user_id(): ?int
{
    return isset($_SESSION['uid']) ? (int) $_SESSION['uid'] : null;
}

function require_auth(): int
{
    $uid = current_user_id();
    if (!$uid) {
        json_out(['error' => 'Требуется авторизация'], 401);
    }

    $s = db()->prepare("SELECT is_blocked FROM users WHERE id = :u");
    $s->execute([':u' => $uid]);
    $row = $s->fetch();
    if (!$row) {
        session_destroy();
        json_out(['error' => 'Пользователь не найден'], 401);
    }
    if ((int) $row['is_blocked'] === 1) {
        session_destroy();
        json_out(['error' => 'Аккаунт заблокирован. Обратитесь в поддержку.'], 403);
    }
    return $uid;
}

function json_out($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function json_in(): array
{
    $raw = file_get_contents('php://input');
    if (!$raw) return $_POST ?: [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}