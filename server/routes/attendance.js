const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Mark attendance
router.post('/', async (req, res) => {
  const { employee_id, status, date, check_in, check_out, notes } = req.body;

  if (!employee_id || !status || !date) {
    return res.status(400).json({ error: 'employee_id, status, and date are required' });
  }

  if (!['present', 'absent', 'half_day', 'leave'].includes(status)) {
    return res.status(400).json({ 
      error: 'Invalid status. Must be one of: present, absent, half_day, leave' 
    });
  }

  try {
    // Check if employee exists
    const [employee] = await db.query('SELECT id FROM employees WHERE id = ?', [employee_id]);
    if (employee.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Insert or update attendance
    const [result] = await db.query(
      `INSERT INTO attendance (employee_id, date, status, check_in, check_out, notes)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         status = VALUES(status),
         check_in = VALUES(check_in),
         check_out = VALUES(check_out),
         notes = VALUES(notes),
         updated_at = CURRENT_TIMESTAMP`,
      [employee_id, date, status, check_in || null, check_out || null, notes || null]
    );

    // Get the updated record
    const [record] = await db.query(
      'SELECT * FROM attendance WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(record[0] || { id: result.insertId, employee_id, date, status, check_in, check_out, notes });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ error: 'Error marking attendance', details: error.message });
  }
});

// Get attendance for a specific date
router.get('/', async (req, res) => {
  const { date } = req.query;
  
  if (!date) {
    return res.status(400).json({ error: 'Date parameter is required' });
  }

  try {
    const [rows] = await db.query(
      `SELECT a.*, e.name as employee_name, e.place
       FROM attendance a
       JOIN employees e ON a.employee_id = e.id
       WHERE a.date = ?
       ORDER BY e.name`,
      [date]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Error fetching attendance', details: error.message });
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

// Export attendance data to CSV
router.get('/export', async (req, res) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate parameters are required' });
  }

  try {
    const [rows] = await db.query(
      `SELECT 
        e.id as employee_id,
        e.name as employee_name,
        a.date,
        a.status,
        a.check_in,
        a.check_out,
        a.notes,
        a.created_at,
        a.updated_at
      FROM employees e
      LEFT JOIN attendance a ON e.id = a.employee_id 
        AND a.date BETWEEN ? AND ?
      WHERE a.date IS NOT NULL
      ORDER BY a.date, e.name`,
      [startDate, endDate]
    );

    // Convert to CSV
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No attendance records found for the specified date range' });
    }

    // Get headers from first row
    const headers = Object.keys(rows[0]);
    
    // Create CSV content
    let csvContent = headers.join(',') + '\r\n';
    
    rows.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] || '';
        // Escape quotes and wrap in quotes if contains comma or newline
        const escaped = ('' + value).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvContent += values.join(',') + '\r\n';
    });

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_${startDate}_to_${endDate}.csv`);
    
    // Send the CSV data
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting attendance:', error);
    res.status(500).json({ error: 'Error exporting attendance', details: error.message });
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
