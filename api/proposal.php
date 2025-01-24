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
        if (isset($_GET['proposalId']) && isset($_GET['action'])) {
            $proposalId = $_GET['proposalId'];
            $action = $_GET['action'];
            
            if ($action === 'approve') {
                $stmt = $conn->prepare("UPDATE proposal SET isApproved = 1, isCancelled = 0 WHERE id = ?");
            } else if ($action === 'reject') {
                $stmt = $conn->prepare("UPDATE proposal SET isApproved = 0, isCancelled = 1 WHERE id = ?");
            } else if ($action === 'cancel') {
                $stmt = $conn->prepare("UPDATE proposal SET isCancelled = 1 WHERE id = ?");
            } else {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Invalid action"]);
                exit();
            }
            
            $stmt->bind_param("s", $proposalId);
            
            if ($stmt->execute()) {
                http_response_code(200);
                echo json_encode(["status" => "success", "message" => "Proposal updated successfully"]);
            } else {
                http_response_code(500);
                echo json_encode(["status" => "error", "message" => "Failed to update proposal"]);
            }
            
            $stmt->close();
            exit();
        }
    
       else if (isset($_GET['postId']) && isset($_GET['freelancerId'])) {
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
        
  
else if (isset($_GET['freelancerId'])) {
    $freelancerId = $_GET['freelancerId'];

    // Query to fetch proposals with customer details for approved proposals
    $stmt = $conn->prepare("
    SELECT
        proposal.id AS proposalId,
        proposal.freelancerId,
        proposal.postId,
        proposal.isApproved,
        proposal.isCancelled,
        customer.id AS customerId,
        customer.firstName,
        customer.middleName,
        customer.lastName,
        customer.email,
        customer.phoneNumber,
        post.caption AS postTitle,
        post.description AS postDescription,
        post.requiredSkills,
        post.location,
        post.estimatedTime AS estimatedTime,
        post.rate
    FROM
        proposal
    LEFT JOIN
        post ON proposal.postId = post.id
    LEFT JOIN
        customer ON post.customerId = customer.id
    WHERE
        proposal.freelancerId = ?
");

    $stmt->bind_param("s", $freelancerId);
    $stmt->execute();
    $result = $stmt->get_result();
    $proposals = [];

    while ($row = $result->fetch_assoc()) {
        $customerDetails = null;
        if ($row['isApproved'] && !$row['isCancelled']) {
            $customerDetails = [
                "id" => $row['customerId'],
                "firstName" => $row['firstName'],
                "middleName" => $row['middleName'],
                "lastName" => $row['lastName'],
                "email" => $row['email'],
                "phoneNumber" => $row['phoneNumber'],
            ];
        }
        
        $postDetails = [
            "id" => $row['postId'],
            "caption" => $row['postTitle'],
            "description" => $row['postDescription'],
            "rate" => $row['rate'],
            "requiredSkills" => $row['requiredSkills'],
            "location" => $row['location'],
            "estimatedTime" => $row['estimatedTime']
        ];
    
        $proposals[] = [
            "proposalId" => $row['proposalId'],
            "freelancerId" => $row['freelancerId'],
            "postId" => $row['postId'],
            "isApproved" => (bool)$row['isApproved'],
            "isCancelled" => (bool)$row['isCancelled'],
            "customer" => $customerDetails,
            "post" => $postDetails
        ];
    }

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
        // Inside the GET case, add this else if block
else if (isset($_GET['customerId'])) {
    $customerId = $_GET['customerId'];
    
    $stmt = $conn->prepare("
        SELECT 
            proposal.*,
            freelancer.id AS freelancerId,
            freelancer.firstName AS freelancerFirstName,
            freelancer.lastName AS freelancerLastName,
            freelancer.email AS freelancerEmail,
            freelancer.phoneNumber AS freelancerPhone,
            post.*
        FROM proposal
        JOIN post ON proposal.postId = post.id
        JOIN freelancer ON proposal.freelancerId = freelancer.id
        WHERE post.customerId = ?
    ");
    
    $stmt->bind_param("s", $customerId);
    $stmt->execute();
    $result = $stmt->get_result();
    $proposals = [];
    
    while ($row = $result->fetch_assoc()) {
        $proposals[] = [
            "id" => $row['id'],
            "isApproved" => (bool)$row['isApproved'],
            "isCancelled" => (bool)$row['isCancelled'],
            "freelancer" => [
                "id" => $row['freelancerId'],
                "firstName" => $row['freelancerFirstName'],
                "lastName" => $row['freelancerLastName'],
                "email" => $row['freelancerEmail'],
                "phoneNumber" => $row['freelancerPhone']
            ],
            "post" => [
                "id" => $row['postId'],
                "caption" => $row['caption'],
                "description" => $row['description'],
                "location" => $row['location'],
                "rate" => $row['rate'],
                "estimatedTime" => $row['estimatedTime'],
                "requiredSkills" => $row['requiredSkills'],
             
            ]
        ];
    }
    
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

  


      // Check if a proposal already exists for the given postId and freelancerId
$stmt = $conn->prepare("SELECT id FROM proposal WHERE postId = ? AND freelancerId = ?");
$stmt->bind_param("ss", $input['postId'], $input['freelancerId']);
$stmt->execute();
$result = $stmt->get_result();

// If the proposal already exists, return an error
if ($result->num_rows > 0) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Proposal already exists"
    ]);
    exit();
}

// Check if proposal already exists
$stmt = $conn->prepare("SELECT id FROM proposal WHERE postId = ? AND freelancerId = ?");
$stmt->bind_param("ss", $input['postId'], $input['freelancerId']);
$stmt->execute();
$result = $stmt->get_result();

// If the proposal already exists, return an error
if ($result->num_rows > 0) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Proposal already exists"
    ]);
    exit();
}

// If proposal does not exist, insert a new one
$stmt = $conn->prepare("INSERT INTO proposal (id, postId, freelancerId) VALUES (UUID(), ?, ?)");
$stmt->bind_param("ss", $input['postId'], $input['freelancerId']);
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