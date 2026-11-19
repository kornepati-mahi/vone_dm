<?php
/**
 * DM Panda clone — PHP API (works with XAMPP PHP 8.x, MySQL on port 3306)
 *
 * Serve with:  php -S localhost:8000 -t server/public
 * Point the React dev proxy at it (already configured in vite.config.js).
 */

declare(strict_types=1);

const DB_HOST = '127.0.0.1';
const DB_PORT = '3306';
const DB_NAME = 'dmpanda';
const DB_USER = 'root';
const DB_PASS = '';

const SESSION_COOKIE = 'session_token';
const SESSION_DAYS = 14;

ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('error_log', __DIR__ . '/../php-error.log');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? '*'));
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

/* ---------------------------------------------------------------- helpers */

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', DB_HOST, DB_PORT, DB_NAME);
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }
    return $pdo;
}

function json_in(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function out($data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(string $msg, int $code = 400): void
{
    out(['error' => $msg], $code);
}

function param(string $key, string $default = ''): string
{
    if (isset($_GET[$key])) return trim((string) $_GET[$key]);
    $body = json_in();
    return trim((string) ($body[$key] ?? $default));
}

/** Resolve the route path (works under the dev server and Apache). */
function route(): string
{
    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $uri = preg_replace('#^/index\.php#', '', $uri) ?: '/';
    return rtrim($uri, '/') ?: '/';
}

/* ------------------------------------------------------------- auth token */

function current_user_id(): ?int
{
    $token = $_COOKIE[SESSION_COOKIE] ?? '';
    if ($token === '') return null;
    $st = db()->prepare(
        'SELECT s.user_id, s.expires_at, u.status
           FROM sessions s JOIN users u ON u.id = s.user_id
          WHERE s.token = ? LIMIT 1'
    );
    $st->execute([$token]);
    $row = $st->fetch();
    if (!$row) return null;
    if (strtotime((string) $row['expires_at']) < time()) return null;
    if ($row['status'] !== 'active') return null;
    return (int) $row['user_id'];
}

function require_auth(): int
{
    $uid = current_user_id();
    if ($uid === null) fail('You must be logged in to view this page.', 401);
    return $uid;
}

function require_admin(): int
{
    $uid = require_auth();
    $st = db()->prepare('SELECT role FROM users WHERE id = ?');
    $st->execute([$uid]);
    $row = $st->fetch();
    if (!$row || $row['role'] !== 'admin') fail('Admin access required.', 403);
    return $uid;
}

function get_setting(string $key, string $default = ''): string
{
    $st = db()->prepare('SELECT setting_value FROM settings WHERE setting_key = ?');
    $st->execute([$key]);
    $row = $st->fetch();
    return $row ? (string) $row['setting_value'] : $default;
}

function set_setting(string $key, string $value): void
{
    db()->prepare('INSERT INTO settings (setting_key, setting_value) VALUES (?,?)
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)')
        ->execute([$key, $value]);
}

/**
 * Feature key for an automation type, used for plan gating.
 * Returns null when the type is available on every plan.
 */
function plan_feature_key(string $type): ?string
{
    return match ($type) {
        'dm'           => 'dm_automation',
        'post'         => 'post_comment_dm_reply',
        'reel'         => 'reel_comment_dm_reply',
        'story'        => 'story_automation',
        'live'         => 'instagram_live_automation',
        'mention'      => 'mentions',
        'global'       => 'global_trigger',
        'moderation'   => 'comment_moderation',
        'inbox_menu'   => 'inbox_menu',
        'convo_starter'=> 'convo_starters',
        'suggest_more' => 'suggest_more',
        'welcome'      => 'welcome_message',
        'super_profile'=> 'super_profile',
        default        => null, // templates & misc available on all plans
    };
}

/** The plan code the user actually has right now (expired plans fall back to free). */
function effective_plan_code(int $userId): string
{
    $st = db()->prepare('SELECT plan_code, plan_expires_at FROM users WHERE id = ?');
    $st->execute([$userId]);
    $u = $st->fetch();
    if (!$u) return 'free';
    if (!empty($u['plan_expires_at']) && strtotime((string) $u['plan_expires_at']) < time()) return 'free';
    return (string) ($u['plan_code'] ?: 'free');
}

function plan_features(int $userId): array
{
    $code = effective_plan_code($userId);
    $st = db()->prepare('SELECT feature_items FROM plans WHERE plan_code = ?');
    $st->execute([$code]);
    $row = $st->fetch();
    if (!$row || !$row['feature_items']) return [];
    $items = json_decode((string) $row['feature_items'], true);
    if (!is_array($items)) return [];
    $enabled = [];
    foreach ($items as $it) {
        if (!empty($it['key']) && !empty($it['enabled'])) $enabled[$it['key']] = true;
    }
    return $enabled;
}

function assert_plan_feature(int $userId, string $type): void
{
    $key = plan_feature_key($type);
    if ($key === null) return;
    $features = plan_features($userId);
    if (empty($features[$key])) {
        fail('This feature is not included in your current plan. Upgrade to unlock it.', 403);
    }
}

function create_session(int $userId): string
{
    $token = bin2hex(random_bytes(32));
    $expires = date('Y-m-d H:i:s', time() + SESSION_DAYS * 86400);
    db()->prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?,?,?)')
        ->execute([$token, $userId, $expires]);
    setcookie(SESSION_COOKIE, $token, [
        'expires'  => time() + SESSION_DAYS * 86400,
        'path'     => '/',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    return $token;
}

function user_array(int $id): array
{
    $st = db()->prepare('SELECT id, name, email, email_verified, plan_code, role, status, created_at, avatar_url FROM users WHERE id = ?');
    $st->execute([$id]);
    $u = $st->fetch() ?: [];
    if ($u) $u['id'] = (int) $u['id'];
    return $u;
}

function me_array(int $id): array
{
    $st = db()->prepare('SELECT id, name, email, email_verified, password_hash, plan_code, role, status, created_at, avatar_url FROM users WHERE id = ?');
    $st->execute([$id]);
    $u = $st->fetch();
    if (!$u) return [];

    $ig = db()->prepare('SELECT id, ig_user_id, username, account_type, status, connected_at FROM instagram_accounts WHERE user_id = ? ORDER BY id DESC');
    $ig->execute([$id]);
    $accounts = $ig->fetchAll();
    foreach ($accounts as &$a) {
        $a['id'] = (int) $a['id'];
    }
    unset($a);

    $blocked = $u['status'] === 'blocked';
    return [
        'id'                 => (int) $u['id'],
        'name'               => $u['name'],
        'email'              => $u['email'],
        'emailCanonical'     => $u['email'],
        'emailVerification'  => (bool) $u['email_verified'],
        'hasPassword'        => $u['password_hash'] !== null && $u['password_hash'] !== '',
        'hasLinkedInstagram' => count($accounts) > 0,
        'plan_code'          => effective_plan_code($id),
        'role'               => $u['role'],
        'status'             => $u['status'],
        'created_at'         => $u['created_at'],
        'emailIsFree'        => true,
        'phoneVerification'  => false,
        'mfa'                => false,
        'prefs'              => ['avatar_url' => '', 'onboarding_tour_seen' => false],
        'access_state'       => [
            'ban_mode'          => $blocked ? 'hard' : 'none',
            'ban_message'       => $blocked ? 'Your account has been blocked.' : null,
            'is_soft_banned'    => false,
            'is_hard_banned'    => $blocked,
            'dashboard_allowed' => $u['status'] === 'active',
            'login_allowed'     => $u['status'] !== 'deleted',
        ],
        'total_linked_accounts' => count($accounts),
        'active_ig_account_id' => (int) (get_setting('ig_active_' . $id, '0') ?: 0) ?: null,
        'ig_accounts'        => $accounts,
        'instagram_username' => $accounts[0]['username'] ?? null,
        'profile_picture_url' => $u['avatar_url'] ?? '',
        'avatar_url'         => $u['avatar_url'] ?? '',
    ];
}

/** Hosts we allow as an OAuth post-login redirect target. */
function allowed_redirect_hosts(): array
{
    static $hosts = null;
    if ($hosts === null) {
        $hosts = ['localhost', '127.0.0.1'];
        $extra = getenv('APP_ORIGIN') ?: (string) (oauth_config()['app_origin'] ?? '');
        foreach (explode(',', $extra) as $origin) {
            $origin = trim($origin);
            if ($origin === '') continue;
            $p = parse_url($origin);
            if ($p && !empty($p['host'])) $hosts[] = strtolower((string) $p['host']);
        }
    }
    return array_values(array_unique($hosts));
}

function safe_redirect_origin(string $raw): string
{
    $raw = trim($raw);
    if ($raw === '') return 'http://localhost:5173';
    $p = parse_url($raw);
    if (!$p || !isset($p['host'])) return 'http://localhost:5173';
    $host = strtolower($p['host']);
    if (!in_array($host, allowed_redirect_hosts(), true)) return 'http://localhost:5173';
    $scheme = isset($p['scheme']) && strtolower($p['scheme']) === 'https' ? 'https' : 'http';
    $port = isset($p['port']) ? ':' . (int) $p['port'] : '';
    return $scheme . '://' . $host . $port;
}

function oauth_config(): array
{
    static $cfg = null;
    if ($cfg === null) {
        $file = __DIR__ . '/../config.php';
        $cfg = is_file($file) ? (require $file) : [];
    }
    return $cfg;
}

function http_request(string $url, array $options = []): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 20,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
    ]);
    if (!empty($options['post'])) {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($options['post']));
    }
    if (!empty($options['headers'])) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, $options['headers']);
    }
    $body   = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error  = curl_error($ch);
    curl_close($ch);
    return [$status, $body ?: '', $error];
}

/* --------------------------------------------------- Instagram / Meta --- */

function instagram_oauth_config(): array
{
    $cfg = oauth_config();
    $pick = static function (string $key, string $env1, string $env2, string $default = '') use ($cfg): string {
        foreach ([$env1, $env2] as $env) {
            $v = getenv($env);
            if ($v !== false && $v !== '') return (string) $v;
        }
        return (string) ($cfg[$key] ?? $default);
    };
    return [
        'app_id'        => $pick('meta_app_id', 'META_APP_ID', 'INSTAGRAM_APP_ID'),
        'app_secret'    => $pick('meta_app_secret', 'META_APP_SECRET', 'INSTAGRAM_APP_SECRET'),
        'graph_version' => $pick('meta_graph_version', 'META_GRAPH_VERSION', '', 'v19.0'),
        'redirect_uri'  => $pick('meta_redirect_uri', 'META_REDIRECT_URI', 'INSTAGRAM_REDIRECT_URI', 'http://localhost:8000/auth/ig-callback'),
        'scopes'        => $pick('meta_scopes', 'META_SCOPES', '', 'instagram_basic,instagram_manage_messages,pages_show_list,pages_messaging,pages_manage_metadata,pages_read_engagement'),
    ];
}

/** Build the Meta (Facebook) Login URL that starts an Instagram connection. */
function instagram_connect_url(string $origin): array
{
    $cfg = instagram_oauth_config();
    if ($cfg['app_id'] === '' || $cfg['app_secret'] === '') {
        fail('Instagram connection is not configured on this server. Add meta_app_id / meta_app_secret to backend/config.php.', 501);
    }
    // Same pattern as Google: random CSRF token + base64url frontend origin.
    $state = bin2hex(random_bytes(16)) . '.' . rtrim(strtr(base64_encode($origin), '+/', '-_'), '=');
    // Instagram Login (Instagram API) authorization endpoint.
    $url = 'https://www.instagram.com/oauth/authorize?' . http_build_query([
        'client_id'     => $cfg['app_id'],
        'redirect_uri'  => $cfg['redirect_uri'],
        'state'         => $state,
        'scope'         => $cfg['scopes'],
        'response_type' => 'code',
    ]);
    return ['url' => $url];
}

function graph_get(string $url): array
{
    [$status, $body] = http_request($url);
    $json = json_decode($body, true);
    return [$status, is_array($json) ? $json : [], $body];
}

/** Call the Razorpay REST API with the server-side key pair. */
function razorpay_api(string $path, string $method, array $payload = []): array
{
    $keyId = get_setting('payment_key_id', '');
    $secret = get_setting('payment_key_secret', '');
    if ($keyId === '' || $secret === '' || str_contains($keyId, 'REPLACE_ME')) {
        fail('Razorpay keys are not configured. Add them in Admin → Settings.', 501);
    }
    $ch = curl_init('https://api.razorpay.com/v1/' . $path);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 20,
        CURLOPT_USERPWD        => $keyId . ':' . $secret,
        CURLOPT_HTTPAUTH       => CURLAUTH_BASIC,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_CUSTOMREQUEST  => $method,
    ]);
    if ($payload) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    $body   = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error  = curl_error($ch);
    curl_close($ch);
    $json = json_decode($body ?: '', true);
    return [$status, is_array($json) ? $json : [], $error];
}

/* Remove anything left behind by the old demo Instagram connect, once. */
try {
    if (get_setting('legacy_demo_ig_cleaned', '0') !== '1') {
        db()->exec("DELETE FROM instagram_accounts WHERE ig_user_id LIKE 'demo\\_ig\\_%' OR username = 'demo_creator'");
        set_setting('legacy_demo_ig_cleaned', '1');
    }
} catch (Throwable $e) {
    // Database not ready yet — the cleanup is retried on the next request.
}

/* ------------------------------------------------- automation delivery --- */

// Make sure the event log exists on older databases too.
try {
    db()->exec(
        'CREATE TABLE IF NOT EXISTS automation_events (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            user_id INT UNSIGNED NOT NULL,
            automation_id INT UNSIGNED NULL,
            event_type VARCHAR(40) NOT NULL DEFAULT \'\',
            recipient_id VARCHAR(64) NOT NULL DEFAULT \'\',
            status ENUM(\'sent\',\'failed\') NOT NULL DEFAULT \'sent\',
            detail TEXT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            KEY idx_ae_user (user_id),
            CONSTRAINT fk_ae_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB'
    );
    db()->exec(
        'CREATE TABLE IF NOT EXISTS automation_processed (
            comment_id VARCHAR(64) NOT NULL,
            user_id INT UNSIGNED NOT NULL,
            automation_id INT UNSIGNED NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (comment_id, user_id)
        ) ENGINE=InnoDB'
    );
} catch (Throwable $e) {
    // Logged by the PHP error log; the API keeps working without the log table.
}

function ig_graph_post(string $path, array $params, string $token): array
{
    $params['access_token'] = $token;
    [$status, $json] = graph_post('https://graph.facebook.com/v19.0/' . ltrim($path, '/'), $params);
    return [$status, $json];
}

function ig_graph_get(string $path, array $params, string $token): array
{
    $params['access_token'] = $token;
    [$status, $json] = graph_get('https://graph.facebook.com/v19.0/' . ltrim($path, '/') . '?' . http_build_query($params));
    return [$status, $json];
}

function graph_post(string $url, array $params): array
{
    [$status, $body] = http_request($url, ['post' => $params]);
    $json = json_decode($body, true);
    return [$status, is_array($json) ? $json : [], $body];
}

function ig_log_event(int $uid, ?int $automationId, string $type, string $recipient, string $status, string $detail): void
{
    try {
        db()->prepare(
            'INSERT INTO automation_events (user_id, automation_id, event_type, recipient_id, status, detail)
             VALUES (?,?,?,?,?,?)'
        )->execute([$uid, $automationId, $type, $recipient, $status, mb_substr($detail, 0, 1000)]);
    } catch (Throwable $e) {
        // Logging must never break delivery.
    }
}

/** Pick the best active automation for an incoming event. */
function ig_match_automation(int $uid, array $types, string $text): ?array
{
    $marks = implode(',', array_fill(0, count($types), '?'));
    $st = db()->prepare(
        "SELECT * FROM automations WHERE user_id = ? AND status = 'active' AND type IN ($marks) ORDER BY id DESC"
    );
    $st->execute(array_merge([$uid], $types));
    $lower = mb_strtolower($text);
    foreach ($st->fetchAll() as $a) {
        $kw = mb_strtolower(trim((string) $a['keyword']));
        if ($kw === '') continue; // keyword-less rules are handled explicitly by their own type
        foreach (array_filter(array_map('trim', explode(',', $kw)), 'strlen') as $word) {
            if ($word !== '' && mb_strpos($lower, mb_strtolower($word)) !== false) return $a;
        }
    }
    return null;
}

/** Send the automation's reply as a real Instagram DM through the Graph API. */
function ig_deliver(array $automation, int $uid, string $recipientId, string $igId, string $token): array
{
    $text = trim((string) ($automation['reply_text'] ?? ''));
    if ($text === '') $text = trim((string) ($automation['name'] ?? ''));
    if ($text === '') return [false, 'Automation has no reply text.'];

    [$status, $res] = ig_graph_post($igId . '/messages', [
        'recipient' => json_encode(['id' => $recipientId], JSON_UNESCAPED_UNICODE),
        'message'   => json_encode(['text' => $text], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    ], $token);
    $ok = $status >= 200 && $status < 300;
    $detail = $ok
        ? 'DM sent: ' . $text
        : 'Graph API HTTP ' . $status . ': ' . json_encode($res, JSON_UNESCAPED_UNICODE);
    ig_log_event($uid, (int) ($automation['id'] ?? 0), 'dm', $recipientId, $ok ? 'sent' : 'failed', $detail);
    return [$ok, $detail];
}

/** Publicly reply to the comment that triggered an automation. */
function ig_reply_public(string $mediaId, string $text, string $token, int $uid, int $automationId): array
{
    if ($mediaId === '' || $text === '') return [false, []];
    [$status, $res] = ig_graph_post($mediaId . '/replies', ['message' => $text], $token);
    ig_log_event(
        $uid, $automationId, 'comment_reply', $mediaId,
        ($status >= 200 && $status < 300) ? 'sent' : 'failed',
        ($status >= 200 && $status < 300) ? 'Public reply sent' : ('HTTP ' . $status . ': ' . json_encode($res, JSON_UNESCAPED_UNICODE))
    );
    return [$status >= 200 && $status < 300, $res];
}

/** Process a real Instagram webhook payload: match rules and send replies. */
function ig_handle_webhook_payload(array $payload): void
{
    foreach (($payload['entry'] ?? []) as $entry) {
        if (!is_array($entry)) continue;
        $igId = (string) ($entry['id'] ?? '');
        $st = db()->prepare("SELECT user_id, access_token FROM instagram_accounts WHERE ig_user_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1");
        $st->execute([$igId]);
        $account = $st->fetch();
        if (!$account || empty($account['access_token'])) continue;
        $uid   = (int) $account['user_id'];
        $token = (string) $account['access_token'];

        // Comments / story mentions
        foreach (($entry['changes'] ?? []) as $change) {
            if (!is_array($change)) continue;
            $field   = (string) ($change['field'] ?? '');
            $value   = is_array($change['value'] ?? null) ? $change['value'] : [];
            $text    = (string) ($value['text'] ?? '');
            $sender  = (string) ($value['from']['id'] ?? ($value['from']['username'] ?? ''));
            $media   = (string) ($value['media']['id'] ?? '');
            if ($sender === '' || $text === '') continue;
            $types = str_contains($field, 'comment') ? ['post', 'reel', 'global'] : ['mention', 'story', 'global'];
            $auto = ig_match_automation($uid, $types, $text);
            if (!$auto) {
                $st2 = db()->prepare("SELECT * FROM automations WHERE user_id = ? AND status = 'active' AND (keyword IS NULL OR keyword = '') AND type IN ('post','reel','global','mention','story') ORDER BY id DESC LIMIT 1");
                $st2->execute([$uid]);
                $auto = $st2->fetch() ?: null;
            }
            if (!$auto) continue;
            ig_deliver($auto, $uid, $sender, $igId, $token);
            if (in_array((string) $auto['type'], ['post', 'reel'], true) && !empty($auto['public_reply'])) {
                ig_reply_public($media, (string) $auto['public_reply'], $token, $uid, (int) $auto['id']);
            }
        }

        // Direct messages
        foreach (($entry['messaging'] ?? []) as $msg) {
            if (!is_array($msg)) continue;
            $text   = (string) ($msg['message']['text'] ?? '');
            $sender = (string) ($msg['sender']['id'] ?? '');
            if ($sender === '' || $text === '') continue;
            $auto = ig_match_automation($uid, ['dm', 'global', 'convo_starter', 'inbox_menu', 'suggest_more'], $text);
            if (!$auto) {
                $st2 = db()->prepare("SELECT * FROM automations WHERE user_id = ? AND type IN ('welcome','convo_starter') AND status = 'active' AND (keyword IS NULL OR keyword = '') ORDER BY id DESC LIMIT 1");
                $st2->execute([$uid]);
                $auto = $st2->fetch() ?: null;
            }
            if ($auto) ig_deliver($auto, $uid, $sender, $igId, $token);
        }
    }
}

/* =========================================================== API ROUTES */

$method = $_SERVER['REQUEST_METHOD'];
$path   = route();

/* ------------------------------------------------------------ auth ---- */

if ($path === '/api/auth/register' && $method === 'POST') {
    $in = json_in();
    $name = trim((string) ($in['name'] ?? ''));
    $email = strtolower(trim((string) ($in['email'] ?? '')));
    $password = (string) ($in['password'] ?? '');

    if ($name === '') fail('Please enter your full name.');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Please enter a valid email address.');
    if (strlen($password) < 8) fail('Password must be at least 8 characters long.');

    $exists = db()->prepare('SELECT id FROM users WHERE email = ?');
    $exists->execute([$email]);
    if ($exists->fetch()) fail('An account with this email already exists.');

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $verify = bin2hex(random_bytes(16));
    db()->prepare("INSERT INTO users (name, email, password_hash, verify_token, email_verified) VALUES (?,?,?, ?, 1)")
        ->execute([$name, $email, $hash, $verify]);

    $uid = (int) db()->lastInsertId();
    create_session($uid);

    out(['user' => user_array($uid), 'message' => 'Registration successful!'], 201);
}

if ($path === '/api/auth/login' && $method === 'POST') {
    $in = json_in();
    $email = strtolower(trim((string) ($in['email'] ?? '')));
    $password = (string) ($in['password'] ?? '');

    $st = db()->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
    $st->execute([$email]);
    $u = $st->fetch();

    if (!$u || !$u['password_hash'] || !password_verify($password, $u['password_hash'])) {
        fail('Invalid email or password.', 401);
    }
    if ($u['status'] === 'blocked') fail('Your account has been blocked.', 403);
    if ($u['status'] === 'deleted') fail('Your account has been deleted.', 403);

    create_session((int) $u['id']);
    out(['user' => user_array((int) $u['id'])]);
}

if ($path === '/api/auth/logout' && $method === 'POST') {
    $token = $_COOKIE[SESSION_COOKIE] ?? '';
    if ($token !== '') db()->prepare('DELETE FROM sessions WHERE token = ?')->execute([$token]);
    setcookie(SESSION_COOKIE, '', ['expires' => time() - 3600, 'path' => '/']);
    out(['ok' => true]);
}

if ($path === '/api/auth/me' && $method === 'GET') {
    $uid = current_user_id();
    out(['user' => $uid ? user_array($uid) : null]);
}

if ($path === '/api/auth/profile' && $method === 'PUT') {
    $uid = require_auth();
    $name = param('name');
    if ($name === '') fail('Name cannot be empty.');
    db()->prepare('UPDATE users SET name = ? WHERE id = ?')->execute([$name, $uid]);
    out(['user' => user_array($uid)]);
}

if ($path === '/api/auth/change-password' && $method === 'POST') {
    $uid = require_auth();
    $in = json_in();
    $current = (string) ($in['current_password'] ?? '');
    $next = (string) ($in['new_password'] ?? '');
    if (strlen($next) < 8) fail('Password must be at least 8 characters long.');

    $st = db()->prepare('SELECT password_hash FROM users WHERE id = ?');
    $st->execute([$uid]);
    $row = $st->fetch();
    if (!$row || !password_verify($current, $row['password_hash'])) fail('Your current password is incorrect.');

    db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
        ->execute([password_hash($next, PASSWORD_DEFAULT), $uid]);
    out(['ok' => true, 'message' => 'Password set successfully!']);
}

if ($path === '/api/auth/forgot-password' && $method === 'POST') {
    $email = strtolower(param('email'));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Please enter a valid email address.');
    $token = bin2hex(random_bytes(16));
    $st = db()->prepare('SELECT id FROM users WHERE email = ?');
    $st->execute([$email]);
    if ($st->fetch()) {
        db()->prepare('UPDATE users SET reset_token = ?, reset_expires = ? WHERE email = ?')
            ->execute([$token, date('Y-m-d H:i:s', time() + 3600), $email]);
    }
    out(['ok' => true, 'message' => 'Password reset link sent! Check your email.']);
}

if ($path === '/api/auth/reset-password' && $method === 'POST') {
    $in = json_in();
    $token = (string) ($in['token'] ?? '');
    $password = (string) ($in['password'] ?? '');
    if (strlen($password) < 8) fail('Password must be at least 8 characters long.');

    $st = db()->prepare('SELECT id FROM users WHERE reset_token = ? AND reset_expires > NOW() LIMIT 1');
    $st->execute([$token]);
    $u = $st->fetch();
    if (!$u) fail('Invalid recovery link. Please request a new password reset.', 400);

    db()->prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?')
        ->execute([password_hash($password, PASSWORD_DEFAULT), $u['id']]);
    out(['ok' => true, 'message' => 'Password Reset Successful!']);
}

if ($path === '/api/auth/verify-email' && $method === 'POST') {
    $in = json_in();
    $token = (string) ($in['token'] ?? '');
    $st = db()->prepare('SELECT id FROM users WHERE verify_token = ? LIMIT 1');
    $st->execute([$token]);
    $u = $st->fetch();
    if (!$u) fail('Failed to verify email.', 400);
    db()->prepare('UPDATE users SET email_verified = 1, verify_token = NULL WHERE id = ?')->execute([$u['id']]);
    out(['ok' => true]);
}

/* ----------------------------------------------------------- pricing --- */

if ($path === '/api/pricing' && $method === 'GET') {
    $rows = db()->query('SELECT * FROM plans ORDER BY display_order ASC')->fetchAll();
    $plans = array_map(static function (array $r): array {
        $r['id'] = (int) $r['id'];
        $r['is_popular'] = (bool) $r['is_popular'];
        $r['is_custom'] = (bool) $r['is_custom'];
        $r['price_monthly_inr'] = (int) $r['price_monthly_inr'];
        $r['price_yearly_inr'] = (int) $r['price_yearly_inr'];
        $r['price_yearly_monthly_inr'] = (int) $r['price_yearly_monthly_inr'];
        foreach (['feature_items', 'comparison'] as $k) {
            $r[$k] = $r[$k] ? json_decode((string) $r[$k], true) : null;
        }
        $r['actions_per_hour_limit'] = is_numeric($r['actions_per_hour_limit']) ? (int) $r['actions_per_hour_limit'] : $r['actions_per_hour_limit'];
        $r['actions_per_day_limit'] = is_numeric($r['actions_per_day_limit']) ? (int) $r['actions_per_day_limit'] : $r['actions_per_day_limit'];
        $r['actions_per_month_limit'] = is_numeric($r['actions_per_month_limit']) ? (int) $r['actions_per_month_limit'] : $r['actions_per_month_limit'];
        $r['pricing'] = [
            'monthly' => ['inr' => (int) $r['price_monthly_inr']],
            'yearly' => ['inr' => (int) $r['price_yearly_inr']],
            'yearly_monthly_display' => ['inr' => (int) $r['price_yearly_monthly_inr']],
        ];
        return $r;
    }, $rows);
    out(['plans' => $plans]);
}

/* ------------------------------------------------------------- blog ---- */

if ($path === '/api/blog' && $method === 'GET') {
    $rows = db()->query("SELECT slug, title, excerpt, category, cover_image, featured, published_at FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC")->fetchAll();
    out(['posts' => $rows]);
}

if (preg_match('#^/api/blog/([a-z0-9\-]+)$#', $path, $m) && $method === 'GET') {
    $st = db()->prepare("SELECT * FROM blog_posts WHERE slug = ? AND status = 'published'");
    $st->execute([$m[1]]);
    $post = $st->fetch();
    if (!$post) fail('Article not found.', 404);
    out(['post' => $post]);
}

/* ----------------------------------------------------------- contact --- */

if ($path === '/api/contact' && $method === 'POST') {
    $in = json_in();
    $name = trim((string) ($in['name'] ?? ''));
    $email = trim((string) ($in['email'] ?? ''));
    $subject = trim((string) ($in['subject'] ?? 'Contact form'));
    $message = trim((string) ($in['message'] ?? ''));

    if ($name === '') fail('Please enter your name.');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Please enter a valid email address.');
    if (strlen($message) < 10) fail('Please describe your issue in at least 10 characters.');

    db()->prepare('INSERT INTO contact_messages (name, email, subject, message) VALUES (?,?,?,?)')
        ->execute([$name, $email, $subject, $message]);

    out(['ok' => true, 'message' => "Message sent! Our team will reply to {$email} shortly."], 201);
}

/* -------------------------------------------------------- dashboard ---- */

if ($path === '/api/dashboard/stats' && $method === 'GET') {
    $uid = require_auth();

    $st = db()->prepare('SELECT COUNT(*) c, COALESCE(SUM(messages_sent),0) m, COALESCE(SUM(comments_handled),0) cm FROM daily_stats WHERE user_id = ? AND stat_day >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)');
    $st->execute([$uid]);
    $agg = $st->fetch() ?: ['c' => 0, 'm' => 0, 'cm' => 0];

    $st = db()->prepare("SELECT COUNT(*) c FROM automations WHERE user_id = ? AND status = 'active'");
    $st->execute([$uid]);
    $active = (int) ($st->fetch()['c'] ?? 0);

    $st = db()->prepare('SELECT COUNT(*) c FROM automations WHERE user_id = ?');
    $st->execute([$uid]);
    $total = (int) ($st->fetch()['c'] ?? 0);

    $st = db()->prepare("SELECT plan_code, actions_per_month_limit, actions_per_day_limit, actions_per_hour_limit FROM plans WHERE plan_code = (SELECT plan_code FROM users WHERE id = ?)");
    $st->execute([$uid]);
    $plan = $st->fetch() ?: null;

    $limit = $plan && is_numeric($plan['actions_per_month_limit']) ? (int) $plan['actions_per_month_limit'] : 0;
    $dailyLimit = $plan && is_numeric($plan['actions_per_day_limit']) ? (int) $plan['actions_per_day_limit'] : 0;
    $hourLimit = $plan && is_numeric($plan['actions_per_hour_limit']) ? (int) $plan['actions_per_hour_limit'] : 0;
    $used = (int) $agg['m'];

    $st = db()->prepare('SELECT COALESCE(messages_sent,0) FROM daily_stats WHERE user_id = ? AND stat_day = CURDATE()');
    $st->execute([$uid]);
    $dailyUsed = (int) ($st->fetchColumn() ?: 0);

    // 14-day chart series
    $st = db()->prepare('SELECT stat_day, messages_sent AS count FROM daily_stats WHERE user_id = ? AND stat_day >= DATE_SUB(CURDATE(), INTERVAL 13 DAY) ORDER BY stat_day ASC');
    $st->execute([$uid]);
    $daily = [];
    $byDay = [];
    foreach ($st->fetchAll() as $r) {
        $byDay[(string) $r['stat_day']] = (int) $r['count'];
    }
    for ($i = 13; $i >= 0; $i--) {
        $day = date('Y-m-d', time() - $i * 86400);
        $daily[] = ['day' => $day, 'count' => $byDay[$day] ?? 0];
    }

    out(['stats' => [
        'messages_sent'      => (int) $agg['m'],
        'comments_handled'   => (int) $agg['cm'],
        'automations_active' => $active,
        'automations_total'  => $total,
        'total_contacts'     => (int) $agg['c'],
        'actions_used'       => $used,
        'actions_limit'      => $limit,
        'actions_daily_used' => $dailyUsed,
        'actions_daily_limit'=> $dailyLimit,
        'actions_hourly_limit' => $hourLimit,
        'usage_percent'      => $limit > 0 ? min(100, (int) round($used * 100 / $limit)) : 0,
        'daily'              => $daily,
    ]]);
}

/* -------------------------------------------------------- automations -- */

function automation_payload(int $uid, array $in, ?int $id = null): array
{
    $fields = [
        'type'        => (string) ($in['type'] ?? 'dm'),
        'name'        => mb_substr((string) ($in['name'] ?? ''), 0, 160),
        'keyword'     => mb_substr((string) ($in['keyword'] ?? ''), 0, 190),
        'reply_text'  => (string) ($in['reply_text'] ?? ''),
        'public_reply'=> (string) ($in['public_reply'] ?? ''),
        'media_url'   => mb_substr((string) ($in['media_url'] ?? ''), 0, 500),
        'status'      => ($in['status'] ?? 'active') === 'inactive' ? 'inactive' : 'active',
    ];
    $buttons = $in['buttons'] ?? null;
    if (is_string($buttons) && trim($buttons) !== '') {
        json_decode($buttons, true);
        if (json_last_error() !== JSON_ERROR_NONE) fail('Buttons must be valid JSON.');
        $fields['buttons'] = $buttons;
    } elseif (is_array($buttons)) {
        $fields['buttons'] = json_encode($buttons, JSON_UNESCAPED_UNICODE);
    } else {
        $fields['buttons'] = null;
    }

    // Plan-gated automation options (Followers-only, Once/24h, Seen & Typing,
    // Share to Admin, No Watermark …). Sending an option the plan doesn't
    // include is rejected so the pricing table stays truthful.
    $opts = $in['options'] ?? null;
    if (is_string($opts) && trim($opts) !== '') {
        $opts = json_decode($opts, true);
        if (json_last_error() !== JSON_ERROR_NONE) fail('Options must be valid JSON.');
    }
    if (!is_array($opts)) $opts = [];
    $features = plan_features($uid);
    $optionFeatures = [
        'followers_only'   => 'followers_only',
        'once_per_user_24h'=> 'once_per_user_24h',
        'seen_typing'      => 'seen_typing',
        'no_watermark'     => 'no_watermark',
        'share_to_admin'   => $fields['type'] === 'reel' ? 'share_reel_to_admin' : 'share_post_to_admin',
    ];
    $cleanOpts = [];
    foreach ($optionFeatures as $optKey => $featKey) {
        $on = !empty($opts[$optKey]);
        if ($on && empty($features[$featKey])) {
            fail('"' . str_replace('_', ' ', $optKey) . '" is not included in your current plan. Upgrade to unlock it.', 403);
        }
        $cleanOpts[$optKey] = $on;
    }
    if (isset($opts['followers_only_message']) && $cleanOpts['followers_only']) {
        $cleanOpts['followers_only_message'] = mb_substr((string) $opts['followers_only_message'], 0, 500);
    }
    $fields['options'] = json_encode($cleanOpts, JSON_UNESCAPED_UNICODE);

    if ($fields['name'] === '') $fields['name'] = $fields['keyword'] !== '' ? $fields['keyword'] : ucfirst($fields['type']) . ' automation';
    if (isset($in['action']) && $in['action'] !== '') $fields['keyword'] = mb_substr($fields['keyword'], 0, 190);

    if ($id === null) {
        $sql = 'INSERT INTO automations (user_id, type, name, keyword, reply_text, public_reply, media_url, buttons, options, status)
                VALUES (:user_id, :type, :name, :keyword, :reply_text, :public_reply, :media_url, :buttons, :options, :status)';
        db()->prepare($sql)->execute([
            ':user_id' => $uid, ':type' => $fields['type'], ':name' => $fields['name'],
            ':keyword' => $fields['keyword'], ':reply_text' => $fields['reply_text'],
            ':public_reply' => $fields['public_reply'], ':media_url' => $fields['media_url'],
            ':buttons' => $fields['buttons'], ':options' => $fields['options'], ':status' => $fields['status'],
        ]);
        $id = (int) db()->lastInsertId();
    } else {
        $sql = 'UPDATE automations SET type=:type, name=:name, keyword=:keyword, reply_text=:reply_text,
                public_reply=:public_reply, media_url=:media_url, buttons=:buttons, options=:options, status=:status
                WHERE id=:id AND user_id=:user_id';
        db()->prepare($sql)->execute([
            ':type' => $fields['type'], ':name' => $fields['name'], ':keyword' => $fields['keyword'],
            ':reply_text' => $fields['reply_text'], ':public_reply' => $fields['public_reply'],
            ':media_url' => $fields['media_url'], ':buttons' => $fields['buttons'],
            ':options' => $fields['options'],
            ':status' => $fields['status'], ':id' => $id, ':user_id' => $uid,
        ]);
    }
    $st = db()->prepare('SELECT * FROM automations WHERE id = ? AND user_id = ?');
    $st->execute([$id, $uid]);
    $row = $st->fetch() ?: [];
    $row['id'] = (int) ($row['id'] ?? 0);
    if (isset($row['options']) && is_string($row['options'])) {
        $row['options'] = json_decode($row['options'], true) ?: [];
    }
    return $row;
}

function automations_out(array $rows): array
{
    foreach ($rows as &$r) {
        if (isset($r['options']) && is_string($r['options'])) {
            $r['options'] = json_decode($r['options'], true) ?: [];
        }
    }
    return $rows;
}

if ($path === '/api/automations' && $method === 'GET') {
    $uid = require_auth();
    $type = param('type');
    if ($type !== '') {
        $st = db()->prepare('SELECT * FROM automations WHERE user_id = ? AND type = ? ORDER BY id DESC');
        $st->execute([$uid, $type]);
    } else {
        $st = db()->prepare('SELECT * FROM automations WHERE user_id = ? ORDER BY id DESC');
        $st->execute([$uid]);
    }
    out(['automations' => automations_out($st->fetchAll())]);
}

if ($path === '/api/automations' && $method === 'POST') {
    $uid = require_auth();
    $in = json_in();
    $type = (string) ($in['type'] ?? 'dm');
    assert_plan_feature($uid, $type);
    out(['automation' => automation_payload($uid, $in)], 201);
}

if (preg_match('#^/api/automations/(\d+)$#', $path, $m) && $method === 'PUT') {
    $uid = require_auth();
    $id = (int) $m[1];
    $st = db()->prepare('SELECT id FROM automations WHERE id = ? AND user_id = ?');
    $st->execute([$id, $uid]);
    if (!$st->fetch()) fail('Automation not found.', 404);
    $in = json_in();
    $type = (string) ($in['type'] ?? 'dm');
    assert_plan_feature($uid, $type);
    out(['automation' => automation_payload($uid, $in, $id)]);
}

if (preg_match('#^/api/automations/(\d+)$#', $path, $m) && $method === 'DELETE') {
    $uid = require_auth();
    db()->prepare('DELETE FROM automations WHERE id = ? AND user_id = ?')->execute([(int) $m[1], $uid]);
    out(['ok' => true]);
}

/* ---------------------------------------------------------- my plan ---- */

if ($path === '/api/my-plan' && $method === 'GET') {
    $uid = require_auth();
    $st = db()->prepare('SELECT plan_code, plan_expires_at FROM users WHERE id = ?');
    $st->execute([$uid]);
    $u = $st->fetch() ?: ['plan_code' => 'free', 'plan_expires_at' => null];
    $expired = !empty($u['plan_expires_at']) && strtotime((string) $u['plan_expires_at']) < time();
    $code = $expired ? 'free' : (string) ($u['plan_code'] ?: 'free');

    $st = db()->prepare('SELECT * FROM plans WHERE plan_code = ?');
    $st->execute([$code]);
    $plan = $st->fetch() ?: null;
    if ($plan) {
        $plan['is_popular'] = (bool) $plan['is_popular'];
        $plan['price_monthly_inr'] = (int) $plan['price_monthly_inr'];
        $plan['price_yearly_inr'] = (int) $plan['price_yearly_inr'];
        $plan['price_yearly_monthly_inr'] = (int) $plan['price_yearly_monthly_inr'];
        $plan['feature_items'] = $plan['feature_items'] ? json_decode((string) $plan['feature_items'], true) : [];
    }

    $st = db()->prepare("SELECT COALESCE(SUM(messages_sent),0) m FROM daily_stats WHERE user_id = ? AND stat_day >= DATE_FORMAT(CURDATE(), '%Y-%m-01')");
    $st->execute([$uid]);
    $used = (int) ($st->fetch()['m'] ?? 0);

    $limit = $plan && is_numeric($plan['actions_per_month_limit']) ? (int) $plan['actions_per_month_limit'] : 0;
    $dailyLimit = $plan && is_numeric($plan['actions_per_day_limit']) ? (int) $plan['actions_per_day_limit'] : 0;
    $hourLimit = $plan && is_numeric($plan['actions_per_hour_limit']) ? (int) $plan['actions_per_hour_limit'] : 0;

    out([
        'plan' => $plan,
        'status' => $expired ? 'expired' : 'active',
        'expires_at' => $u['plan_expires_at'],
        'plan_code' => $code,
        'usage' => [
            'monthly_used' => $used,
            'monthly_limit' => $limit,
            'daily_limit' => $dailyLimit ?: 'Unlimited',
            'hourly_limit' => $hourLimit ?: 'Meta rate limits',
        ],
    ]);
}

/* ------------------------------------------------------ transactions --- */

if ($path === '/api/transactions' && $method === 'GET') {
    $uid = require_auth();
    $st = db()->prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY id DESC LIMIT 100');
    $st->execute([$uid]);
    out(['transactions' => $st->fetchAll()]);
}

/* ---------------------------------------------------- instagram accs --- */

if ($path === '/api/instagram/accounts' && $method === 'GET') {
    $uid = require_auth();
    $st = db()->prepare('SELECT id, ig_user_id, username, account_type, status, connected_at FROM instagram_accounts WHERE user_id = ?');
    $st->execute([$uid]);
    out(['accounts' => $st->fetchAll()]);
}

// Disconnect (log out) a linked Instagram account.
if ($path === '/api/instagram/disconnect' && $method === 'POST') {
    $uid = require_auth();
    $in = json_in();
    $accountId = (int) ($in['account_id'] ?? 0);
    $st = db()->prepare('SELECT id FROM instagram_accounts WHERE id = ? AND user_id = ?');
    $st->execute([$accountId, $uid]);
    if (!$st->fetch()) fail('Instagram account not found.', 404);
    db()->prepare('DELETE FROM instagram_accounts WHERE id = ? AND user_id = ?')->execute([$accountId, $uid]);
    if ((int) (get_setting('ig_active_' . $uid, '0') ?: 0) === $accountId) {
        set_setting('ig_active_' . $uid, '0');
    }
    out(['ok' => true]);
}

// Choose which linked account the dashboard works with.
if ($path === '/api/instagram/select' && $method === 'POST') {
    $uid = require_auth();
    $in = json_in();
    $accountId = (int) ($in['account_id'] ?? 0);
    if ($accountId <= 0) fail('Invalid account.', 400);
    $st = db()->prepare('SELECT id FROM instagram_accounts WHERE id = ? AND user_id = ?');
    $st->execute([$accountId, $uid]);
    if (!$st->fetch()) fail('Instagram account not found.', 404);
    set_setting('ig_active_' . $uid, (string) $accountId);
    out(['ok' => true, 'account_id' => $accountId]);
}

// Real notifications derived from the user's own data.
if ($path === '/api/notifications' && $method === 'GET') {
    $uid = require_auth();
    $items = [];

    $st = db()->prepare('SELECT COUNT(*) c FROM instagram_accounts WHERE user_id = ?');
    $st->execute([$uid]);
    if ((int) ($st->fetch()['c'] ?? 0) === 0) {
        $items[] = [
            'id' => 'ig_connect', 'title' => 'Connect your Instagram',
            'body' => 'Link an account to unlock all dashboard tools.', 'created_at' => date('Y-m-d H:i:s'),
        ];
    }

    $st = db()->prepare("SELECT subject, created_at FROM support_tickets WHERE user_id = ? AND status IN ('open','pending') ORDER BY id DESC LIMIT 3");
    $st->execute([$uid]);
    foreach ($st->fetchAll() as $t) {
        $items[] = [
            'id' => 'ticket_' . $t['subject'], 'title' => 'Support ticket still open',
            'body' => (string) $t['subject'], 'created_at' => (string) $t['created_at'],
        ];
    }

    $st = db()->prepare("SELECT plan_name, created_at FROM transactions WHERE user_id = ? AND status = 'success' ORDER BY id DESC LIMIT 2");
    $st->execute([$uid]);
    foreach ($st->fetchAll() as $t) {
        $items[] = [
            'id' => 'payment_' . $t['created_at'], 'title' => 'Payment successful',
            'body' => 'Your ' . (string) $t['plan_name'] . ' plan is active.', 'created_at' => (string) $t['created_at'],
        ];
    }

    usort($items, static function (array $a, array $b): int {
        return strcmp((string) $b['created_at'], (string) $a['created_at']);
    });
    out(['notifications' => $items]);
}

// Start a real Meta/Instagram OAuth connection. Both paths are kept because
// older dashboard code calls /api/instagram/connect-url.
if (($path === '/api/instagram/connect-url' || $path === '/api/auth/instagram/url') && $method === 'GET') {
    require_auth();
    $origin = safe_redirect_origin($_SERVER['HTTP_ORIGIN'] ?? '');
    out(instagram_connect_url($origin));
}

// Exchange the one-time token handed back by /auth/ig-callback and link the
// Instagram accounts it found to the currently logged-in user (same pattern
// as Google's /api/auth/google/exchange).
if ($path === '/api/instagram/link' && $method === 'POST') {
    $uid = require_auth();
    $in = json_in();
    $token = (string) ($in['token'] ?? '');
    if ($token === '' || !preg_match('/^[0-9a-f]{48}$/', $token)) fail('Invalid Instagram link token.', 400);

    $key = 'iglink_' . $token;
    $raw = get_setting($key, '');
    if ($raw === '') fail('This Instagram link request is invalid or has already been used.', 400);
    $data = json_decode($raw, true);
    if (!is_array($data) || (int) ($data['expires_at'] ?? 0) < time()) {
        db()->prepare('DELETE FROM settings WHERE setting_key = ?')->execute([$key]);
        fail('This Instagram link request has expired. Please connect again.', 400);
    }

    $accounts = is_array($data['accounts'] ?? null) ? $data['accounts'] : [];
    if (!$accounts) fail('No Instagram account was found for this connection.', 400);

    foreach ($accounts as $a) {
        $igId = (string) ($a['ig_user_id'] ?? '');
        if ($igId === '') continue;
        db()->prepare(
            'INSERT INTO instagram_accounts (user_id, ig_user_id, username, account_type, status, access_token, connected_at)
             VALUES (?, ?, ?, ?, \'active\', ?, NOW())
             ON DUPLICATE KEY UPDATE username = VALUES(username), account_type = VALUES(account_type), access_token = VALUES(access_token), status = \'active\''
        )->execute([
            $uid, $igId, (string) ($a['username'] ?? ''),
            (string) ($a['account_type'] ?? 'BUSINESS'), (string) ($a['access_token'] ?? ''),
        ]);
    }
    db()->prepare('DELETE FROM settings WHERE setting_key = ?')->execute([$key]);

    $st = db()->prepare('SELECT id, ig_user_id, username, account_type, status, connected_at FROM instagram_accounts WHERE user_id = ? ORDER BY id DESC');
    $st->execute([$uid]);
    out(['ok' => true, 'accounts' => $st->fetchAll()]);
}

/* ------------------------------------------------------------- support - */

if ($path === '/api/support/tickets' && $method === 'GET') {
    $uid = require_auth();
    $st = db()->prepare('SELECT * FROM support_tickets WHERE user_id = ? ORDER BY id DESC LIMIT 50');
    $st->execute([$uid]);
    out(['tickets' => $st->fetchAll()]);
}

if ($path === '/api/support/tickets' && $method === 'POST') {
    $uid = require_auth();
    $in = json_in();
    $subject = trim((string) ($in['subject'] ?? ''));
    $message = trim((string) ($in['message'] ?? ''));
    if ($subject === '') fail('Please add a subject.');
    if (strlen($message) < 10) fail('Please add at least 10 characters of detail.');

    // Priority Support (Basic/Pro): tickets from plans with the
    // priority_support feature are queued as priority.
    $priority = !empty(plan_features($uid)['priority_support']) ? 'priority' : 'normal';

    db()->prepare('INSERT INTO support_tickets (user_id, subject, message, priority) VALUES (?,?,?,?)')
        ->execute([$uid, $subject, $message, $priority]);
    $id = (int) db()->lastInsertId();
    $st = db()->prepare('SELECT * FROM support_tickets WHERE id = ?');
    $st->execute([$id]);
    out(['ticket' => $st->fetch()], 201);
}

/* ------------------------------------------------------- super profile - */

if ($path === '/api/superprofile' && $method === 'GET') {
    $uid = require_auth();
    $st = db()->prepare('SELECT * FROM super_profiles WHERE user_id = ?');
    $st->execute([$uid]);
    $p = $st->fetch();
    out(['profile' => $p ?: null]);
}

if (($path === '/api/superprofile') && ($method === 'POST' || $method === 'PUT')) {
    $uid = require_auth();
    assert_plan_feature($uid, 'super_profile');
    $in = json_in();
    $bio = (string) ($in['bio'] ?? '');
    $links = (string) ($in['links'] ?? '[]');
    json_decode($links, true);
    if (json_last_error() !== JSON_ERROR_NONE) fail('Links must be valid JSON.');

    $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '-', (string) (user_array($uid)['name'] ?? 'user') . '-' . $uid) ?: 'profile');

    $st = db()->prepare('SELECT id FROM super_profiles WHERE user_id = ?');
    $st->execute([$uid]);
    if ($st->fetch()) {
        db()->prepare('UPDATE super_profiles SET bio = ?, links = ? WHERE user_id = ?')->execute([$bio, $links, $uid]);
    } else {
        db()->prepare('INSERT INTO super_profiles (user_id, slug, bio, links) VALUES (?,?,?,?)')
            ->execute([$uid, $slug, $bio, $links]);
    }
    $st = db()->prepare('SELECT * FROM super_profiles WHERE user_id = ?');
    $st->execute([$uid]);
    out(['profile' => $st->fetch()]);
}

/* ------------------------------------------------------------- upload --- */
if ($path === '/api/upload' && $method === 'POST') {
    $uid = require_auth();
    if (!isset($_FILES['file']) || !is_array($_FILES['file'])) fail('No file uploaded.');
    $f = $_FILES['file'];
    if (($f['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) fail('Upload failed (code ' . (int) $f['error'] . ').');
    if (($f['size'] ?? 0) > 5 * 1024 * 1024) fail('File too large (max 5 MB).');
    $mime = function_exists('mime_content_type') ? (string) mime_content_type($f['tmp_name']) : (string) ($f['type'] ?? '');
    $allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
    if (!isset($allowed[$mime])) fail('Only JPG, PNG, WEBP or GIF images are allowed.');
    $dir = __DIR__ . '/uploads';
    if (!is_dir($dir)) @mkdir($dir, 0777, true);
    $name = bin2hex(random_bytes(8)) . '.' . $allowed[$mime];
    if (!move_uploaded_file($f['tmp_name'], $dir . '/' . $name)) fail('Could not save file.');
    out(['url' => '/uploads/' . $name]);
}

/* ------------------------------------------------------- site content -- */

if ($path === '/api/content' && $method === 'GET') {
    $rows = db()->query('SELECT content_key, content_value FROM site_content')->fetchAll();
    $out = [];
    foreach ($rows as $r) {
        $out[$r['content_key']] = json_decode((string) $r['content_value'], true);
    }
    out(['content' => $out]);
}

if (preg_match('#^/api/content/([a-z0-9_\-]+)$#', $path, $m) && $method === 'GET') {
    $st = db()->prepare('SELECT content_value FROM site_content WHERE content_key = ?');
    $st->execute([$m[1]]);
    $row = $st->fetch();
    if (!$row) fail('Content not found.', 404);
    out(['key' => $m[1], 'value' => json_decode((string) $row['content_value'], true)]);
}

/* ---------------------------------------------------------- payments --- */

// Public payment config (key id only — secret stays server-side).
if ($path === '/api/payments/config' && $method === 'GET') {
    out([
        'mode' => 'live',
        'key_id' => get_setting('payment_key_id', ''),
        'currency' => get_setting('currency', 'INR'),
    ]);
}

// Create a real order on Razorpay, then record it as pending locally.
if ($path === '/api/payments/create-order' && $method === 'POST') {
    $uid = require_auth();
    $in = json_in();
    $planCode = (string) ($in['plan_code'] ?? '');
    $cycle = ($in['cycle'] ?? 'monthly') === 'yearly' ? 'yearly' : 'monthly';

    $st = db()->prepare('SELECT * FROM plans WHERE plan_code = ?');
    $st->execute([$planCode]);
    $plan = $st->fetch();
    if (!$plan) fail('Plan not found.', 404);
    if ($plan['plan_code'] === 'free') fail('The Free plan does not require payment.');

    $amount = $cycle === 'yearly' ? (int) $plan['price_yearly_inr'] : (int) $plan['price_monthly_inr'];
    if ($amount <= 0) fail('Invalid plan price.');

    $currency = get_setting('currency', 'INR');
    [$rs, $order] = razorpay_api('orders', 'POST', [
        'amount'   => $amount * 100, // Razorpay expects paise
        'currency' => $currency,
        'receipt'  => 'rcpt_' . $uid . '_' . time(),
        'notes'    => [
            'user_id'    => (string) $uid,
            'plan_code'  => $plan['plan_code'],
            'cycle'      => $cycle,
        ],
    ]);
    if ($rs !== 200 || empty($order['id'])) {
        $msg = $order['error']['description'] ?? ($order['error'] ?? ('HTTP ' . $rs));
        fail('Could not create a payment order: ' . (is_string($msg) ? $msg : 'gateway error'), 502);
    }
    $orderId = (string) $order['id'];

    db()->prepare(
        'INSERT INTO transactions (user_id, plan_code, plan_name, amount, currency, method, payment_id, status)
         VALUES (?,?,?,?,?,?,?,\'pending\')'
    )->execute([
        $uid, $plan['plan_code'], $plan['name'], $amount, $currency, 'Razorpay', $orderId,
    ]);
    $txId = (int) db()->lastInsertId();

    out([
        'order_id' => $orderId,
        'transaction_id' => $txId,
        'amount' => $amount,
        'currency' => $currency,
        'plan_code' => $plan['plan_code'],
        'plan_name' => $plan['name'],
        'cycle' => $cycle,
        'mode' => 'live',
        'key_id' => get_setting('payment_key_id', ''),
    ], 201);
}

// Verify Razorpay's HMAC-SHA256 signature before upgrading the plan.
if ($path === '/api/payments/verify' && $method === 'POST') {
    $uid = require_auth();
    $in = json_in();
    $orderId = (string) ($in['order_id'] ?? '');
    $paymentId = (string) ($in['payment_id'] ?? '');
    $signature = (string) ($in['signature'] ?? '');
    if ($orderId === '' || $paymentId === '' || $signature === '') {
        fail('Missing payment details.', 400);
    }

    $st = db()->prepare('SELECT * FROM transactions WHERE user_id = ? AND payment_id = ? AND status = \'pending\' LIMIT 1');
    $st->execute([$uid, $orderId]);
    $tx = $st->fetch();
    if (!$tx) fail('Payment order not found or already processed.', 404);

    $secret = get_setting('payment_key_secret', '');
    if ($secret === '') fail('Razorpay key secret is not configured.', 501);
    $expected = hash_hmac('sha256', $orderId . '|' . $paymentId, $secret);
    if (!hash_equals($expected, $signature)) fail('Payment signature verification failed.', 400);

    db()->prepare('UPDATE transactions SET payment_id = ?, status = \'success\' WHERE id = ?')
        ->execute([$paymentId, $tx['id']]);

    // Upgrade the user's plan (duration depends on monthly vs yearly amount).
    $st = db()->prepare('SELECT price_yearly_inr, duration_days_monthly, duration_days_yearly FROM plans WHERE plan_code = ?');
    $st->execute([$tx['plan_code']]);
    $p2 = $st->fetch();
    $days = 30;
    if ($p2) {
        $days = ((int) $tx['amount'] === (int) $p2['price_yearly_inr'])
            ? (int) $p2['duration_days_yearly']
            : (int) $p2['duration_days_monthly'];
    }
    $expires = date('Y-m-d H:i:s', time() + max(1, $days) * 86400);
    db()->prepare('UPDATE users SET plan_code = ?, plan_expires_at = ? WHERE id = ?')
        ->execute([$tx['plan_code'], $expires, $uid]);

    out([
        'ok' => true,
        'message' => 'Payment successful! Your plan has been upgraded.',
        'plan_code' => $tx['plan_code'],
        'expires_at' => $expires,
        'transaction_id' => (int) $tx['id'],
    ]);
}

/* ------------------------------------------------------------- admin ---- */

// Admin dashboard stats
if ($path === '/api/admin/stats' && $method === 'GET') {
    require_admin();
    $q = static function (string $sql, array $params = []) {
        $st = db()->prepare($sql);
        $st->execute($params);
        return $st->fetchColumn();
    };
    out(['stats' => [
        'users_total' => (int) $q('SELECT COUNT(*) FROM users'),
        'users_active' => (int) $q("SELECT COUNT(*) FROM users WHERE status = 'active'"),
        'users_admin' => (int) $q("SELECT COUNT(*) FROM users WHERE role = 'admin'"),
        'revenue_total' => (int) $q("SELECT COALESCE(SUM(amount),0) FROM transactions WHERE status = 'success'"),
        'revenue_month' => (int) $q("SELECT COALESCE(SUM(amount),0) FROM transactions WHERE status = 'success' AND created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')"),
        'transactions_pending' => (int) $q("SELECT COUNT(*) FROM transactions WHERE status = 'pending'"),
        'plans_count' => (int) $q('SELECT COUNT(*) FROM plans'),
        'blog_posts' => (int) $q("SELECT COUNT(*) FROM blog_posts WHERE status = 'published'"),
        'tickets_open' => (int) $q("SELECT COUNT(*) FROM support_tickets WHERE status = 'open'"),
        'contact_new' => (int) $q("SELECT COUNT(*) FROM contact_messages WHERE status = 'new'"),
        'automations_total' => (int) $q('SELECT COUNT(*) FROM automations'),
        'automations_active' => (int) $q("SELECT COUNT(*) FROM automations WHERE status = 'active'"),
        'messages_sent' => (int) $q('SELECT COALESCE(SUM(messages_sent),0) FROM daily_stats'),
        'content_keys' => (int) $q('SELECT COUNT(*) FROM site_content'),
    ]]);
}

// Users list + management
if ($path === '/api/admin/users' && $method === 'GET') {
    require_admin();
    $q = trim((string) ($_GET['q'] ?? ''));
    if ($q !== '') {
        $st = db()->prepare("SELECT id, name, email, role, plan_code, status, created_at FROM users WHERE name LIKE ? OR email LIKE ? ORDER BY id DESC LIMIT 200");
        $like = "%{$q}%";
        $st->execute([$like, $like]);
    } else {
        $st = db()->query('SELECT id, name, email, role, plan_code, status, created_at FROM users ORDER BY id DESC LIMIT 200');
        $st->execute();
    }
    out(['users' => $st->fetchAll()]);
}

if (preg_match('#^/api/admin/users/(\d+)$#', $path, $m) && $method === 'PUT') {
    $adminId = require_admin();
    $id = (int) $m[1];
    if ($id === $adminId) fail('You cannot change your own record here.');
    $in = json_in();
    $fields = [];
    $params = [];
    if (isset($in['status']) && in_array($in['status'], ['active', 'blocked', 'deleted'], true)) {
        $fields[] = 'status = ?';
        $params[] = $in['status'];
    }
    if (isset($in['role']) && in_array($in['role'], ['user', 'admin'], true)) {
        $fields[] = 'role = ?';
        $params[] = $in['role'];
    }
    if (isset($in['plan_code'])) {
        $st = db()->prepare('SELECT plan_code FROM plans WHERE plan_code = ?');
        $st->execute([(string) $in['plan_code']]);
        if (!$st->fetch()) fail('Unknown plan.');
        $fields[] = 'plan_code = ?';
        $params[] = (string) $in['plan_code'];
    }
    if (!$fields) fail('Nothing to update.');
    $params[] = $id;
    db()->prepare('UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);

    $st = db()->prepare('SELECT id, name, email, role, plan_code, status, created_at FROM users WHERE id = ?');
    $st->execute([$id]);
    out(['user' => $st->fetch()]);
}

if (preg_match('#^/api/admin/users/(\d+)$#', $path, $m) && $method === 'DELETE') {
    $adminId = require_admin();
    $id = (int) $m[1];
    if ($id === $adminId) fail('You cannot delete your own account.');
    db()->prepare('DELETE FROM users WHERE id = ?')->execute([$id]);
    out(['ok' => true]);
}

// Plans management
if ($path === '/api/admin/plans' && $method === 'GET') {
    require_admin();
    out(['plans' => db()->query('SELECT * FROM plans ORDER BY display_order ASC')->fetchAll()]);
}

if ($path === '/api/admin/plans' && $method === 'POST') {
    require_admin();
    $in = json_in();
    $code = strtolower(trim((string) ($in['plan_code'] ?? '')));
    $name = trim((string) ($in['name'] ?? ''));
    if ($code === '' || $name === '') fail('plan_code and name are required.');
    $st = db()->prepare('SELECT id FROM plans WHERE plan_code = ?');
    $st->execute([$code]);
    if ($st->fetch()) fail('Plan already exists.');

    db()->prepare(
        'INSERT INTO plans (plan_code, name, display_order, button_text, is_popular, is_custom,
            price_monthly_inr, price_yearly_inr, price_yearly_monthly_inr,
            actions_per_hour_limit, actions_per_day_limit, actions_per_month_limit, feature_items, comparison)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    )->execute([
        $code, $name, (int) ($in['display_order'] ?? 99), (string) ($in['button_text'] ?? 'Choose Plan'),
        !empty($in['is_popular']) ? 1 : 0, !empty($in['is_custom']) ? 1 : 0,
        (int) ($in['price_monthly_inr'] ?? 0), (int) ($in['price_yearly_inr'] ?? 0), (int) ($in['price_yearly_monthly_inr'] ?? 0),
        (string) ($in['actions_per_hour_limit'] ?? '100'), (string) ($in['actions_per_day_limit'] ?? '100'),
        (string) ($in['actions_per_month_limit'] ?? '1000'),
        isset($in['feature_items']) ? json_encode($in['feature_items'], JSON_UNESCAPED_UNICODE) : null,
        isset($in['comparison']) ? json_encode($in['comparison'], JSON_UNESCAPED_UNICODE) : null,
    ]);
    out(['id' => (int) db()->lastInsertId()], 201);
}

if (preg_match('#^/api/admin/plans/(\d+)$#', $path, $m) && $method === 'PUT') {
    require_admin();
    $id = (int) $m[1];
    $in = json_in();
    $map = [
        'name' => 'name', 'display_order' => 'display_order', 'button_text' => 'button_text',
        'price_monthly_inr' => 'price_monthly_inr', 'price_yearly_inr' => 'price_yearly_inr',
        'price_yearly_monthly_inr' => 'price_yearly_monthly_inr',
        'actions_per_hour_limit' => 'actions_per_hour_limit', 'actions_per_day_limit' => 'actions_per_day_limit',
        'actions_per_month_limit' => 'actions_per_month_limit', 'yearly_bonus' => 'yearly_bonus',
    ];
    $fields = [];
    $params = [];
    foreach ($map as $inKey => $col) {
        if (array_key_exists($inKey, $in)) {
            $fields[] = "{$col} = ?";
            $params[] = is_int($in[$inKey]) || is_float($in[$inKey]) ? $in[$inKey] : (string) $in[$inKey];
        }
    }
    foreach (['is_popular', 'is_custom'] as $flag) {
        if (array_key_exists($flag, $in)) {
            $fields[] = "{$flag} = ?";
            $params[] = !empty($in[$flag]) ? 1 : 0;
        }
    }
    foreach (['feature_items', 'comparison'] as $jsonCol) {
        if (array_key_exists($jsonCol, $in)) {
            $fields[] = "{$jsonCol} = ?";
            $params[] = is_string($in[$jsonCol]) ? $in[$jsonCol] : json_encode($in[$jsonCol], JSON_UNESCAPED_UNICODE);
        }
    }
    if (!$fields) fail('Nothing to update.');
    $params[] = $id;
    db()->prepare('UPDATE plans SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
    $st = db()->prepare('SELECT * FROM plans WHERE id = ?');
    $st->execute([$id]);
    out(['plan' => $st->fetch()]);
}

if (preg_match('#^/api/admin/plans/(\d+)$#', $path, $m) && $method === 'DELETE') {
    require_admin();
    $id = (int) $m[1];
    $st = db()->prepare('SELECT plan_code FROM plans WHERE id = ?');
    $st->execute([$id]);
    $plan = $st->fetch();
    if (!$plan) fail('Plan not found.', 404);
    if (in_array($plan['plan_code'], ['free', 'basic', 'pro'], true)) {
        fail('Built-in plans cannot be deleted. Edit them instead.');
    }
    $used = db()->prepare('SELECT COUNT(*) FROM users WHERE plan_code = ?');
    $used->execute([$plan['plan_code']]);
    if ((int) $used->fetchColumn() > 0) {
        fail('Plan is assigned to users and cannot be deleted.');
    }
    db()->prepare('DELETE FROM plans WHERE id = ?')->execute([$id]);
    out(['ok' => true]);
}

// Blog management
if ($path === '/api/admin/blog' && $method === 'GET') {
    require_admin();
    out(['posts' => db()->query('SELECT * FROM blog_posts ORDER BY published_at DESC')->fetchAll()]);
}

if ($path === '/api/admin/blog' && $method === 'POST') {
    require_admin();
    $in = json_in();
    $slug = strtolower(trim((string) ($in['slug'] ?? '')));
    $title = trim((string) ($in['title'] ?? ''));
    if ($slug === '' || $title === '') fail('slug and title are required.');
    $st = db()->prepare('SELECT id FROM blog_posts WHERE slug = ?');
    $st->execute([$slug]);
    if ($st->fetch()) fail('Slug already exists.');

    db()->prepare(
        'INSERT INTO blog_posts (slug, title, excerpt, content, category, cover_image, featured, status, published_at)
         VALUES (?,?,?,?,?,?,?,?,?)'
    )->execute([
        $slug, $title, (string) ($in['excerpt'] ?? ''), (string) ($in['content'] ?? ''),
        (string) ($in['category'] ?? 'Instagram Automation'), (string) ($in['cover_image'] ?? ''),
        !empty($in['featured']) ? 1 : 0, ($in['status'] ?? 'published') === 'draft' ? 'draft' : 'published',
        (string) ($in['published_at'] ?? date('Y-m-d H:i:s')),
    ]);
    out(['id' => (int) db()->lastInsertId()], 201);
}

if (preg_match('#^/api/admin/blog/(\d+)$#', $path, $m) && $method === 'PUT') {
    require_admin();
    $id = (int) $m[1];
    $in = json_in();
    $map = ['slug' => 'slug', 'title' => 'title', 'excerpt' => 'excerpt', 'content' => 'content',
            'category' => 'category', 'cover_image' => 'cover_image', 'status' => 'status',
            'published_at' => 'published_at'];
    $fields = [];
    $params = [];
    foreach ($map as $k => $col) {
        if (array_key_exists($k, $in)) {
            $fields[] = "{$col} = ?";
            $params[] = (string) $in[$k];
        }
    }
    if (array_key_exists('featured', $in)) {
        $fields[] = 'featured = ?';
        $params[] = !empty($in['featured']) ? 1 : 0;
    }
    if (!$fields) fail('Nothing to update.');
    $params[] = $id;
    db()->prepare('UPDATE blog_posts SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
    $st = db()->prepare('SELECT * FROM blog_posts WHERE id = ?');
    $st->execute([$id]);
    out(['post' => $st->fetch()]);
}

if (preg_match('#^/api/admin/blog/(\d+)$#', $path, $m) && $method === 'DELETE') {
    require_admin();
    db()->prepare('DELETE FROM blog_posts WHERE id = ?')->execute([(int) $m[1]]);
    out(['ok' => true]);
}

// Transactions (all users)
if ($path === '/api/admin/transactions' && $method === 'GET') {
    require_admin();
    out(['transactions' => db()->query(
        'SELECT t.*, u.email AS user_email, u.name AS user_name
           FROM transactions t LEFT JOIN users u ON u.id = t.user_id
          ORDER BY t.id DESC LIMIT 300'
    )->fetchAll()]);
}

if (preg_match('#^/api/admin/transactions/(\d+)$#', $path, $m) && $method === 'PUT') {
    require_admin();
    $in = json_in();
    $status = (string) ($in['status'] ?? '');
    if (!in_array($status, ['pending', 'success', 'failed', 'refunded'], true)) fail('Invalid status.');
    db()->prepare('UPDATE transactions SET status = ? WHERE id = ?')->execute([$status, (int) $m[1]]);
    out(['ok' => true]);
}

// Support tickets (all users)
if ($path === '/api/admin/tickets' && $method === 'GET') {
    require_admin();
    out(['tickets' => db()->query(
        'SELECT t.*, u.email AS user_email, u.name AS user_name
           FROM support_tickets t LEFT JOIN users u ON u.id = t.user_id
          ORDER BY t.id DESC LIMIT 300'
    )->fetchAll()]);
}

if (preg_match('#^/api/admin/tickets/(\d+)$#', $path, $m) && $method === 'PUT') {
    require_admin();
    $in = json_in();
    $status = (string) ($in['status'] ?? '');
    if (!in_array($status, ['open', 'pending', 'resolved'], true)) fail('Invalid status.');
    db()->prepare('UPDATE support_tickets SET status = ? WHERE id = ?')->execute([$status, (int) $m[1]]);
    out(['ok' => true]);
}

// Contact messages
if ($path === '/api/admin/contact' && $method === 'GET') {
    require_admin();
    out(['messages' => db()->query('SELECT * FROM contact_messages ORDER BY id DESC LIMIT 300')->fetchAll()]);
}

if (preg_match('#^/api/admin/contact/(\d+)$#', $path, $m) && $method === 'PUT') {
    require_admin();
    $in = json_in();
    $status = (string) ($in['status'] ?? '');
    if (!in_array($status, ['new', 'read', 'replied'], true)) fail('Invalid status.');
    db()->prepare('UPDATE contact_messages SET status = ? WHERE id = ?')->execute([$status, (int) $m[1]]);
    out(['ok' => true]);
}

// Site content (editable marketing copy)
if ($path === '/api/admin/content' && $method === 'GET') {
    require_admin();
    $rows = db()->query('SELECT content_key, content_value, updated_at FROM site_content ORDER BY content_key')->fetchAll();
    $out = [];
    foreach ($rows as $r) {
        $out[] = ['key' => $r['content_key'], 'value' => json_decode((string) $r['content_value'], true), 'updated_at' => $r['updated_at']];
    }
    out(['content' => $out]);
}

if ($path === '/api/admin/content' && $method === 'PUT') {
    require_admin();
    $in = json_in();
    $key = (string) ($in['key'] ?? '');
    if ($key === '' || !array_key_exists('value', $in)) fail('key and value are required.');
    db()->prepare(
        'INSERT INTO site_content (content_key, content_value) VALUES (?,?)
         ON DUPLICATE KEY UPDATE content_value = VALUES(content_value)'
    )->execute([$key, json_encode($in['value'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]);
    out(['ok' => true]);
}

// Settings (payment keys etc.)
if ($path === '/api/admin/settings' && $method === 'GET') {
    require_admin();
    out(['settings' => [
        'payment_key_id' => get_setting('payment_key_id', ''),
        // secret masked in the response
        'payment_key_secret_set' => get_setting('payment_key_secret', '') !== '',
        'payment_mode' => 'live',
        'currency' => get_setting('currency', 'INR'),
    ]]);
}

if ($path === '/api/admin/settings' && $method === 'PUT') {
    require_admin();
    $in = json_in();
    if (array_key_exists('payment_key_id', $in)) set_setting('payment_key_id', (string) $in['payment_key_id']);
    if (array_key_exists('payment_key_secret', $in) && (string) $in['payment_key_secret'] !== '') {
        set_setting('payment_key_secret', (string) $in['payment_key_secret']);
    }
    if (array_key_exists('currency', $in)) set_setting('currency', (string) $in['currency']);
    out(['ok' => true]);
}

// Automations (all users, for admin moderation)
if ($path === '/api/admin/automations' && $method === 'GET') {
    require_admin();
    out(['automations' => db()->query(
        'SELECT a.*, u.email AS user_email FROM automations a
           LEFT JOIN users u ON u.id = a.user_id ORDER BY a.id DESC LIMIT 300'
    )->fetchAll()]);
}

/* -------------------------------- live-site-compatible auth surface --- */

// POST /api/login — same credentials as /api/auth/login, returns {token}.
if ($path === '/api/login' && $method === 'POST') {
    $in = json_in();
    $email = strtolower(trim((string) ($in['email'] ?? '')));
    $password = (string) ($in['password'] ?? '');
    $st = db()->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
    $st->execute([$email]);
    $u = $st->fetch();
    if (!$u || !$u['password_hash'] || !password_verify($password, $u['password_hash'])) {
        fail('Invalid email or password.', 401);
    }
    if ($u['status'] === 'blocked') fail('Your account has been blocked.', 403);
    if ($u['status'] === 'deleted') fail('Your account has been deleted.', 403);
    out(['token' => create_session((int) $u['id'])]);
}

// POST /api/register — requires email verification (matches the live site).
if ($path === '/api/register' && $method === 'POST') {
    $in = json_in();
    $name = trim((string) ($in['name'] ?? ''));
    $email = strtolower(trim((string) ($in['email'] ?? '')));
    $password = (string) ($in['password'] ?? '');
    if ($name === '') fail('Please enter your full name.');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Please enter a valid email address.');
    if (strlen($password) < 8) fail('Password must be at least 8 characters long.');
    $exists = db()->prepare('SELECT id FROM users WHERE email = ?');
    $exists->execute([$email]);
    if ($exists->fetch()) fail('An account with this email already exists.');

    $verify = bin2hex(random_bytes(16));
    db()->prepare('INSERT INTO users (name, email, password_hash, verify_token, email_verified, plan_code, role, status)
                   VALUES (?,?,?,?,0,\'free\',\'user\',\'active\')')
        ->execute([$name, $email, password_hash($password, PASSWORD_DEFAULT), $verify]);
    $uid = (int) db()->lastInsertId();
    $origin = safe_redirect_origin($_SERVER['HTTP_ORIGIN'] ?? '');
    out([
        'message'    => 'Registration successful. Please check your email to verify your account.',
        'verify_url' => $origin . '/auth/verify?userId=' . $uid . '&secret=' . $verify,
    ], 201);
}

// GET /api/me — rich session payload (live-site shape).
if ($path === '/api/me' && $method === 'GET') {
    $uid = current_user_id();
    if (!$uid) fail('Not authorized', 401);
    out(me_array($uid));
}

// GET /logout — live-site logout alias.
if ($path === '/logout' && $method === 'GET') {
    $token = $_COOKIE[SESSION_COOKIE] ?? '';
    if ($token !== '') db()->prepare('DELETE FROM sessions WHERE token = ?')->execute([$token]);
    setcookie(SESSION_COOKIE, '', ['expires' => time() - 3600, 'path' => '/']);
    out(['ok' => true]);
}

// GET /api/account/has-password
if ($path === '/api/account/has-password' && $method === 'GET') {
    $uid = require_auth();
    $st = db()->prepare('SELECT password_hash FROM users WHERE id = ?');
    $st->execute([$uid]);
    $row = $st->fetch();
    out(['hasPassword' => !empty($row['password_hash'])]);
}

// POST /api/account/delete — self-service deletion with confirmation.
if ($path === '/api/account/delete' && $method === 'POST') {
    $uid = require_auth();
    $in = json_in();
    $st = db()->prepare('SELECT password_hash FROM users WHERE id = ?');
    $st->execute([$uid]);
    $row = $st->fetch();
    $hash = $row ? (string) $row['password_hash'] : '';
    if ($hash !== '') {
        $password = (string) ($in['password'] ?? '');
        if ($password === '' || !password_verify($password, $hash)) fail('Incorrect password.', 403);
    } elseif (strtoupper(trim((string) ($in['confirm'] ?? ''))) !== 'DELETE') {
        fail('Type DELETE to confirm account deletion.', 400);
    }
    db()->prepare("UPDATE users SET status = 'deleted', verify_token = NULL, reset_token = NULL WHERE id = ?")->execute([$uid]);
    db()->prepare('DELETE FROM sessions WHERE user_id = ?')->execute([$uid]);
    setcookie(SESSION_COOKIE, '', ['expires' => time() - 3600, 'path' => '/']);
    out(['ok' => true]);
}

// POST /api/account/set-password
if ($path === '/api/account/set-password' && $method === 'POST') {
    $uid = require_auth();
    $in = json_in();
    $password = (string) ($in['password'] ?? '');
    if (strlen($password) < 8) fail('Password must be at least 8 characters long.');
    db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
        ->execute([password_hash($password, PASSWORD_DEFAULT), $uid]);
    out(['ok' => true, 'message' => 'Password set successfully!']);
}

// POST /api/account/resend-verification — issue a fresh verification link.
if ($path === '/api/account/resend-verification' && $method === 'POST') {
    $uid = require_auth();
    $verify = bin2hex(random_bytes(16));
    db()->prepare('UPDATE users SET verify_token = ? WHERE id = ?')->execute([$verify, $uid]);
    $origin = safe_redirect_origin($_SERVER['HTTP_ORIGIN'] ?? '');
    out([
        'message'    => 'Verification email sent! Check your inbox.',
        'verify_url' => $origin . '/auth/verify?userId=' . $uid . '&secret=' . $verify,
    ]);
}

// POST /api/account/change-unverified-email
if ($path === '/api/account/change-unverified-email' && $method === 'POST') {
    $uid = require_auth();
    $in = json_in();
    $email = strtolower(trim((string) ($in['email'] ?? '')));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Please enter a valid email address.');
    $st = db()->prepare('SELECT email_verified FROM users WHERE id = ?');
    $st->execute([$uid]);
    $u = $st->fetch();
    if ($u && (int) $u['email_verified'] === 1) fail('Your email is already verified.');
    $exists = db()->prepare('SELECT id FROM users WHERE email = ? AND id <> ?');
    $exists->execute([$email, $uid]);
    if ($exists->fetch()) fail('An account with this email already exists.');
    $verify = bin2hex(random_bytes(16));
    db()->prepare('UPDATE users SET email = ?, verify_token = ? WHERE id = ?')->execute([$email, $verify, $uid]);
    out(['ok' => true, 'message' => 'Email changed! Please verify your new email.']);
}

// POST /api/account/verify-email-change
if ($path === '/api/account/verify-email-change' && $method === 'POST') {
    $in = json_in();
    $token = (string) ($in['token'] ?? '');
    $st = db()->prepare('SELECT id FROM users WHERE verify_token = ? LIMIT 1');
    $st->execute([$token]);
    $u = $st->fetch();
    if (!$u) fail('Invalid verification link.', 400);
    db()->prepare('UPDATE users SET email_verified = 1, verify_token = NULL WHERE id = ?')->execute([$u['id']]);
    out(['ok' => true, 'message' => 'Email changed successfully. Please log in with your new email.']);
}

// POST /api/auth/verify-callback — verification link logs the user in.
if ($path === '/api/auth/verify-callback' && $method === 'POST') {
    $in = json_in();
    $userId = (int) ($in['userId'] ?? 0);
    $secret = (string) ($in['secret'] ?? '');
    if ($userId === 0 || $secret === '') fail('Invalid verification link.', 400);
    $st = db()->prepare('SELECT id FROM users WHERE id = ? AND verify_token = ? LIMIT 1');
    $st->execute([$userId, $secret]);
    if (!$st->fetch()) fail('Invalid or expired verification link.', 400);
    db()->prepare('UPDATE users SET email_verified = 1, verify_token = NULL WHERE id = ?')->execute([$userId]);
    out(['ok' => true, 'token' => create_session($userId)]);
}

// POST /api/auth/recovery — password reset from the email link.
if ($path === '/api/auth/recovery' && $method === 'POST') {
    $in = json_in();
    $userId = (int) ($in['userId'] ?? 0);
    $secret = (string) ($in['secret'] ?? '');
    $password = (string) ($in['newPassword'] ?? '');
    $confirm = (string) ($in['confirmPassword'] ?? '');
    if (strlen($password) < 8) fail('Password must be at least 8 characters long.');
    if ($password !== $confirm) fail('Passwords do not match.');
    $st = db()->prepare('SELECT id FROM users WHERE id = ? AND reset_token = ? LIMIT 1');
    $st->execute([$userId, $secret]);
    if (!$st->fetch()) fail('Invalid or expired recovery link.', 400);
    db()->prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?')
        ->execute([password_hash($password, PASSWORD_DEFAULT), $userId]);
    out(['ok' => true]);
}

// POST /api/forgot-password — live-site alias with a password reset link.
if ($path === '/api/forgot-password' && $method === 'POST') {
    $email = strtolower(param('email'));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Please enter a valid email address.');
    $token = bin2hex(random_bytes(16));
    $st = db()->prepare('SELECT id FROM users WHERE email = ?');
    $st->execute([$email]);
    $u = $st->fetch();
    if ($u) {
        db()->prepare('UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?')
            ->execute([$token, date('Y-m-d H:i:s', time() + 3600), $u['id']]);
    }
    $origin = safe_redirect_origin($_SERVER['HTTP_ORIGIN'] ?? '');
    out([
        'message'   => 'Password reset link sent! Check your email.',
        'reset_url' => $origin . '/auth/recovery?userId=' . ($u['id'] ?? 0) . '&secret=' . $token,
    ]);
}

/* ---- Google OAuth 2.0 ------------------------------------------------- */

// GET /auth/google?target=frontend&redirect_origin=...
if ($path === '/auth/google' && $method === 'GET') {
    $origin = safe_redirect_origin(param('redirect_origin'));
    $cfg = oauth_config();
    $clientId = (string) ($cfg['google_client_id'] ?? '');

    // No fallback accounts: real Google credentials are required.
    if ($clientId === '') fail('Google sign-in is not configured on this server.', 501);

    // Carry the random CSRF token AND the frontend origin inside `state` so the
    // flow works even when localhost / 127.0.0.1 cookies do not match.
    $state = bin2hex(random_bytes(16)) . '.' . rtrim(strtr(base64_encode($origin), '+/', '-_'), '=');

    $url = 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query([
        'client_id'             => $clientId,
        'redirect_uri'          => (string) ($cfg['google_redirect_uri'] ?? 'http://localhost:8000/auth/callback'),
        'response_type'         => 'code',
        'scope'                 => 'openid email profile',
        'state'                 => $state,
        'access_type'           => 'online',
        'prompt'                => 'select_account',
        'include_granted_scopes'=> 'true',
    ]);
    out(['url' => $url]);
}

// GET /auth/callback — exchange Google's code, log the user in, redirect.
if ($path === '/auth/callback' && $method === 'GET') {
    $cfg = oauth_config();
    $clientId = (string) ($cfg['google_client_id'] ?? '');

    if ($clientId === '') fail('Google sign-in is not configured on this server.', 501);

    $state    = (string) param('state');
    $errParam = (string) param('error');
    $parts    = explode('.', $state, 2);
    $origin   = count($parts) === 2
        ? safe_redirect_origin(base64_decode(strtr($parts[1], '-_', '+/'), true) ?: '')
        : safe_redirect_origin((string) ($_COOKIE['google_oauth_origin'] ?? ''));

    if ($errParam !== '') fail('Google sign-in was cancelled or failed: ' . $errParam, 400);
    // The random half of `state` is unguessable and echoed back by Google, so it
    // works as a CSRF token without depending on cookies across localhost/127.0.0.1.
    if (count($parts) !== 2 || !preg_match('/^[0-9a-f]{32}$/', $parts[0])) {
        fail('Invalid OAuth state. Please try again.', 400);
    }
    $code = (string) param('code');
    if ($code === '') fail('Google did not return an authorization code.', 400);

    $redirectUri = (string) ($cfg['google_redirect_uri'] ?? 'http://localhost:8000/auth/callback');
    [$ts, $tb, $te] = http_request('https://oauth2.googleapis.com/token', ['post' => [
        'code'          => $code,
        'client_id'     => $clientId,
        'client_secret' => (string) ($cfg['google_client_secret'] ?? ''),
        'redirect_uri'  => $redirectUri,
        'grant_type'    => 'authorization_code',
    ]]);
    $tokens = json_decode($tb, true);
    if ($ts !== 200 || empty($tokens['access_token'])) {
        fail('Google token exchange failed: ' . ($tokens['error_description'] ?? ($te ?: ('HTTP ' . $ts))), 502);
    }

    [$us, $ub, $ue] = http_request('https://www.googleapis.com/oauth2/v2/userinfo', ['headers' => [
        'Authorization: Bearer ' . $tokens['access_token'],
    ]]);
    $info = json_decode($ub, true);
    if ($us !== 200 || empty($info['email'])) {
        fail('Could not read your Google profile: ' . ($ue ?: ('HTTP ' . $us)), 502);
    }

    $email = strtolower(trim((string) $info['email']));
    $name  = trim((string) ($info['name'] ?? ($info['given_name'] ?? 'Google User')));
    $verified = empty($info['verified_email']) ? 0 : 1;
    $avatar = trim((string) ($info['picture'] ?? ''));

    $st = db()->prepare('SELECT id, status FROM users WHERE email = ? LIMIT 1');
    $st->execute([$email]);
    $u = $st->fetch();
    if ($u) {
        if ($u['status'] === 'blocked' || $u['status'] === 'deleted') fail('Your account is not allowed to sign in.', 403);
        $uid = (int) $u['id'];
    } else {
        db()->prepare("INSERT INTO users (name, email, password_hash, email_verified, plan_code, role, status, avatar_url)
                       VALUES (?, ?, NULL, ?, 'free', 'user', 'active', ?)")
            ->execute([$name, $email, $verified, $avatar !== '' ? $avatar : null]);
        $uid = (int) db()->lastInsertId();
    }
    if ($u && $avatar !== '') {
        // Keep an existing account's avatar up to date with their Google photo.
        db()->prepare('UPDATE users SET avatar_url = ? WHERE id = ? AND (avatar_url IS NULL OR avatar_url = \'\')')
            ->execute([$avatar, $uid]);
    }

    // Hand a one-time token to the frontend; it is exchanged on the FRONTEND
    // origin so the session cookie is stored on the exact host the user is on.
    $loginToken = bin2hex(random_bytes(24));
    db()->prepare('UPDATE users SET verify_token = ? WHERE id = ?')->execute([$loginToken, $uid]);
    header('Location: ' . $origin . '/google-callback?login_token=' . $loginToken, true, 302);
    exit;
}

// POST /api/auth/google/exchange — frontend-origin exchange for the login token.
if ($path === '/api/auth/google/exchange' && $method === 'POST') {
    $in = json_in();
    $token = (string) ($in['token'] ?? '');
    if ($token === '') fail('Missing login token.', 400);
    $st = db()->prepare('SELECT id FROM users WHERE verify_token = ? LIMIT 1');
    $st->execute([$token]);
    $u = $st->fetch();
    if (!$u) fail('Invalid or expired login token.', 400);
    db()->prepare('UPDATE users SET verify_token = NULL WHERE id = ?')->execute([$u['id']]);
    create_session((int) $u['id']);
    out(['ok' => true]);
}

/* ---- Instagram / Meta OAuth (real Facebook Login) --------------------- */

// GET /auth/instagram?redirect_origin=... — same shape as /auth/google.
if ($path === '/auth/instagram' && $method === 'GET') {
    $origin = safe_redirect_origin(param('redirect_origin'));
    out(instagram_connect_url($origin));
}

// GET /auth/ig-callback — exchange Meta's code for a token, read the Instagram
// professional accounts linked to the user's Facebook pages, then hand a
// one-time token to the frontend so linking happens on the frontend session
// (the same pattern Google uses with /api/auth/google/exchange).
if ($path === '/auth/ig-callback' && $method === 'GET') {
    $cfg = instagram_oauth_config();
    $state = (string) param('state');
    $parts = explode('.', $state, 2);
    $origin = count($parts) === 2
        ? safe_redirect_origin(base64_decode(strtr($parts[1], '-_', '+/'), true) ?: '')
        : safe_redirect_origin(param('redirect_origin'));
    $igError = static function (string $message) use ($origin): void {
        header('Location: ' . $origin . '/instagram-callback?error=' . rawurlencode($message), true, 302);
        exit;
    };

    $errParam = (string) param('error');
    if ($errParam !== '') {
        $igError('Instagram connection was cancelled or failed: ' . $errParam);
    }
    if (count($parts) !== 2 || !preg_match('/^[0-9a-f]{32}$/', $parts[0])) {
        $igError('Invalid Instagram OAuth state. Please try again.');
    }
    $code = (string) param('code');
    if ($code === '') $igError('Meta did not return an authorization code.');
    if ($cfg['app_id'] === '' || $cfg['app_secret'] === '') fail('Instagram connection is not configured on this server.', 501);

    // Instagram Login: exchange the code for a short-lived token.
    [$ts, $tb] = http_request('https://api.instagram.com/oauth/access_token', ['post' => [
        'client_id'     => $cfg['app_id'],
        'client_secret' => $cfg['app_secret'],
        'grant_type'    => 'authorization_code',
        'redirect_uri'  => $cfg['redirect_uri'],
        'code'          => $code,
    ]]);
    $tok = json_decode($tb, true);
    $shortToken = is_array($tok) ? (string) ($tok['access_token'] ?? '') : '';
    if ($ts !== 200 || $shortToken === '') {
        $msg = is_array($tok)
            ? (string) ($tok['error_message'] ?? ($tok['error']['message'] ?? 'unknown error'))
            : ('HTTP ' . $ts);
        $igError('Instagram token exchange failed: ' . $msg);
    }

    // Exchange it for a long-lived (≈60 day) token.
    $accessToken = $shortToken;
    [$ls, $lb] = http_request('https://graph.instagram.com/access_token?' . http_build_query([
        'grant_type'    => 'ig_exchange_token',
        'client_secret' => $cfg['app_secret'],
        'access_token'  => $shortToken,
    ]));
    $long = json_decode($lb, true);
    if ($ls === 200 && is_array($long) && !empty($long['access_token'])) {
        $accessToken = (string) $long['access_token'];
    }

    // Read the connected Instagram professional account.
    [$us, $info] = graph_get('https://graph.instagram.com/me?' . http_build_query([
        'fields'       => 'id,username,account_type',
        'access_token' => $accessToken,
    ]));
    if ($us !== 200 || empty($info['id'])) {
        $igError('Could not read your Instagram account. Make sure it has the Instagram Tester role in your Meta app.');
    }
    $accounts = [[
        'ig_user_id'   => (string) $info['id'],
        'username'     => (string) ($info['username'] ?? ''),
        'account_type' => strtoupper((string) ($info['account_type'] ?? 'BUSINESS')),
        'access_token' => $accessToken,
    ]];

    $linkToken = bin2hex(random_bytes(24));
    set_setting('iglink_' . $linkToken, json_encode([
        'accounts'   => $accounts,
        'expires_at' => time() + 600,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    header('Location: ' . $origin . '/instagram-callback?link_token=' . $linkToken, true, 302);
    exit;
}

/* ------------------------------------------------- webhook & delivery --- */

// Meta verifies the webhook with a GET challenge.
if ($path === '/webhooks/instagram' && $method === 'GET') {
    $mode      = (string) ($_GET['hub.mode'] ?? $_GET['hub_mode'] ?? '');
    $verify    = (string) ($_GET['hub.verify_token'] ?? $_GET['hub_verify_token'] ?? '');
    $challenge = (string) ($_GET['hub.challenge'] ?? $_GET['hub_challenge'] ?? '');
    $expected  = get_setting('ig_webhook_verify_token', '');
    if ($mode === 'subscribe' && $expected !== '' && hash_equals($expected, $verify)) {
        header('Content-Type: text/plain; charset=utf-8');
        echo $challenge;
        exit;
    }
    fail('Webhook verification failed.', 403);
}

// Real incoming events: match a saved automation and send the reply via Graph.
if ($path === '/webhooks/instagram' && $method === 'POST') {
    $raw = file_get_contents('php://input') ?: '';
    $payload = json_decode($raw, true);
    if (is_array($payload)) {
        try {
            ig_handle_webhook_payload($payload);
        } catch (Throwable $e) {
            error_log('Webhook processing failed: ' . $e->getMessage());
        }
    }
    out(['ok' => true]);
}

// Webhook callback + verify token for the Meta app settings screen.
if ($path === '/api/instagram/webhook-config' && $method === 'GET') {
    require_auth();
    $verify = get_setting('ig_webhook_verify_token', '');
    if ($verify === '') {
        $verify = bin2hex(random_bytes(16));
        set_setting('ig_webhook_verify_token', $verify);
    }
    $callback = get_setting('ig_webhook_callback', '');
    if ($callback === '') {
        $callback = rtrim(str_replace('/auth/ig-callback', '', (string) (instagram_oauth_config()['redirect_uri'] ?? '')), '/') . '/webhooks/instagram';
    }
    out(['callback_url' => $callback, 'verify_token' => $verify]);
}

// Subscribe a connected account to Instagram webhook events.
if ($path === '/api/instagram/subscribe' && $method === 'POST') {
    $uid = require_auth();
    $in = json_in();
    $accountId = (int) ($in['account_id'] ?? 0);
    $st = db()->prepare('SELECT ig_user_id, access_token FROM instagram_accounts WHERE id = ? AND user_id = ?');
    $st->execute([$accountId, $uid]);
    $account = $st->fetch();
    if (!$account) fail('Instagram account not found.', 404);

    $callback = get_setting('ig_webhook_callback', '');
    if ($callback === '') {
        $callback = rtrim(str_replace('/auth/ig-callback', '', (string) (instagram_oauth_config()['redirect_uri'] ?? '')), '/') . '/webhooks/instagram';
    }
    $verify = get_setting('ig_webhook_verify_token', '');
    if ($verify === '') {
        $verify = bin2hex(random_bytes(16));
        set_setting('ig_webhook_verify_token', $verify);
    }
    [$status, $res] = ig_graph_post($account['ig_user_id'] . '/subscriptions', [
        'object'       => 'instagram',
        'fields'       => 'comments,mentions,messages',
        'callback_url' => $callback,
        'verify_token' => $verify,
    ], (string) ($account['access_token'] ?? ''));
    if ($status < 200 || $status >= 300) {
        fail('Webhook subscription failed: ' . json_encode($res, JSON_UNESCAPED_UNICODE), 502);
    }
    out(['ok' => true, 'callback_url' => $callback, 'response' => $res]);
}

// Recent commenters on your posts/reels — real Instagram user IDs usable for
// test DMs (there is no public username -> ID lookup on Instagram).
if ($path === '/api/instagram/contacts' && $method === 'GET') {
    $uid = require_auth();
    $st = db()->prepare("SELECT ig_user_id, access_token FROM instagram_accounts WHERE user_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1");
    $st->execute([$uid]);
    $account = $st->fetch();
    if (!$account || empty($account['access_token'])) fail('No connected Instagram account.', 400);

    $igId  = (string) $account['ig_user_id'];
    $token = (string) $account['access_token'];
    $errors = [];
    [$ms, $media] = ig_graph_get($igId . '/media', ['fields' => 'id,caption', 'limit' => 5], $token);
    if ($ms < 200 || $ms >= 300) {
        $errors[] = 'Media: HTTP ' . $ms . ' ' . json_encode($media, JSON_UNESCAPED_UNICODE);
    }
    $contacts = [];
    foreach (($media['data'] ?? []) as $m) {
        [$cs, $comments] = ig_graph_get((string) $m['id'] . '/comments', [
            'fields' => 'from{id,username},text',
            'limit'  => 25,
        ], $token);
        if ($cs !== 200) {
            $errors[] = 'Comments: HTTP ' . $cs . ' ' . json_encode($comments, JSON_UNESCAPED_UNICODE);
            continue;
        }
        if (empty($comments['data'])) continue;
        foreach ($comments['data'] as $c) {
            $from = is_array($c['from'] ?? null) ? $c['from'] : [];
            $id = (string) ($from['id'] ?? '');
            if ($id === '' || isset($contacts[$id])) continue;
            $contacts[$id] = [
                'id'       => $id,
                'username' => (string) ($from['username'] ?? ''),
                'comment'  => mb_substr((string) ($c['text'] ?? ''), 0, 120),
            ];
        }
    }
    // Also include people who have DMed the account (works with no posts).
    [$ds, $convos] = ig_graph_get($igId . '/conversations', [
        'fields' => 'participants,updated_time',
        'limit'  => 20,
    ], $token);
    if ($ds < 200 || $ds >= 300) {
        $errors[] = 'Conversations: HTTP ' . $ds . ' ' . json_encode($convos, JSON_UNESCAPED_UNICODE);
    }
    if ($ds === 200 && is_array($convos['data'] ?? null)) {
        foreach ($convos['data'] as $conv) {
            $participants = is_array($conv['participants']['data'] ?? null) ? $conv['participants']['data'] : [];
            foreach ($participants as $p) {
                $pid = (string) ($p['ig']['id'] ?? $p['id'] ?? '');
                if ($pid === '' || $pid === $igId || isset($contacts[$pid])) continue;
                $contacts[$pid] = [
                    'id'       => $pid,
                    'username' => (string) ($p['ig']['username'] ?? $p['username'] ?? ''),
                    'comment'  => 'Sent you a DM',
                ];
            }
        }
    }

    out(['contacts' => array_values($contacts), 'errors' => $errors]);
}

// Poll recent comments and run matching automations automatically.
if ($path === '/api/automations/poll' && $method === 'POST') {
    $uid = require_auth();
    $st = db()->prepare("SELECT ig_user_id, access_token FROM instagram_accounts WHERE user_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1");
    $st->execute([$uid]);
    $account = $st->fetch();
    if (!$account || empty($account['access_token'])) fail('No connected Instagram account.', 400);
    $igId  = (string) $account['ig_user_id'];
    $token = (string) $account['access_token'];

    [$ms, $media] = ig_graph_get($igId . '/media', ['fields' => 'id,caption', 'limit' => 5], $token);
    $checked = 0; $matched = 0; $replied = 0; $sent = 0; $failed = 0;
    foreach (($media['data'] ?? []) as $m) {
        [$cs, $comments] = ig_graph_get((string) $m['id'] . '/comments', [
            'fields' => 'id,text,from{id,username}',
            'limit'  => 25,
        ], $token);
        foreach (($comments['data'] ?? []) as $c) {
            $checked++;
            $commentId = (string) ($c['id'] ?? '');
            $text = (string) ($c['text'] ?? '');
            $sender = (string) ($c['from']['id'] ?? '');
            if ($commentId === '' || $sender === '') continue;

            $done = db()->prepare('SELECT 1 FROM automation_processed WHERE comment_id = ? AND user_id = ?');
            $done->execute([$commentId, $uid]);
            if ($done->fetch()) continue; // already handled

            $auto = ig_match_automation($uid, ['post', 'reel', 'global', 'mention', 'story'], $text);
            if (!$auto) {
                // A rule with an empty keyword replies to every comment.
                $st2 = db()->prepare("SELECT * FROM automations WHERE user_id = ? AND status = 'active' AND (keyword IS NULL OR keyword = '') AND type IN ('post','reel','global','mention','story') ORDER BY id DESC LIMIT 1");
                $st2->execute([$uid]);
                $auto = $st2->fetch() ?: null;
            }
            if (!$auto) continue;
            $matched++;

            if (!empty($auto['public_reply'])) {
                [$rs, $res] = ig_graph_post((string) $m['id'] . '/replies', ['message' => (string) $auto['public_reply']], $token);
                if ($rs >= 200 && $rs < 300) $replied++;
                ig_log_event(
                    $uid, (int) $auto['id'], 'comment_reply', $commentId,
                    ($rs >= 200 && $rs < 300) ? 'sent' : 'failed',
                    'HTTP ' . $rs . ': ' . json_encode($res, JSON_UNESCAPED_UNICODE)
                );
            }
            [$ok] = ig_deliver($auto, $uid, $sender, $igId, $token);
            if ($ok) $sent++; else $failed++;

            db()->prepare('INSERT IGNORE INTO automation_processed (comment_id, user_id, automation_id) VALUES (?,?,?)')
                ->execute([$commentId, $uid, (int) $auto['id']]);
        }
    }
    out(['ok' => true, 'checked' => $checked, 'matched' => $matched, 'public_replies' => $replied, 'dms_sent' => $sent, 'dms_failed' => $failed]);
}

// Send a real test DM using a saved automation (uses the live Graph API).
if ($path === '/api/automations/test-send' && $method === 'POST') {
    $uid = require_auth();
    $in = json_in();
    $automationId = (int) ($in['id'] ?? 0);
    $recipient = trim((string) ($in['recipient_id'] ?? ''));
    if ($recipient === '') fail('Enter the recipient Instagram user ID.', 400);

    $st = db()->prepare('SELECT * FROM automations WHERE id = ? AND user_id = ?');
    $st->execute([$automationId, $uid]);
    $auto = $st->fetch();
    if (!$auto) fail('Automation not found.', 404);

    $st = db()->prepare("SELECT ig_user_id, access_token FROM instagram_accounts WHERE user_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1");
    $st->execute([$uid]);
    $account = $st->fetch();
    if (!$account || empty($account['access_token'])) fail('No connected Instagram account.', 400);

    [$ok, $detail] = ig_deliver($auto, $uid, $recipient, (string) $account['ig_user_id'], (string) $account['access_token']);
    if (!$ok) fail($detail, 502);
    out(['ok' => true, 'message' => $detail]);
}

// Delivery history so you can see every fired automation.
if ($path === '/api/automations/events' && $method === 'GET') {
    $uid = require_auth();
    $st = db()->prepare('SELECT * FROM automation_events WHERE user_id = ? ORDER BY id DESC LIMIT 100');
    $st->execute([$uid]);
    out(['events' => $st->fetchAll()]);
}

/* ------------------------------------------------------------- 404 ----- */

out(['error' => 'Endpoint not found: ' . $path], 404);
