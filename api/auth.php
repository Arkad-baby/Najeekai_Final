<?php
include 'database.php';
include 'JWTGenerator.php';
header("Content-Type: application/json");
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers,Content-Type,Access-Control-Allow-Methods');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        $username = $input['username'] ?? null;
        $password = $input['password'] ?? null;
        
        if (!$username || !$password ) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Either Email or password field is null."]);
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
    }

?>