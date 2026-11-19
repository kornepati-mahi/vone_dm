<?php
/** Seeds site_content from content.json (idempotent). */
declare(strict_types=1);

$pdo = new PDO(
    'mysql:host=127.0.0.1;port=3306;dbname=dmpanda;charset=utf8mb4',
    'root', '',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

$json = file_get_contents(__DIR__ . '/content.json');
$json = preg_replace('/^\xEF\xBB\xBF/', '', $json);
$content = json_decode($json, true);
if (!is_array($content)) { fwrite(STDERR, "bad content.json: " . json_last_error_msg() . "\n"); exit(1); }

$st = $pdo->prepare(
    'INSERT INTO site_content (content_key, content_value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE content_value = VALUES(content_value)'
);
foreach ($content as $key => $value) {
    $st->execute([$key, json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]);
    echo "seeded: {$key}\n";
}
echo "DONE\n";
