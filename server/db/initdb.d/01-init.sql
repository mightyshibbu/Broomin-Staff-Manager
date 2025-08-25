-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS broomin_db;

-- Use the database
USE broomin_db;

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    area VARCHAR(100),
    contact VARCHAR(50),
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    status ENUM('present', 'absent', 'half_day', 'leave') NOT NULL,
    check_in TIME,
    check_out TIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE KEY unique_attendance (employee_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data (optional)
INSERT IGNORE INTO employees (id, name, area, contact, image_url) VALUES
('EMP001', 'John Doe', 'Housekeeping', '1234567890', 'https://example.com/images/john.jpg'),
('EMP002', 'Jane Smith', 'Kitchen', '0987654321', 'https://example.com/images/jane.jpg');

-- Create a user with privileges (if not using the root user)
CREATE USER IF NOT EXISTS 'broomin_user'@'%' IDENTIFIED BY 'broomin_password';
GRANT ALL PRIVILEGES ON broomin_db.* TO 'broomin_user'@'%';
FLUSH PRIVILEGES;
