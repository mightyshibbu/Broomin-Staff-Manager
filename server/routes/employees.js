const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all employees with optional filtering
router.get('/', async (req, res) => {
  const { status } = req.query;
  let query = 'SELECT * FROM employees';
  const params = [];
  
  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY name';
  
  try {
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ 
      error: 'Error fetching employees',
      details: error.message 
    });
  }
});

// Get employee by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ error: 'Error fetching employee' });
  }
});

// Create new employee
router.post('/', async (req, res) => {
  // Handle both camelCase and snake_case field names
  const { 
    name, 
    age, 
    place, 
    salary, 
    job_time_from, 
    jobTimeFrom,
    job_time_to,
    jobTimeTo,
    joining_date,
    joiningDate,
    total_leaves = 0,
    totalLeaves,
    status = 'active',
    contact,
    image_url,
    imageUrl
  } = req.body;
  
  // Use camelCase values if provided, fall back to snake_case
  const jobTimeFromFinal = jobTimeFrom || job_time_from;
  const jobTimeToFinal = jobTimeTo || job_time_to;
  const joiningDateFinal = joiningDate || joining_date;
  const totalLeavesFinal = totalLeaves || total_leaves;
  const imageUrlFinal = imageUrl || image_url;
  
  if (!name || !place || !jobTimeFromFinal || !jobTimeToFinal || !joiningDateFinal) {
    return res.status(400).json({ 
      error: 'Name, place, job time (from/to), and joining date are required' 
    });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO employees (
        name, age, place, salary, job_time_from, job_time_to, 
        joining_date, total_leaves, status, contact, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        age || null,
        place,
        salary || 0,
        jobTimeFromFinal,
        jobTimeToFinal,
        joiningDateFinal,
        totalLeavesFinal,
        status,
        contact || null,
        imageUrlFinal || null
      ]
    );
    
    // Get the created employee
    const [employee] = await db.query('SELECT * FROM employees WHERE id = ?', [result.insertId]);
    
    res.status(201).json(employee[0]);
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ 
      error: 'Error creating employee',
      details: error.message 
    });
  }
});

// Update employee
router.put('/:id', async (req, res) => {
  // Handle both camelCase and snake_case field names
  const { 
    name, 
    age, 
    place, 
    salary, 
    job_time_from, 
    jobTimeFrom,
    job_time_to,
    jobTimeTo,
    joining_date,
    joiningDate,
    total_leaves,
    totalLeaves,
    status
  } = req.body;
  
  // Use camelCase values if provided, fall back to snake_case
  const jobTimeFromFinal = jobTimeFrom || job_time_from;
  const jobTimeToFinal = jobTimeTo || job_time_to;
  const joiningDateFinal = joiningDate || joining_date;
  const totalLeavesFinal = totalLeaves || total_leaves;
  
  try {
    // First check if employee exists
    const [existing] = await db.query('SELECT id FROM employees WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Format the joining_date to YYYY-MM-DD if it exists
    const formattedJoiningDate = joiningDateFinal 
      ? new Date(joiningDateFinal).toISOString().split('T')[0]
      : null;
    
    const [result] = await db.query(
      `UPDATE employees SET 
        name = COALESCE(?, name),
        age = COALESCE(?, age),
        place = COALESCE(?, place),
        salary = COALESCE(?, salary),
        job_time_from = COALESCE(?, job_time_from),
        job_time_to = COALESCE(?, job_time_to),
        joining_date = COALESCE(?, joining_date),
        total_leaves = COALESCE(?, total_leaves),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        name, 
        age, 
        place, 
        salary, 
        jobTimeFromFinal, 
        jobTimeToFinal, 
        formattedJoiningDate, 
        totalLeavesFinal, 
        status, 
        req.params.id
      ]
    );
    
    // Get the updated employee
    const [employee] = await db.query('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    
    res.json(employee[0]);
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ 
      error: 'Error updating employee',
      details: error.message 
    });
  }
});

// Delete employee
router.delete('/:id', async (req, res) => {
  try {
    // First check if employee exists
    const [existing] = await db.query('SELECT id FROM employees WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Option 1: Soft delete (recommended)
    // await db.query('UPDATE employees SET status = "inactive", deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [req.params.id]);
    
    // Option 2: Hard delete (use with caution)
    await db.query('DELETE FROM attendance WHERE employee_id = ?', [req.params.id]);
    const [result] = await db.query('DELETE FROM employees WHERE id = ?', [req.params.id]);
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ 
      error: 'Error deleting employee',
      details: error.message 
    });
  }
});

// Get employee salaries for a given month
router.get('/salaries/monthly', async (req, res) => {
  const { year, month } = req.query;
  
  if (!year || !month) {
    return res.status(400).json({ error: 'Year and month are required' });
  }

  try {
    // Get the first and last day of the month
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const endDate = `${year}-${month.padStart(2, '0')}-${lastDay}`;

    // Get all active employees with their attendance for the month
    const [employees] = await db.query(
      `SELECT 
        e.id,
        e.name,
        e.salary,
        COUNT(CASE WHEN a.status = 'Present' THEN 1 END) as present_days,
        COUNT(CASE WHEN a.status = 'FH' OR a.status = 'SH' THEN 1 END) as half_days,
        COUNT(a.status) as total_working_days
      FROM employees e
      LEFT JOIN attendance a ON e.id = a.employee_id 
        AND a.date BETWEEN ? AND ?
      WHERE e.status = 'active'
      GROUP BY e.id, e.name, e.salary
      ORDER BY e.name`,
      [startDate, endDate]
    );

    // Calculate net salary for each employee
    const salaries = employees.map(employee => {
      const workingDays = new Date(parseInt(year), parseInt(month), 0).getDate();
      const dailyRate = employee.salary / workingDays;
      const presentAmount = employee.present_days * dailyRate;
      const halfDayAmount = employee.half_days * dailyRate * 0.5;
      const netSalary = presentAmount + halfDayAmount;

      return {
        id: employee.id,
        name: employee.name,
        workingDays: workingDays,
        presentDays: employee.present_days,
        halfDays: employee.half_days,
        dailyRate: parseFloat(dailyRate.toFixed(2)),
        salary: employee.salary,
        netSalary: Math.round(netSalary * 100) / 100 // Round to 2 decimal places
      };
    });

    res.json(salaries);
  } catch (error) {
    console.error('Error calculating salaries:', error);
    res.status(500).json({ 
      error: 'Error calculating salaries',
      details: error.message 
    });
  }
});

module.exports = router;
