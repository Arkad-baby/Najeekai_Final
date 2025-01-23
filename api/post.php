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
        if (isset($_GET['id'])) {
            $id = $_GET['id'];
            $stmt = $conn->prepare("SELECT * FROM post WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $data = $result->fetch_assoc();

            if ($data) {
                http_response_code(200);
                echo json_encode(["status" => "success", "data" => $data]);
            } else {
                http_response_code(404); // Not Found
                echo json_encode(["status" => "error", "message" => "Post not found"]);
            }

            $stmt->close();
        } 
        else if (isset($_GET['term'])) {
            // Sanitize user input
            $term = trim($_GET['term']);
        
            // Use a more flexible search query with LIKE for partial matches
            $stmt = $conn->prepare("SELECT * FROM post WHERE caption LIKE ?");
            $searchTerm = "%" . $term . "%"; // Allow partial matches
            $stmt->bind_param("s", $searchTerm);
            $stmt->execute();
        
            // Fetch all matching rows
            $result = $stmt->get_result();
            $data = $result->fetch_all(MYSQLI_ASSOC);
        
            if (!empty($data)) {
                http_response_code(200);
                echo json_encode([
                    "status" => "success",
                    "data" => $data
                ]);
            } else {
                http_response_code(404); // Not Found
                echo json_encode([
                    "status" => "error",
                    "message" => "No posts found for the given term"
                ]);
            }
        
            $stmt->close();
        }
        else if (isset($_GET['customerId'])) {
            $customerId = $_GET['customerId'];
            $posts = [];
            
            // Modified query to include only existing customer fields
            $stmt = $conn->prepare("
                SELECT 
                    p.*,
                    c.username as customer_username,
                    c.firstName as customer_firstName,
                    c.email as customer_email,
                    c.middleName as customer_middleName,
                    c.lastName as customer_lastName,
                    c.address as customer_address,
                    c.phoneNumber as customer_phoneNumber,
                    pr.id as proposal_id,
                    pr.isApproved,
                    pr.isCancelled,
                    f.id as freelancer_id,
                    f.username as freelancer_username,
                    f.firstName as freelancer_firstName,
                    f.middleName as freelancer_middleName,
                    f.lastName as freelancer_lastName,
                    f.email as freelancer_email,
                    f.phoneNumber as freelancer_phoneNumber,
                    f.address as freelancer_address,
                    f.skills as freelancer_skills
                FROM post p
                LEFT JOIN customer c ON p.customerId = c.id
                LEFT JOIN proposal pr ON p.id = pr.postId
                LEFT JOIN freelancer f ON pr.freelancerId = f.id
                WHERE p.customerId = ?
            ");
            
            $stmt->bind_param("s", $customerId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $postsMap = [];
            
            while ($row = $result->fetch_assoc()) {
                $postId = $row['id'];
                
                // If this is the first time we're seeing this post
                if (!isset($postsMap[$postId])) {
                    // Extract post fields
                    $post = [
                        'id' => $row['id'],
                        'caption' => $row['caption'],
                        'description' => $row['description'],
                        'postedAt' => $row['postedAt'],
                        'requiredSkills' => $row['requiredSkills'],
                        'location' => $row['location'],
                        'estimatedTime' => $row['estimatedTime'],
                        'customerId' => $row['customerId'],
                        'rate' => $row['rate'],
                        'username' => $row['customer_username'],
                        'firstName' => $row['customer_firstName'],
                        'email' => $row['customer_email'],
                        'middleName' => $row['customer_middleName'],
                        'lastName' => $row['customer_lastName'],
                        'address' => $row['customer_address'],
                        'phoneNumber' => $row['customer_phoneNumber'],
                        'proposals' => []
                    ];
                    
                    $postsMap[$postId] = $post;
                }
                
                // If there's a proposal for this post
                if ($row['proposal_id']) {
                    // Create freelancer object only if freelancer_id exists
                    $freelancer = null;
                    if ($row['freelancer_id']) {
                        $freelancer = [
                            'id' => $row['freelancer_id'],
                            'username' => $row['freelancer_username'],
                            'firstName' => $row['freelancer_firstName'],
                            'middleName' => $row['freelancer_middleName'],
                            'lastName' => $row['freelancer_lastName'],
                            'email' => $row['freelancer_email'],
                            'phoneNumber' => $row['freelancer_phoneNumber'],
                            'address' => $row['freelancer_address'],
                            'skills' => $row['freelancer_skills']
                        ];
                    }
                    
                    $proposal = [
                        'id' => $row['proposal_id'],
                        'isApproved' => (bool)$row['isApproved'],
                        'isCancelled' => (bool)$row['isCancelled'],
                        'freelancer' => $freelancer
                    ];
                    
                    $postsMap[$postId]['proposals'][] = $proposal;
                }
            }
            
            // Convert the map to an array
            $posts = array_values($postsMap);
            
            if (!empty($posts)) {
                http_response_code(200);
                echo json_encode([
                    "status" => "success",
                    "data" => $posts
                ]);
            } else {
                http_response_code(404); // Not Found
                echo json_encode([
                    "status" => "error",
                    "message" => "No posts found for the given customer"
                ]);
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
     $caption = $input['caption'] ?? null;
     $description = $input['description'] ?? null;
     $requiredSkills = $input['requiredSkills'] ?? null;
     $location = $input['location'] ?? null;
     $estimatedTime = $input['estimatedTime'] ?? null;
     $customerId = $input['customerId'] ?? null;
     $rate = $input['rate'] ?? null;
 
     // Validate required fields
     if (!$caption || !$description || !$location || !$estimatedTime || !$rate) {
         http_response_code(400); // Bad Request
         echo json_encode(["status" => "error", "message" => "Caption, description, location, estimated time, and rate are required"]);
         exit;
     }


        $stmt = $conn->prepare("INSERT INTO post (caption, description,  requiredSkills, location, estimatedTime, customerId, rate)
        VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("ssssisi", $caption, $description,  $requiredSkills, $location, $estimatedTime, $customerId,$rate);

        if ($stmt->execute()) {
            http_response_code(201); // Created

            echo json_encode(["status" => "success", "message" => "Post added successfully"]);
        } else {
            http_response_code(500); // Server Error
            echo json_encode(["status" => "error", "message" => "Failed to add post."]);
        }

        $stmt->close();
        break;

        case 'PUT':
            // Extract input fields
            $id = $input['id'] ?? null;
            $caption = $input['caption'] ?? null;
            $description = $input['description'] ?? null;
            $requiredSkills = $input['requiredSkills'] ?? null;
            $location = $input['location'] ?? null;
            $estimatedTime = $input['estimatedTime'] ?? null;
            $customerId = $input['customerId'] ?? null;
            $rate = $input['rate'] ?? null;
        
            // Validate required fields
            if (!$id) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Valid ID is required."]);
                exit;
            }
        
            if (!$customerId || !$caption || !$description || !$requiredSkills || !$location || !$estimatedTime || !$rate) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "customerId, caption, description, requiredSkills, location, estimatedTime, and rate are required."]);
                exit;
            }
        
            // Prepare the SQL statement to update the post
            $stmt = $conn->prepare("
                UPDATE post 
                SET 
                    customerId = ?, 
                    caption = ?, 
                    requiredSkills = ?, 
                    location = ?, 
                    description = ?, 
                    estimatedTime = ?, 
                    rate = ?
                WHERE id = ?
            ");
        
            // Bind parameters
            $stmt->bind_param(
                "sssssiis", 
                $customerId, 
                $caption, 
                $requiredSkills, 
                $location, 
                $description, 
                $estimatedTime, 
                $rate, 
                $id
            );
        
            // Execute and check for errors
            if ($stmt->execute()) {
                http_response_code(200);
                echo json_encode(["status" => "success", "message" => "Post updated successfully."]);
            } else {
                http_response_code(500);
                echo json_encode(["status" => "error", "message" => "Failed to update post."]);
            }
        
            // Close the statement
            $stmt->close();
            break;
        
        

    case 'DELETE':
        $id = isset($_GET['id'])  ? $_GET['id'] : null;

        if (!$id) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Valid ID is required"]);
            exit;
        }

        $stmt = $conn->prepare("DELETE FROM post WHERE id = ?");
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                http_response_code(200);
                echo json_encode(["status" => "success", "message" => "post deleted successfully"]);
            } else {
                http_response_code(404);
                echo json_encode(["status" => "error", "message" => "post not found"]);
            }
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Failed to delete post"]);
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
