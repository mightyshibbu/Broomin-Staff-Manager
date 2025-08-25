-- Add index for better query performance on attendance table
USE broomin_db;

-- Add index for employee_id and date (we already have a UNIQUE constraint on this combination)
-- This index will help with queries filtering by date range or specific employee
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance (employee_id, date);

-- Add index for date alone to speed up date-based queries
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance (date);
