const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Mark attendance
router.post('/', async (req, res) => {
  const { employeeId, status, date } = req.body;

  if (!employeeId || !status || !date) {
    return res.status(400).json({ error: 'employeeId, status, and date are required' });
  }

  if (!['Present', 'Absent', 'FH', 'SH'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be one of: Present, Absent, FH, SH' });
  }

  try {
    // Check if employee exists
    const [employee] = await db.query('SELECT id FROM employees WHERE id = ?', [employeeId]);
    if (employee.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Insert or update attendance
    await db.query(
      `INSERT INTO attendance_records (employee_id, date, status)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status)`,
      [employeeId, date, status]
    );

    res.status(201).json({ employeeId, date, status });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ error: 'Error marking attendance' });
  }
});

// Get attendance for a specific date
router.get('/date/:date', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT e.id, e.name, ar.status, ar.date 
       FROM employees e
       LEFT JOIN attendance_records ar ON e.id = ar.employee_id AND ar.date = ?
       ORDER BY e.name`,
      [req.params.date]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Error fetching attendance' });
  }
});

// Get employee's attendance history
router.get('/employee/:employeeId', async (req, res) => {
  const { startDate, endDate } = req.query;
  
  let query = `
    SELECT ar.date, ar.status 
    FROM attendance_records ar
    WHERE ar.employee_id = ?
  `;
  
  const params = [req.params.employeeId];
  
  if (startDate && endDate) {
    query += ' AND ar.date BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }
  
  query += ' ORDER BY ar.date DESC';
  
  try {
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching attendance history:', error);
    res.status(500).json({ error: 'Error fetching attendance history' });
  }
});

// Get attendance summary for a date range
router.get('/summary', async (req, res) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required' });
  }
  
  try {
    const [rows] = await db.query(
      `SELECT 
        e.id as employee_id,
        e.name as employee_name,
        COUNT(CASE WHEN ar.status = 'Present' THEN 1 END) as present_days,
        COUNT(CASE WHEN ar.status = 'Absent' THEN 1 END) as absent_days,
        COUNT(CASE WHEN ar.status = 'FH' THEN 1 END) as half_days,
        COUNT(ar.status) as total_attended_days
      FROM employees e
      LEFT JOIN attendance_records ar ON e.id = ar.employee_id 
        AND ar.date BETWEEN ? AND ?
      GROUP BY e.id, e.name
      ORDER BY e.name`,
      [startDate, endDate]
    );
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching attendance summary:', error);
    res.status(500).json({ error: 'Error fetching attendance summary' });
  }
});

module.exports = router;
