CREATE TABLE customer (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    username VARCHAR(255) UNIQUE NOT NULL,
    firstName VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    middleName VARCHAR(255),
    lastName VARCHAR(255) NOT NULL,
    address VARCHAR(255)  ,
    phoneNumber VARCHAR(20)  
);

CREATE TABLE freelancer (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    username VARCHAR(255) UNIQUE NOT NULL,
    firstName VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    middleName VARCHAR(255),
    lastName VARCHAR(255) NOT NULL,
    availibility BOOLEAN DEFAULT FALSE,
    address VARCHAR(255) ,
    phoneNumber VARCHAR(20) ,
    password VARCHAR(255) NOT NULL,
    description TEXT,
    rate FLOAT,
    skills LONGTEXT, 
);

CREATE TABLE post (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    caption VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    postedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    requiredSkills JSON, 
    location VARCHAR(255) NOT NULL,
    estimatedTime INT NOT NULL,
    customerId VARCHAR(36),
    rate INT NOT NULL,
    FOREIGN KEY (customerId) REFERENCES Customer(id) ON DELETE SET NULL
);

CREATE TABLE proposal (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    postId VARCHAR(36) UNIQUE NOT NULL,
    freelancerId VARCHAR(36) NOT NULL,
    isApproved BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (postId) REFERENCES Post(id) ON DELETE CASCADE,
    FOREIGN KEY (freelancerId) REFERENCES Freelancer(id) ON DELETE CASCADE
);