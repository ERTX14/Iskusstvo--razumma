<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config.php';

function reply(bool $success, string $message, int $status = 200): never
{
    http_response_code($status);
    echo json_encode(['success' => $success, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    reply(false, 'Метод запроса не поддерживается.', 405);
}

$parentName = trim((string)($_POST['parent_name'] ?? ''));
$phone = trim((string)($_POST['phone'] ?? ''));
$childName = trim((string)($_POST['child_name'] ?? ''));
$birthDate = trim((string)($_POST['child_birth_date'] ?? ''));
$course = trim((string)($_POST['course'] ?? ''));
$additionalInfo = trim((string)($_POST['additional_info'] ?? ''));
$consent = isset($_POST['personal_data_consent']) && $_POST['personal_data_consent'] === '1';

$courses = [
    'diagnostic' => 'Онлайн-диагностика',
    'individual' => 'Индивидуальный разбор возможностей ребёнка',
    'school-ready' => 'Социально-эмоциональная готовность к школе (6–8 лет)',
    'neuro' => 'НейроСказки — поддержка ребёнка перед школой и в начале обучения',
    'intelligence' => 'Эмоциональный и стратегический интеллект (8–16 лет)',
    'rhetoric' => 'Риторика и Деньги (10–17 лет)',
];

if ($parentName === '' || $childName === '' || $phone === '' || $birthDate === '' || $course === '') {
    reply(false, 'Заполните все обязательные поля.', 422);
}

if (!$consent) {
    reply(false, 'Необходимо согласие на обработку персональных данных.', 422);
}

if (!isset($courses[$course])) {
    reply(false, 'Выбрана неизвестная программа.', 422);
}

$phoneDigits = preg_replace('/\D+/', '', $phone);
if (strlen($phoneDigits) !== 11 || !str_starts_with($phoneDigits, '7')) {
    reply(false, 'Введите корректный номер телефона в формате +7 (XXX) XXX-XX-XX.', 422);
}

$date = DateTime::createFromFormat('Y-m-d', $birthDate);
if (!$date || $date->format('Y-m-d') !== $birthDate) {
    reply(false, 'Некорректная дата рождения.', 422);
}

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );

    $stmt = $pdo->prepare(
        'INSERT INTO applications
        (parent_name, phone, child_name, child_birth_date, course_key, course_name, additional_info, personal_data_consent)
        VALUES (:parent_name, :phone, :child_name, :child_birth_date, :course_key, :course_name, :additional_info, :consent)'
    );

    $stmt->execute([
        ':parent_name' => $parentName,
        ':phone' => '+7' . substr($phoneDigits, 1),
        ':child_name' => $childName,
        ':child_birth_date' => $birthDate,
        ':course_key' => $course,
        ':course_name' => $courses[$course],
        ':additional_info' => $additionalInfo !== '' ? $additionalInfo : null,
        ':consent' => 1,
    ]);

    $applicationId = (int)$pdo->lastInsertId();

    $telegramText =
        "📝 Новая заявка №{$applicationId}\n\n" .
        "👤 Родитель: {$parentName}\n" .
        "📞 Телефон: +7" . substr($phoneDigits, 1) . "\n" .
        "👶 Ребёнок: {$childName}\n" .
        "🎂 Дата рождения: {$birthDate}\n" .
        "📚 Программа: {$courses[$course]}\n" .
        "💬 Дополнительно: " . ($additionalInfo !== '' ? $additionalInfo : '—');

    $telegramUrl = 'https://api.telegram.org/bot' . TELEGRAM_BOT_TOKEN . '/sendMessage';
    $ch = curl_init($telegramUrl);

    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query([
            'chat_id' => TELEGRAM_CHAT_ID,
            'text' => $telegramText,
        ]),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
    ]);

    $telegramResponse = curl_exec($ch);
    $curlError = curl_error($ch);
    $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $telegramOk = !$curlError && $httpCode >= 200 && $httpCode < 300;

    $update = $pdo->prepare(
        'UPDATE applications SET telegram_sent = :telegram_sent WHERE id = :id'
    );
    $update->execute([
        ':telegram_sent' => $telegramOk ? 1 : 0,
        ':id' => $applicationId,
    ]);

    if (!$telegramOk) {
        error_log('Telegram error: ' . ($curlError ?: $telegramResponse));
        reply(true, 'Заявка сохранена, но сообщение в Telegram пока не отправилось.');
    }

    reply(true, 'Заявка успешно отправлена.');
} catch (Throwable $e) {
    error_log((string)$e);
    reply(false, 'Не удалось сохранить заявку. Проверьте настройки базы данных.', 500);
}
