CREATE DATABASE college_admission;
USE college_admission;


CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY ,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'admin') DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  department VARCHAR(100),
  level VARCHAR(50)  -- e.g. "B.Tech", "B.Com" etc.
);


CREATE TABLE applications (
    id INT AUTO_INCREMENT PRIMARY KEY,

    student_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),

    course_id INT,

    photo_path VARCHAR(255),
    signature_path VARCHAR(255),
    marksheet10_path VARCHAR(255),
    marksheet12_path VARCHAR(255),
    entranceCard_path VARCHAR(255),
    idProof_path VARCHAR(255),

    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',

    documents_verified TINYINT(1) NOT NULL DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    admin_verified TINYINT(1) NOT NULL DEFAULT 0,
    faculty_verified TINYINT(1) NOT NULL DEFAULT 0,

    interview_date DATE,

    payment_status ENUM('pending','paid','failed') DEFAULT 'pending',
    payment_id VARCHAR(100),
    payment_amount INT DEFAULT 100,
    payment_date TIMESTAMP NULL,

    selection_status ENUM('none','selected','waitlisted','rejected') DEFAULT 'none',

    FOREIGN KEY (course_id) REFERENCES courses(id)
);

CREATE TABLE additional_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    status ENUM('requested','submitted') DEFAULT 'requested',
    file_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id)
);

