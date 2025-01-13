<?php
$servername = "localhost";
$username = "root"; // Use environment variables for security
$password = ""; // Use environment variables for security
$dbname = "najeekai";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    error_log("Connection failed: " . $conn->connect_error); // Log the error instead of showing it
    exit("Database connection error. Please try again later.");
}
?>
