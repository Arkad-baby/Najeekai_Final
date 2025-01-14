<?php
include 'database.php';
include 'JWTGenerator.php';
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
