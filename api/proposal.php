<?php
error_reporting(E_ALL);
include 'database.php';
include 'JWTGenerator.php';  // Make sure to include this
ini_set('display_errors', 1);
header("Content-Type: application/json");
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers,Content-Type,Access-Control-Allow-Methods');

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        if (isset($_GET['freelancerId'])) {
            $freelancerId = $_GET['freelancerId'];
            $stmt = $conn->prepare("SELECT * FROM proposal WHERE freelancerId = ?");
            $stmt->bind_param("s", $freelancerId);
            $stmt->execute();
            $result = $stmt->get_result();
            $proposals = $result->fetch_assoc();

            $stmt = $conn->prepare("SELECT * FROM post WHERE id = ?");
            $stmt->bind_param("s", $proposals['postId']);
            $stmt->execute();
            $result = $stmt->get_result();
            $posts = $result->fetch_assoc();

            $stmt = $conn->prepare("SELECT firstName,lastName,address,phoneNumber FROM customer WHERE id = ?");
            $stmt->bind_param("s", $posts['customerId']);
            $stmt->execute();
            $result = $stmt->get_result();
            $customerData = $result->fetch_assoc();

            if ($proposals && $posts && $customerData) {
                http_response_code(200);
                echo json_encode(["status" => "success", "proposals" => $proposals, "posts" => $posts, "customerData" => $customerData]);
            } else {
                http_response_code(404); // Not Found
                echo json_encode(["status" => "error", "message" => "Post not found"]);
            }

            $stmt->close();
        } 

        else    if (isset($_GET['postId'])) {
            $postId = $_GET['postId'];
            $stmt = $conn->prepare("SELECT * FROM proposal WHERE postId = ?");
            $stmt->bind_param("s", $postId);
            $stmt->execute();
            $result = $stmt->get_result();
            $proposals = $result->fetch_assoc();

            $stmt = $conn->prepare("SELECT firstName,lastName,address,phoneNumber,rate,skills FROM freelancer WHERE id = ?");
            $stmt->bind_param("s", $proposals['freelancerId']);
            $stmt->execute();
            $result = $stmt->get_result();
            $freelancerData = $result->fetch_assoc();

            if ($proposals && $freelancerData) {
                http_response_code(200);
                echo json_encode(["status" => "success", "proposals" => $proposals,  "freelancerData" => $freelancerData]);
            } else {
                http_response_code(404); // Not Found
                echo json_encode(["status" => "error", "message" => "Post not found"]);
            }

            $stmt->close();
        } 
        
        else {
            $result = $conn->query("SELECT * FROM post");
            $posts = [];

            while ($row = $result->fetch_assoc()) {
                $posts[] = $row;
            }

            http_response_code(200);
            echo json_encode(["status" => "success", "data" => $posts]);
        }
        break;

    case 'POST':

     // Retrieve input fields
     $freelancerId = $input['freelancerId'] ?? null;
     $postId = $input['postId'] ?? null;

     if (!$freelancerId || !$postId ) {
         http_response_code(400); // Bad Request
         echo json_encode(["status" => "error", "message" => "FreelancerId and PostId are required"]);
         exit;
     }

        $stmt = $conn->prepare("INSERT INTO proposal (freelancerId, postId) VALUES (?, ?)");
        $stmt->bind_param("ss", $freelancerId, $postId);

        if ($stmt->execute()) {
            http_response_code(201); // Created

            echo json_encode(["status" => "success", "message" => "Proposal added successfully"]);
        } else {
            http_response_code(500); // Server Error
            echo json_encode(["status" => "error", "message" => "Failed to add porposal."]);
        }

        $stmt->close();
        break;

    default:
        http_response_code(405); // Method Not Allowed
        echo json_encode(["status" => "error", "message" => "Invalid request method"]);
        break;

}
$conn->close();
?>
