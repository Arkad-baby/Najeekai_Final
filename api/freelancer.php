<?php
// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Start error logging
ini_set('log_errors', 1);
ini_set('error_log', 'error.log');

include 'database.php';
include 'JWTGenerator.php';
include 'JWTAuthMiddleware.php';

header("Content-Type: application/json");
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers,Content-Type,Access-Control-Allow-Methods');

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $id = $_GET['id'];
            $stmt = $conn->prepare("SELECT * FROM freelancer WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $data = $result->fetch_assoc();

            if ($data) {
                http_response_code(200);
                echo json_encode(["status" => "success", "data" => $data]);
            } else {
                http_response_code(404); // Not Found
                echo json_encode(["status" => "error", "message" => "Freelancer not found"]);
            }

            $stmt->close();
        }
        else if (isset($_GET['skill'])) {
            // Sanitize and validate user input
            $skill = trim($_GET['skill']);
            
            if (!empty($skill)) {
                // Prepare the SQL statement
                $stmt = $conn->prepare("SELECT * FROM freelancer WHERE skills LIKE ?");
                
                // Use LIKE with wildcards for partial matches
                $searchTerm = "%" . $skill . "%";
                $stmt->bind_param("s", $searchTerm);
                
                // Execute the query
                $stmt->execute();
                
                // Fetch all matching rows
                $result = $stmt->get_result();
                $data = $result->fetch_all(MYSQLI_ASSOC);
                
                // Respond with appropriate status and data
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
                        "message" => "No freelancer found for the given skill."
                    ]);
                }
                
                $stmt->close();
            } else {
                // Handle empty skill input
                http_response_code(400); // Bad Request
                echo json_encode([
                    "status" => "error",
                    "message" => "Skill parameter cannot be empty."
                ]);
            }
        }
        
        else {
            $result = $conn->query("SELECT * FROM freelancer");
            $freelancers = [];

            while ($row = $result->fetch_assoc()) {
                $freelancers[] = $row;
            }

            http_response_code(200);
            echo json_encode(["status" => "success", "data" => $freelancers]);
        }
        break;

    case 'POST':
        $username = $input['username'] ?? null;
        $firstName = $input['firstName'] ?? null;
        $email = $input['email'] ?? null;
        $password = $input['password'] ?? null;
        $address = $input['address'] ?? null;
        $phoneNumber = $input['phoneNumber'] ?? null;
        $lastName = $input['lastName'] ?? null;
        $description = $input['description'] ?? null;
        $rate = $input['rate'] ?? null;
        $skills = $input['skills'] ?? null;
        $middleName = $input['middleName'] ?? null;
        if (!$username || !$firstName || !$email || !$password || !$address || !$phoneNumber) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "All fields are required"]);
            exit;
        }

        $passwordHash = password_hash($password, PASSWORD_DEFAULT);



        $stmt = $conn->prepare("INSERT INTO freelancer (username, firstname, email, password, middleName, lastName, address, phoneNumber, description, rate, skills) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?,?,?)");
        $stmt->bind_param("sssssssssis", $username, $firstName, $email, $passwordHash, $middleName, $lastName, $address, $phoneNumber,$description,$rate,$skills);

        $jwt = new JWTGenerator($username,$email); 
        $signature=$jwt->generateToken();
        if ($stmt->execute()) {
            http_response_code(201); // Created

            echo json_encode(["status" => "success", "message" => "Freelancer added successfully","authToken"=>$signature]);
        } else {
            http_response_code(500); // Server Error
            echo json_encode(["status" => "error", "message" => "Failed to add freelancer."]);
        }

        $stmt->close();
        break;

        case 'PUT':
            // Extract input fields
            $id = $input['id'] ?? null;
            $firstName = $input['firstName'] ?? null;
            $middleName = $input['middleName'] ?? null;
            $lastName = $input['lastName'] ?? null;
            $address = $input['address'] ?? null;
            $phoneNumber = $input['phoneNumber'] ?? null;
            $description = $input['description'] ?? null;
            $rate = $input['rate'] ?? null;
            $skills = $input['skills'] ?? null;
            $availibility = $input['availibility'] ?? null;
                    
            // Validate required fields
            if (!$id) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Valid ID is required."]);
                exit;
            }
        
            if (!$firstName || !$lastName || !$address || !$phoneNumber) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "First Name, Last Name, Address, and Phone Number are required."]);
                exit;
            }
        
            // Prepare the SQL statement to update the freelancer
            $stmt = $conn->prepare("UPDATE freelancer 
                                    SET firstName = ?, 
                                        middleName = ?, 
                                        lastName = ?, 
                                        address = ?, 
                                        phoneNumber = ?, 
                                        description = ?, 
                                        rate = ?, 
                                        skills = ? ,
                                        availibility=?

                                    WHERE id = ?");
            $stmt->bind_param(
                "ssssssdssi", 
                $firstName, 
                $middleName, 
                $lastName, 
                $address, 
                $phoneNumber, 
                $description, 
                $rate, 
                $skills, 
                $availibility, 
                $id 
            );
        
            // Execute and check for errors
            if ($stmt->execute()) {
                http_response_code(200);
                echo json_encode(["status" => "success", "message" => "Freelancer updated successfully."]);
            } else {
                http_response_code(500);
                echo json_encode(["status" => "error", "message" => "Failed to update freelancer."]);
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

        $stmt = $conn->prepare("DELETE FROM freelancer WHERE id = ?");
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                http_response_code(200);
                echo json_encode(["status" => "success", "message" => "Freelancer deleted successfully"]);
            } else {
                http_response_code(404);
                echo json_encode(["status" => "error", "message" => "Freelancer not found"]);
            }
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Failed to delete freelancer"]);
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
