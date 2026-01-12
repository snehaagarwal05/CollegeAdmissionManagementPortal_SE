DROP DATABASE IF EXISTS college_admission;
CREATE DATABASE college_admission;
USE college_admission;

-- Users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'admin') DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses table (ENHANCED with seats, eligibility, fees)
CREATE TABLE courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  department VARCHAR(100),
  level VARCHAR(50),
  total_seats INT DEFAULT 0,
  available_seats INT DEFAULT 0,
  eligibility_criteria TEXT,
  course_fees DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Applications table (ENHANCED with draft + multiple course preferences)
CREATE TABLE applications (
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- Draft functionality
    is_draft TINYINT(1) DEFAULT 0,
    
    -- Multiple course preferences
    course_preference_1 INT,
    course_preference_2 INT,
    course_preference_3 INT,

    -- Personal Information
    student_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    dob DATE,
    gender VARCHAR(20),
    category VARCHAR(50),

    -- Address Information
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),

    -- Academic Information (Legacy - for backward compatibility)
    course_id INT,
    qualification VARCHAR(100),
    percentage VARCHAR(20),
    examName VARCHAR(100),
    examRank VARCHAR(50),

    -- Guardian Information
    guardianName VARCHAR(100),
    guardianPhone VARCHAR(20),
    guardianRelation VARCHAR(50),

    -- Document paths
    photo_path VARCHAR(255),
    signature_path VARCHAR(255),
    marksheet10_path VARCHAR(255),
    marksheet12_path VARCHAR(255),
    entranceCard_path VARCHAR(255),
    idProof_path VARCHAR(255),

    -- Status fields
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    documents_verified TINYINT(1) NOT NULL DEFAULT 0,
    admin_verified TINYINT(1) NOT NULL DEFAULT 0,
    faculty_verified TINYINT(1) NOT NULL DEFAULT 0,

    -- Interview
    interview_date DATE,

    -- Payment
    payment_status ENUM('pending','paid','failed') DEFAULT 'pending',
    payment_id VARCHAR(100),
    payment_amount INT DEFAULT 100,
    payment_date TIMESTAMP NULL,

    -- Selection
    selection_status ENUM('none','selected','waitlisted','rejected') DEFAULT 'none',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (course_preference_1) REFERENCES courses(id),
    FOREIGN KEY (course_preference_2) REFERENCES courses(id),
    FOREIGN KEY (course_preference_3) REFERENCES courses(id)
);

-- Additional documents table
CREATE TABLE additional_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    status ENUM('requested','uploaded','submitted','approved') DEFAULT 'requested',
    file_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_at TIMESTAMP NULL,
    FOREIGN KEY (application_id) REFERENCES applications(id)
);

-- Portal students table
CREATE TABLE portal_students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO users (name, email, password_hash, role)
VALUES
('Admin User', 'admin@college.edu', '$2b$10$adminhashedpassword', 'admin'),
('Rahul Sharma', 'rahul.sharma@gmail.com', '$2b$10$studenthashedpassword1', 'student'),
('Sneha Verma', 'sneha.verma@gmail.com', '$2b$10$studenthashedpassword2', 'student');

-- Insert courses with NEW fields (seats, eligibility, fees)
INSERT INTO courses (name, department, level, total_seats, available_seats, eligibility_criteria, course_fees)
VALUES
('Computer Science & Engineering', 'Engineering', 'B.Tech', 120, 45, '10+2 with PCM, Min 60%, JEE Main qualified', 120000.00),
('Electronics & Communication', 'Engineering', 'B.Tech', 90, 30, '10+2 with PCM, Min 60%, JEE Main/WBJEE qualified', 115000.00),
('Business Administration', 'Management', 'BBA', 60, 25, '10+2 any stream, Min 50%', 80000.00),
('Computer Applications', 'IT', 'MCA', 45, 15, 'BCA/B.Sc CS, Min 55%', 95000.00);

-- Insert sample applications with course preferences
INSERT INTO applications (
  student_name, email, phone, dob, gender, category,
  address, city, state, pincode,
  course_id, course_preference_1, course_preference_2, course_preference_3,
  qualification, percentage, examName, examRank,
  guardianName, guardianPhone, guardianRelation,
  photo_path, signature_path, marksheet10_path, marksheet12_path,
  entranceCard_path, idProof_path,
  status, documents_verified, admin_verified, faculty_verified,
  interview_date, payment_status, payment_id, payment_amount,
  payment_date, selection_status, is_draft
)
VALUES
(
  'Rahul Sharma', 'rahul.sharma@gmail.com', '9876543210',
  '2005-03-15', 'Male', 'General',
  '123 MG Road, Sector 5', 'Kolkata', 'West Bengal', '700001',
  1, 1, 2, NULL,
  '10+2', '92%', 'JEE Main', '1250',
  'Mr. Sharma', '9876543211', 'Father',
  '/uploads/rahul_photo.jpg', '/uploads/rahul_signature.jpg',
  '/uploads/rahul_10th.pdf', '/uploads/rahul_12th.pdf',
  '/uploads/rahul_jee.pdf', '/uploads/rahul_aadhar.pdf',
  'pending', 1, 1, 0, '2026-02-10',
  'paid', 'pay_JEE123456', 100, '2026-01-05 10:30:00', 'selected', 0
),
(
  'Sneha Verma', 'sneha.verma@gmail.com', '9123456789',
  '2005-07-22', 'Female', 'OBC',
  '45 Park Street', 'Mumbai', 'Maharashtra', '400001',
  2, 2, 1, 4,
  '10+2', '88%', 'WBJEE', '2340',
  'Mrs. Verma', '9123456788', 'Mother',
  '/uploads/sneha_photo.jpg', '/uploads/sneha_signature.jpg',
  '/uploads/sneha_10th.pdf', '/uploads/sneha_12th.pdf',
  '/uploads/sneha_wbjee.pdf', '/uploads/sneha_pan.pdf',
  'approved', 1, 1, 1, '2026-02-12',
  'paid', 'pay_WBJEE654321', 100, '2026-01-06 15:45:00', 'waitlisted', 0
),
(
  'Amit Kumar', 'amit.kumar@gmail.com', '9988776655',
  '2005-11-10', 'Male', 'SC',
  '78 Civil Lines', 'Delhi', 'Delhi', '110001',
  3, 3, NULL, NULL,
  'Bachelor', '75%', 'CUET', '5600',
  'Mr. Kumar', '9988776656', 'Father',
  '/uploads/amit_photo.jpg', '/uploads/amit_signature.jpg',
  '/uploads/amit_10th.pdf', '/uploads/amit_12th.pdf',
  '/uploads/amit_cuet.pdf', '/uploads/amit_aadhar.pdf',
  'pending', 0, 0, 0, NULL,
  'pending', NULL, 100, NULL, 'none', 0
);

INSERT INTO additional_documents (application_id, reason, status, file_path)
VALUES
(1, 'Upload original 12th marksheet for verification', 'submitted', '/uploads/rahul_12th_original.pdf'),
(3, 'Upload income certificate for EWS verification', 'requested', NULL);

-- Verify data
SELECT * FROM users;
SELECT * FROM courses;
SELECT * FROM applications;
SELECT * FROM additional_documents;
SELECT * FROM portal_students;
