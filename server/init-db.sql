-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS broomin_db;

-- Use the database
USE broomin_db;

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    area VARCHAR(100),
    contact VARCHAR(20),
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    status ENUM('Present', 'Absent', 'FH', 'SH') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE KEY unique_attendance (employee_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create an index on employee_id for faster lookups
CREATE INDEX idx_attendance_employee_id ON attendance_records(employee_id);
CREATE INDEX idx_attendance_date ON attendance_records(date);

-- Insert sample data (optional)
INSERT IGNORE INTO employees (id, name, area, contact) VALUES
('1001', 'Neal Borah', 'Viman Nagar', '8778728172'),
('1002', 'Mansi Viman Nagar', 'Viman Nagar', '9876543210'),
('1003', 'Jatin Yadav', 'Viman Nagar', '7654321098'),
('1004', 'Meher Khan', 'Viman Nagar', '8765432109');
