-- Add missing columns to employees table
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS age INT,
ADD COLUMN IF NOT EXISTS place VARCHAR(100) AFTER area,
ADD COLUMN IF NOT EXISTS salary DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS job_time_from TIME,
ADD COLUMN IF NOT EXISTS job_time_to TIME,
ADD COLUMN IF NOT EXISTS joining_date DATE,
ADD COLUMN IF NOT EXISTS total_leaves INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS status ENUM('active', 'inactive') DEFAULT 'active';

-- Update existing records with default values if needed
UPDATE employees SET
    age = 25,
    place = 'Unknown',
    salary = 0.00,
    job_time_from = '09:00:00',
    job_time_to = '18:00:00',
    joining_date = CURDATE(),
    status = 'active'
WHERE age IS NULL;
