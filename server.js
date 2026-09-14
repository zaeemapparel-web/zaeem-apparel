const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/admin', express.static('public'));
app.use(express.static('public'));
// Neon PostgreSQL Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.log('Database connection error:', err.message);
  } else {
    console.log('Neon PostgreSQL Connected Successfully');
    release();
  }
});

// ============================================
// ROUTES
// ============================================

// Test route
app.get('/', function(req, res) {
  res.json({ message: 'ZaeemWeb Backend Running' });
});

// GET all products
app.get('/api/products', async function(req, res) {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single product
app.get('/api/products/:id', async function(req, res) {
  try {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new product
app.post('/api/products', async function(req, res) {
  try {
    const { name, price, category, description, image, sizes, colors } = req.body;
    const result = await pool.query(
      'INSERT INTO products (name, price, category, description, image, sizes, colors) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, price, category || 'General', description || '', image || '', sizes || [], colors || []]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE product
app.delete('/api/products/:id', async function(req, res) {
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, function() {
  console.log('Server running on port ' + PORT);
});