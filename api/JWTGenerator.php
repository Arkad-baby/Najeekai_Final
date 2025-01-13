<?php
class JWTGenerator {
    private $userName;
    private $email;
    private $secret_key = "BNzAj1+RLKV788fjFebJ6g/nEgUNUMjmXXkXrXCQcbA0sKBL9IKomraEbm0LVHC6";
    private $header;

    // Base64 URL-safe encoding
    public static function base64urlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    // Base64 URL-safe decoding
    public static function base64urlDecode($data) {
        $padding = strlen($data) % 4;
        if ($padding) {
            $data .= str_repeat('=', 4 - $padding);
        }
        return base64_decode(strtr($data, '-_', '+/'));
    }

    public function __construct($userName, $email) {
        $this->userName = $userName; 
        $this->email = $email; 
        $this->header = json_encode([
            "alg" => "HS256",
            "typ" => "JWT"
        ]);
    }

    // Generate a JWT
    public function generateToken() {
        $header = self::base64urlEncode($this->header);

        $payload = [
            "userName" => $this->userName,
            "email" => $this->email
        ];
        $payload = self::base64urlEncode(json_encode($payload));

        $signature = hash_hmac("sha256", $header . "." . $payload, $this->secret_key, true);
        $signature = self::base64urlEncode($signature);

        // Return the complete token: header.payload.signature
        return $header . "." . $payload . "." . $signature;
    }

    // Decode and verify a JWT
    public static function decodeToken($jwt) {
        $parts = explode('.', $jwt);

        if (count($parts) !== 3) {
            throw new Exception("Invalid JWT format");
        }

        list($headerEncoded, $payloadEncoded, $signatureEncoded) = $parts;

        // Decode header and payload
        $header = json_decode(self::base64urlDecode($headerEncoded), true);
        $payload = json_decode(self::base64urlDecode($payloadEncoded), true);

        // Verify the signature
        $expectedSignature = hash_hmac("sha256", $headerEncoded . "." . $payloadEncoded, $secret_key, true);
        $expectedSignatureEncoded = self::base64urlEncode($expectedSignature);

        if ($signatureEncoded !== $expectedSignatureEncoded) {
            throw new Exception("Invalid signature: Token has been tampered with!");
        }

        // Return the decoded payload (username and email)
        return $payload;
    }
}

// Example usage

?>
