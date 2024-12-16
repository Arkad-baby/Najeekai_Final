<?php
include 'JWTGenerator.php';

try {
    // Create a JWTGenerator instance
    $jwt = new JWTGenerator("JohnDoe", "johndoe@example.com");

    // Generate a token
    $token = $jwt->generateToken();
    echo "Generated Token: " . $token . PHP_EOL;

    // Decode and verify the token
    $decodedPayload = JWTGenerator::decodeToken($token, "BNzAj1+RLKV788fjFebJ6g/nEgUNUMjmXXkXrXCQcbA0sKBL9IKomraEbm0LVHC6");
    echo "Decoded Payload: " . PHP_EOL;
    echo "Username: " . $decodedPayload['userName'] . PHP_EOL;
    echo "Email: " . $decodedPayload['email'] . PHP_EOL;

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . PHP_EOL;
}
?>