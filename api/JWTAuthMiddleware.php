<?php
class JWTAuthMiddleware {
    private $secret_key = "BNzAj1+RLKV788fjFebJ6g/nEgUNUMjmXXkXrXCQcbA0sKBL9IKomraEbm0LVHC6";

    private function getAuthorizationHeader() {
        $headers = null;
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
        } else if (isset($_SERVER['Authorization'])) {
            $headers = trim($_SERVER["Authorization"]);
        } elseif (function_exists('apache_request_headers')) {
            $requestHeaders = apache_request_headers();
            if (isset($requestHeaders['Authorization'])) {
                $headers = trim($requestHeaders['Authorization']);
            }
        }
        return $headers;
    }

    private function getBearerToken() {
        $headers = $this->getAuthorizationHeader();
        if (!empty($headers)) {
            if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
                return $matches[1];
            }
        }
        return null;
    }

    public function validateToken() {
        $token = $this->getBearerToken();
        
        if (!$token) {
            throw new Exception("No token provided");
        }

        try {
            $decoded = JWTGenerator::decodeToken($token, $this->secret_key);
            return $decoded;
        } catch (Exception $e) {
            throw new Exception("Invalid token: " . $e->getMessage());
        }
    }

    public function getAuthenticatedUser() {
        try {
            return $this->validateToken();
        } catch (Exception $e) {
            return null;
        }
    }
}
?>