<?php
/** One-off seeder: plans (from plans.json), blog posts, optional admin. */
declare(strict_types=1);

const DB_HOST = '127.0.0.1';
const DB_PORT = '3306';
const DB_NAME = 'dmpanda';
const DB_USER = 'root';
const DB_PASS = '';

$pdo = new PDO(
    sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', DB_HOST, DB_PORT, DB_NAME),
    DB_USER, DB_PASS,
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
);

/* ---- plans ---- */
$json = file_get_contents(__DIR__ . '/plans.json');
$json = preg_replace('/^\xEF\xBB\xBF/', '', $json);
$plans = json_decode($json, true);
if (!is_array($plans)) { fwrite(STDERR, "bad plans.json\n"); exit(1); }

$pdo->exec('DELETE FROM plans');
$ins = $pdo->prepare(
    'INSERT INTO plans (plan_code, name, display_order, button_text, is_popular, is_custom,
        price_monthly_inr, price_yearly_inr, price_yearly_monthly_inr, duration_days_monthly,
        duration_days_yearly, yearly_bonus, actions_per_hour_limit, actions_per_day_limit,
        actions_per_month_limit, feature_items, comparison)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
);
foreach ($plans as $p) {
    $ins->execute([
        $p['plan_code'], $p['name'], (int) $p['display_order'], $p['button_text'],
        (int) $p['is_popular'], (int) $p['is_custom'],
        (int) $p['price_monthly_inr'], (int) $p['price_yearly_inr'], (int) $p['price_yearly_monthly_inr'],
        (int) $p['duration_days_monthly'], (int) $p['duration_days_yearly'], $p['yearly_bonus'],
        (string) $p['actions_per_hour_limit'], (string) $p['actions_per_day_limit'],
        (string) $p['actions_per_month_limit'],
        is_string($p['feature_items']) ? $p['feature_items'] : json_encode($p['feature_items'] ?? []),
        is_string($p['comparison']) ? $p['comparison'] : json_encode($p['comparison'] ?? []),
    ]);
}
echo 'plans: ' . count($plans) . "\n";

/* ---- real admin account (only when credentials are supplied) ---------- */
// Set ADMIN_EMAIL / ADMIN_PASSWORD (and optionally ADMIN_NAME) in the
// environment before running the seeder. No sample accounts are created.
$adminEmail = strtolower(trim((string) (getenv('ADMIN_EMAIL') ?: '')));
$adminPass  = (string) (getenv('ADMIN_PASSWORD') ?: '');
if ($adminEmail !== '' && $adminPass !== '') {
    if (!filter_var($adminEmail, FILTER_VALIDATE_EMAIL) || strlen($adminPass) < 8) {
        fwrite(STDERR, "ADMIN_EMAIL must be valid and ADMIN_PASSWORD at least 8 characters\n");
        exit(1);
    }
    $st = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $st->execute([$adminEmail]);
    if ($st->fetch()) {
        echo "admin already exists: {$adminEmail}\n";
    } else {
        $ins = $pdo->prepare(
            'INSERT INTO users (name, email, password_hash, email_verified, plan_code, role, status)
             VALUES (?,?,?,1,\'free\',\'admin\',\'active\')'
        );
        $ins->execute([
            (string) (getenv('ADMIN_NAME') ?: 'Admin'),
            $adminEmail,
            password_hash($adminPass, PASSWORD_DEFAULT),
        ]);
        echo "admin created: {$adminEmail}\n";
    }
} else {
    echo "admin skipped (set ADMIN_EMAIL + ADMIN_PASSWORD to create one)\n";
}

/* ---- blog posts ---- */
$pdo->exec('DELETE FROM blog_posts');
$ins = $pdo->prepare(
    'INSERT INTO blog_posts (slug, title, excerpt, content, category, cover_image, featured, status, published_at)
     VALUES (?,?,?,?,?,?,?,\'published\',?)'
);
$posts = [
    [
        'instagram-comment-to-dm-automation-guide',
        'Instagram Comment to DM Automation: The Complete 2026 Guide',
        'Learn how comment-to-DM automation works, why it boosts conversions, and how to set one up in under 5 minutes.',
        "<p>Comment-to-DM automation is the fastest way to turn passive engagement into a real conversation. When someone comments a keyword on your post or reel, the automation instantly sends them a private message with the link, price list, or guide they asked for.</p><h2>Why it works</h2><ul><li>Speed: replies land in seconds while intent is hot</li><li>Privacy: sensitive info (pricing, links) stays in DMs</li><li>Reach: every comment boosts your post in the algorithm</li></ul><h2>How to set it up</h2><ol><li>Connect your Instagram business account</li><li>Create a new Comment → DM automation</li><li>Set the trigger keyword (e.g. <strong>price</strong>)</li><li>Write your reply and attach media if needed</li><li>Publish — done in under 5 minutes</li></ol>",
        'Instagram Automation', '/images/post_comment_dm_reply.png', 1, '2026-09-14 10:00:00',
    ],
    [
        'dm-automation-best-practices',
        '7 DM Automation Best Practices That Actually Convert',
        'Avoid the spam folder. These seven practices keep your automated DMs human, helpful, and high-converting.',
        "<p>Automation only works when it feels personal. Here are seven practices we recommend to every creator and brand.</p><ol><li><strong>Always reference the comment.</strong> Echoing the keyword makes the DM feel triggered, not broadcast.</li><li><strong>Keep it under 3 lines.</strong> Short messages get read.</li><li><strong>Include one clear CTA.</strong> One link, one ask.</li><li><strong>Respect frequency caps.</strong> Once per user per 24h is a good default.</li><li><strong>Use buttons for common replies.</strong> Taps beat typing.</li><li><strong>Track reply rates.</strong> If nobody replies, rewrite the opener.</li><li><strong>Have a human fallback.</strong> Route complex questions to your inbox.</li></ol>",
        'Instagram Automation', '/images/quick_replies_template.png', 0, '2026-10-02 10:00:00',
    ],
    [
        'super-profile-link-in-bio',
        'Super Profile: Turn Your Link in Bio Into a Conversion Machine',
        'A link-in-bio that loads fast, looks on-brand, and captures leads — without another monthly tool.',
        "<p>Your bio link is prime real estate. Super Profile gives you a lightweight landing page with all your links, a lead capture form, and analytics — included in every plan.</p><h2>What you get</h2><ul><li>Unlimited links with drag-and-drop ordering</li><li>Email / WhatsApp capture forms</li><li>Theme matched to your Instagram palette</li><li>Click analytics per link</li></ul>",
        'Product', '/images/super_profile.png', 0, '2026-10-20 10:00:00',
    ],
    [
        'instagram-live-automation-101',
        'Instagram Live Automation 101: Greet, Route, and Convert Viewers',
        'Set up welcome messages and keyword triggers that fire the moment you go live.',
        "<p>Going live is the highest-trust format on Instagram. Automation helps you catch every viewer while they are engaged.</p><h2>Live playbook</h2><ol><li>Welcome message for first-time viewers</li><li>Keyword triggers pinned in your comments (e.g. <strong>JOIN</strong>)</li><li>Auto-DM the replay link after the stream ends</li></ol>",
        'Instagram Automation', '/images/live_automation.png', 0, '2026-11-01 10:00:00',
    ],
    [
        'comment-moderation-protect-your-page',
        'Comment Moderation: Keep Your Page Clean on Autopilot',
        'Hide spam, mask bad words, and auto-reply to common questions before they become a problem.',
        "<p>Moderation is not censorship — it is protecting the experience for the 99% of followers who behave.</p><h2>Three layers</h2><ul><li><strong>Word filter:</strong> auto-hide comments containing blocked words</li><li><strong>Auto-reply:</strong> answer FAQs publicly so everyone sees it</li><li><strong>Escalation:</strong> flag toxic comments to your inbox for review</li></ul>",
        'Community', '/images/comment_moderation.png', 0, '2026-11-08 10:00:00',
    ],
];
foreach ($posts as $p) {
    $ins->execute($p);
}
echo 'blog posts: ' . count($posts) . "\n";

echo "DONE\n";
