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
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization');

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

if ($method == 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

try {
    // Initialize auth middleware
    $auth = new JWTAuthMiddleware();
    $authUser = null;

    // Protected routes require authentication
    if (in_array($method, ['GET', 'PUT', 'DELETE'])) {
        // Log headers for debugging
        error_log("Authorization Header: " . print_r(getallheaders(), true));
        
        // Validate token
        $auth->validateToken();
        $authUser = $auth->getAuthenticatedUser();
        
        error_log("Auth User Data: " . print_r($authUser, true));

        if (!$authUser || !isset($authUser['email'])) {
            throw new Exception("Invalid authentication token");
        }
    }

    switch ($method) {
        case 'GET':
            try {
                $email = $authUser['email'];
                error_log("Fetching data for email: " . $email);
                
                $stmt = $conn->prepare("SELECT * FROM customer WHERE email = ?");
                if (!$stmt) {
                    throw new Exception("Database preparation failed: " . $conn->error);
                }
                
                $stmt->bind_param("s", $email);
                if (!$stmt->execute()) {
                    throw new Exception("Query execution failed: " . $stmt->error);
                }
                
                $result = $stmt->get_result();
                $userData = $result->fetch_assoc();

                error_log("Query result: " . print_r($userData, true));

                if ($userData) {
                    unset($userData['password']);
                    http_response_code(200);
                    echo json_encode([
                        "status" => "success",
                        "data" => $userData
                    ]);
                } else {
                    http_response_code(404);
                    echo json_encode([
                        "status" => "error",
                        "message" => "User not found"
                    ]);
                }
                $stmt->close();
            } catch (Exception $e) {
                error_log("Error in GET method: " . $e->getMessage());
                throw $e;
            }
            break;

        case 'PUT':
            try {
                if (!isset($input['id'])) {
                    throw new Exception("ID is required");
                }

                // Log the input data
                error_log("PUT Input data: " . print_r($input, true));

                $stmt = $conn->prepare("UPDATE customer 
                                      SET firstName = ?, 
                                          middleName = ?, 
                                          lastName = ?, 
                                          address = ?, 
                                          phoneNumber = ? 
                                      WHERE id = ? AND email = ?");
                
                if (!$stmt) {
                    throw new Exception("Database preparation failed: " . $conn->error);
                }

                $stmt->bind_param("sssssss", 
                    $input['firstName'],
                    $input['middleName'],
                    $input['lastName'],
                    $input['address'],
                    $input['phoneNumber'],
                    $input['id'],
                    $authUser['email']
                );

                if (!$stmt->execute()) {
                    throw new Exception("Update failed: " . $stmt->error);
                }

                if ($stmt->affected_rows > 0) {
                    http_response_code(200);
                    echo json_encode([
                        "status" => "success",
                        "message" => "Profile updated successfully"
                    ]);
                } else {
                    throw new Exception("No rows were updated");
                }

                $stmt->close();
            } catch (Exception $e) {
                error_log("Error in PUT method: " . $e->getMessage());
                throw $e;
            }
            break;
  case 'POST':
        $username = $input['username'] ?? null;
        $firstName = $input['firstName'] ?? null;
        $email = $input['email'] ?? null;
        $password = $input['password'] ?? null;
        $address = $input['address'] ?? null;
        $phoneNumber = $input['phoneNumber'] ?? null;
        $middleName = $input['middleName'] ?? null;
        $lastName = $input['lastName'] ?? null;
        if (!$username || !$firstName || !$email || !$password || !$address || !$phoneNumber) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "All fields are required"]);
            exit;
        }

        $passwordHash = password_hash($password, PASSWORD_DEFAULT);



        $stmt = $conn->prepare("INSERT INTO customer (username, firstname, email, password, middleName, lastName, address, phoneNumber) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("ssssssss", $username, $firstName, $email, $passwordHash, $middleName, $lastName, $address, $phoneNumber);

        $jwt = new JWTGenerator($username,$email); 
        $signature=$jwt->generateToken();
        if ($stmt->execute()) {
            http_response_code(201); // Created

            echo json_encode(["status" => "success", "message" => "Customer added successfully","authToken"=>$signature]);
        } else {
            http_response_code(500); // Server Error
            echo json_encode(["status" => "error", "message" => "Failed to add customer"]);
        }

        $stmt->close();
        break;

   default:
        http_response_code(405); // Method Not Allowed
        echo json_encode(["status" => "error", "message" => "Invalid request method"]);
        break;
}
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    error_log("Error in API: " . $e->getMessage());
}


$conn->close();
?>
