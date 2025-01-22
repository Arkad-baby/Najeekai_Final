<?php
error_reporting(E_ALL);
include 'database.php';
include 'JWTGenerator.php';
ini_set('display_errors', 1);
require_once 'JWTAuthMiddleware.php';

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        // Check for specific proposal
        if (isset($_GET['postId']) && isset($_GET['freelancerId'])) {
            $postId = $_GET['postId'];
            $freelancerId = $_GET['freelancerId'];
            
            $stmt = $conn->prepare("SELECT * FROM proposal WHERE postId = ? AND freelancerId = ? LIMIT 1");
            $stmt->bind_param("ss", $postId, $freelancerId);
            $stmt->execute();
            $result = $stmt->get_result();
            $proposal = $result->fetch_assoc();
            
            if ($proposal) {
                http_response_code(200);
                echo json_encode([
                    "status" => "success",
                    "exists" => true,
                    "data" => $proposal
                ]);
            } else {
                http_response_code(404);
                echo json_encode([
                    "status" => "error",
                    "exists" => false,
                    "message" => "No proposal found"
                ]);
            }
            $stmt->close();
            exit();
        }
        
        // Get freelancer's proposals
        else if (isset($_GET['freelancerId'])) {
            $freelancerId = $_GET['freelancerId'];
            $stmt = $conn->prepare("SELECT * FROM proposal WHERE freelancerId = ?");
            $stmt->bind_param("s", $freelancerId);
            $stmt->execute();
            $result = $stmt->get_result();
            $proposals = $result->fetch_all(MYSQLI_ASSOC);
            
            http_response_code(200);
            echo json_encode([
                "status" => "success",
                "data" => $proposals
            ]);
            $stmt->close();
            exit();
        }
        
        // Get post's proposals
        else if (isset($_GET['postId'])) {
            $postId = $_GET['postId'];
            $stmt = $conn->prepare("SELECT * FROM proposal WHERE postId = ?");
            $stmt->bind_param("s", $postId);
            $stmt->execute();
            $result = $stmt->get_result();
            $proposals = $result->fetch_all(MYSQLI_ASSOC);
            
            http_response_code(200);
            echo json_encode([
                "status" => "success",
                "data" => $proposals
            ]);
            $stmt->close();
            exit();
        }
        break;

    case 'POST':
        if (!$input['freelancerId'] || !$input['postId']) {
            http_response_code(400);
            echo json_encode([
                "status" => "error",
                "message" => "FreelancerId and PostId are required"
            ]);
            exit();
        }

        // Check if proposal already exists
        $stmt = $conn->prepare("SELECT id FROM proposal WHERE freelancerId = ? AND postId = ?");
        $stmt->bind_param("ss", $input['freelancerId'], $input['postId']);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            http_response_code(400);
            echo json_encode([
                "status" => "error",
                "message" => "Proposal already exists"
            ]);
            exit();
        }

        // Insert new proposal
        $stmt = $conn->prepare("INSERT INTO proposal (freelancerId, postId) VALUES (?, ?)");
        $stmt->bind_param("ss", $input['freelancerId'], $input['postId']);

        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode([
                "status" => "success",
                "message" => "Proposal added successfully"
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                "status" => "error",
                "message" => "Failed to add proposal"
            ]);
        }
        $stmt->close();
        break;

    default:
        http_response_code(405);
        echo json_encode([
            "status" => "error",
            "message" => "Invalid request method"
        ]);
        break;
}

$conn->close();