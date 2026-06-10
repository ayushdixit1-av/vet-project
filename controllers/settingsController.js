const pool = require('../db/pool');
const path = require('path');
const fs = require('fs');

exports.getFounder = async (req, res) => {
  try {
    const keys = ['founder_name', 'founder_title', 'founder_desc', 'founder_image', 'founder_exp', 'founder_degree'];
    const result = await pool.query('SELECT key, value FROM site_settings WHERE key = ANY($1)', [keys]);
    const settings = {};
    result.rows.forEach(r => { settings[r.key] = r.value; });
    res.json({ founder: settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateFounder = async (req, res) => {
  try {
    const { name, title, description, experience, degree, image } = req.body;
    const updates = [];
    if (name !== undefined) updates.push(['founder_name', name]);
    if (title !== undefined) updates.push(['founder_title', title]);
    if (description !== undefined) updates.push(['founder_desc', description]);
    if (experience !== undefined) updates.push(['founder_exp', experience]);
    if (degree !== undefined) updates.push(['founder_degree', degree]);
    if (image !== undefined) updates.push(['founder_image', image]);

    for (const [key, value] of updates) {
      await pool.query(
        'INSERT INTO site_settings (key, value, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()',
        [key, value]
      );
    }

    res.json({ message: 'Founder info updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const imageUrl = `/assets/${req.file.filename}`;
    await pool.query(
      'INSERT INTO site_settings (key, value, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()',
      ['founder_image', imageUrl]
    );
    res.json({ message: 'Image uploaded', imageUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.uploadCourseThumbnail = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const imageUrl = `/assets/${req.file.filename}`;
    res.json({ message: 'Thumbnail uploaded', imageUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};