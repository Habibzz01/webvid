<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Database sederhana menggunakan file JSON
define('DB_FILE', 'urls.json');

// Inisialisasi jika file tidak ada
if (!file_exists(DB_FILE)) {
    file_put_contents(DB_FILE, json_encode([]));
}

// Baca database
$db = json_decode(file_get_contents(DB_FILE), true) ?: [];

$request = json_decode(file_get_contents('php://input'), true);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $originalUrl = $request['original_url'] ?? '';
    $customName = $request['custom_name'] ?? '';
    
    // Validasi URL
    if (!filter_var($originalUrl, FILTER_VALIDATE_URL)) {
        echo json_encode(['success' => false, 'message' => 'Invalid URL']);
        exit;
    }
    
    // Generate short ID jika tidak ada custom name
    if (empty($customName)) {
        $shortId = substr(md5(uniqid()), 0, 8);
    } else {
        $shortId = preg_replace('/[^a-zA-Z0-9\-]/', '', $customName);
        
        // Pastikan short ID unik
        $counter = 1;
        $originalShortId = $shortId;
        while (isset($db[$shortId])) {
            $shortId = $originalShortId . '-' . $counter;
            $counter++;
        }
    }
    
    // Simpan ke database
    $db[$shortId] = [
        'original_url' => $originalUrl,
        'created_at' => date('Y-m-d H:i:s'),
        'visits' => 0
    ];
    
    file_put_contents(DB_FILE, json_encode($db, JSON_PRETTY_PRINT));
    
    echo json_encode([
        'success' => true,
        'short_id' => $shortId,
        'short_url' => (isset($_SERVER['HTTPS']) ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . '/' . $shortId
    ]);
    exit;
}

// Jika request GET, ini untuk redirect
if ($_SERVER['REQUEST_METHOD'] === 'GET' && !empty($_SERVER['REQUEST_URI'])) {
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $shortId = ltrim($path, '/');
    
    if (!empty($shortId) && $shortId !== 'link.php') {
        $db = json_decode(file_get_contents(DB_FILE), true) ?: [];
        
        if (isset($db[$shortId])) {
            // Update visit count
            $db[$shortId]['visits']++;
            file_put_contents(DB_FILE, json_encode($db, JSON_PRETTY_PRINT));
            
            // Redirect ke URL asli
            header('Location: ' . $db[$shortId]['original_url']);
            exit;
        }
    }
}

// Jika tidak ada route yang match
echo json_encode(['success' => false, 'message' => 'Invalid request']);