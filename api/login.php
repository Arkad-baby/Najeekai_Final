<?php
error_reporting(E_ALL);
include 'database.php';
include 'JWTGenerator.php';  // Make sure to include this
ini_set('display_errors', 1);
require_once 'JWTAuthMiddleware.php';

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

try {
    // Get and validate input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!isset($data['username']) || !isset($data['password'])) {
        throw new Exception("Username and password are required");
    }

    $username = $conn->real_escape_string(trim($data['username']));
    $password = trim($data['password']);

    // First check customer table
    $query = "SELECT * FROM customer WHERE username = ? OR email = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ss", $username, $username);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    $userType = 'customer';

    // If not found in customer table, check freelancer table
    if (!$user) {
        $query = "SELECT * FROM freelancer WHERE username = ? OR email = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("ss", $username, $username);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        $userType = 'freelancer';
    }

    if (!$user || !password_verify($password, $user['password'])) {
        throw new Exception("Invalid username/email or password");
    }

    // Generate JWT token using JWTGenerator
    $jwtGenerator = new JWTGenerator($user['username'], $user['email']);
    $token = $jwtGenerator->generateToken();

    // Prepare response data
    $responseData = [
        "status" => "success",
        "message" => "Login successful",
        "authToken" => $token,
        "userType" => $userType,
        "user" => [
            "id" => $user['id'],
            "username" => $user['username'],
            "email" => $user['email'],
            "firstName" => $user['firstName'],
            "lastName" => $user['lastName']
        ]
    ];

    // Add freelancer-specific data if applicable
    if ($userType === 'freelancer') {
        $responseData['user']['availibility'] = (bool)$user['availibility'];
        $responseData['user']['rate'] = (float)$user['rate'];
    }

    http_response_code(200);
    echo json_encode($responseData);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
    error_log("Login error: " . $e->getMessage());
} finally {
    if (isset($stmt)) {
        $stmt->close();
    }
    if (isset($conn)) {
        $conn->close();
    }
}
?>