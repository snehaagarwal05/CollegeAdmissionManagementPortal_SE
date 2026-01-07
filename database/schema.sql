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
  id INT AUTO_INCREMENT PRIMARY KEY ,
  student_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  course_id INT,
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  ,
  FOREIGN KEY (course_id) REFERENCES courses(id)
);