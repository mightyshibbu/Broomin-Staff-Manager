const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all employees
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM employees ORDER BY name');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Error fetching employees' });
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
  const { id, name, area, contact, image_url } = req.body;
  
  if (!id || !name) {
    return res.status(400).json({ error: 'ID and name are required' });
  }

  try {
    await db.query(
      'INSERT INTO employees (id, name, area, contact, image_url) VALUES (?, ?, ?, ?, ?)',
      [id, name, area || null, contact || null, image_url || null]
    );
    res.status(201).json({ id, name, area, contact, image_url });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Employee with this ID already exists' });
    }
    console.error('Error creating employee:', error);
    res.status(500).json({ error: 'Error creating employee' });
  }
});

// Update employee
router.put('/:id', async (req, res) => {
  const { name, area, contact, image_url } = req.body;
  
  try {
    const [result] = await db.query(
      'UPDATE employees SET name = ?, area = ?, contact = ?, image_url = ? WHERE id = ?',
      [name, area || null, contact || null, image_url || null, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json({ id: req.params.id, name, area, contact, image_url });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ error: 'Error updating employee' });
  }
});

// Delete employee
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM employees WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: 'Error deleting employee' });
  }
});

module.exports = router;
