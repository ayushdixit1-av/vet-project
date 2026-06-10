const pool = require('../db/pool');

exports.getMedicines = async (req, res) => {
  try {
    const { search, category, species } = req.query;
    let query = 'SELECT * FROM medicines';
    const params = [];
    const conditions = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(name ILIKE $${params.length} OR generic_name ILIKE $${params.length} OR brand_names ILIKE $${params.length} OR indications ILIKE $${params.length})`);
    }
    if (category) {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }
    if (species) {
      params.push(species);
      conditions.push(`species ILIKE $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY name ASC';

    const result = await pool.query(query, params);
    res.json({ medicines: result.rows, total: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMedicineById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM medicines WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Medicine not found' });
    }
    res.json({ medicine: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createMedicine = async (req, res) => {
  try {
    const { name, generic_name, category, species, dosage, description, indications, contraindications, side_effects, brand_names } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const result = await pool.query(
      `INSERT INTO medicines (name, generic_name, category, species, dosage, description, indications, contraindications, side_effects, brand_names, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW()) RETURNING id`,
      [name, generic_name || '', category || '', species || '', dosage || '', description || '', indications || '', contraindications || '', side_effects || '', brand_names || '']
    );
    res.status(201).json({ message: 'Medicine created', id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, generic_name, category, species, dosage, description, indications, contraindications, side_effects, brand_names } = req.body;
    await pool.query(
      `UPDATE medicines SET
        name = COALESCE($1, name), generic_name = COALESCE($2, generic_name),
        category = COALESCE($3, category), species = COALESCE($4, species),
        dosage = COALESCE($5, dosage), description = COALESCE($6, description),
        indications = COALESCE($7, indications), contraindications = COALESCE($8, contraindications),
        side_effects = COALESCE($9, side_effects), brand_names = COALESCE($10, brand_names),
        updated_at = NOW()
       WHERE id = $11`,
      [name, generic_name, category, species, dosage, description, indications, contraindications, side_effects, brand_names, id]
    );
    res.json({ message: 'Medicine updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM medicines WHERE id = $1', [id]);
    res.json({ message: 'Medicine deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
