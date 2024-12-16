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
            $stmt = $conn->prepare("SELECT * FROM customer WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $data = $result->fetch_assoc();

            if ($data) {
                http_response_code(200);
                echo json_encode(["status" => "success", "data" => $data]);
            } else {
                http_response_code(404); // Not Found
                echo json_encode(["status" => "error", "message" => "Customer not found"]);
            }

            $stmt->close();
        } else {
            $result = $conn->query("SELECT * FROM customer");
            $customers = [];

            while ($row = $result->fetch_assoc()) {
                $customers[] = $row;
            }

            http_response_code(200);
            echo json_encode(["status" => "success", "data" => $customers]);
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

    case 'PUT':
        $id = $input['id'] ?? null;
        $firstName = $input['firstName'] ?? null;
        $middleName = $input['middleName'] ?? null;
        $lastName = $input['lastName'] ?? null;
        $address = $input['address'] ?? null;
        $phoneNumber = $input['phoneNumber'] ?? null;
        // Validate if ID and other fields are provided
        if (!$id) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Valid ID is required"]);
            exit;
        }
        if ( !$firstName  || !$lastName || !$address || !$phoneNumber) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "All fields are required"]);
            exit;
        }

        $stmt = $conn->prepare("UPDATE customer 
                                SET firstName = ?, 
                                    middleName = ?, 
                                    lastName = ?, 
                                    address = ?, 
                                    phoneNumber = ? 
                                WHERE id = ?");
        $stmt->bind_param("sssssi", $firstName, $middleName, $lastName, $address, $phoneNumber, $id);

        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(["status" => "success", "message" => "Customer updated successfully"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Failed to update customer"]);
        }

        $stmt->close();
        break;

    case 'DELETE':
        $id = isset($_GET['id'])  ? $_GET['id'] : null;

        if (!$id) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Valid ID is required"]);
            exit;
        }

        $stmt = $conn->prepare("DELETE FROM customer WHERE id = ?");
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                http_response_code(200);
                echo json_encode(["status" => "success", "message" => "Customer deleted successfully"]);
            } else {
                http_response_code(404);
                echo json_encode(["status" => "error", "message" => "Customer not found"]);
            }
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Failed to delete customer"]);
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
