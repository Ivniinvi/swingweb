const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: 'swingwebinterface',
  host: 'localhost',
  database: 'swing',
  password: 'swingpass',
  port: 5432,
});

// Authentication middleware
const authenticate = (req, res, next) => {
  const lastLoginTime = req.headers['last-login-time'];
  
  if (!lastLoginTime) {
    return res.status(401).json({ error: 'Unauthorized', reason: 'No login timestamp' });
  }

  const lastLogin = new Date(lastLoginTime);
  const now = new Date();
  const hoursSinceLogin = (now - lastLogin) / (1000 * 60 * 60);

  if (hoursSinceLogin > 24) {
    return res.status(401).json({ error: 'Unauthorized', reason: 'Login expired' });
  }

  // Your existing authentication logic here
  const isAuthenticated = true; // Replace this with actual authentication check
  if (isAuthenticated) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Admin authentication middleware
const adminAuth = async (req, res, next) => {
  const { adminPassword } = req.body;
  if (!adminPassword) {
    return res.status(401).json({ error: 'Admin password required' });
  }

  try {
    const result = await pool.query('SELECT adminpassword FROM swingdb.auth_table LIMIT 1');
    if (result.rows.length === 0) {
      return res.status(500).json({ error: 'Admin password not set' });
    }

    const isMatch = adminPassword === result.rows[0].adminpassword;
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid admin password' });
    }

    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

app.get('/api/checkauth', authenticate, (req, res) => {
  res.json({ success: true });
});

// Fetch terms route
app.get('/api/terms', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT name, validuntil FROM swingdb.waiverterms WHERE validuntil IS NULL OR validuntil >= CURRENT_DATE');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching terms:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Fetch payment terms route
app.get('/api/paymentterms', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT name, amount, validuntil FROM swingdb.paymentterms WHERE validuntil IS NULL OR validuntil >= CURRENT_DATE');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching payment terms:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Create waiver route
app.post('/api/waivers', authenticate, async (req, res) => {
  const { termName, puid } = req.body;
  
  if (!termName || !puid) {
    return res.status(400).json({ error: 'Term name and PUID are required' });
  }

  try {
    // Get the end date for the selected term
    const termResult = await pool.query('SELECT validuntil FROM swingdb.waiverterms WHERE name = $1', [termName]);
    
    if (termResult.rows.length === 0) {
      return res.status(404).json({ error: 'Term not found' });
    }

    const validUntil = termResult.rows[0].validuntil;

    // Insert new waiver entry
    const insertResult = await pool.query(
      'INSERT INTO swingdb.waivers (puid, validuntil, signedon) VALUES ($1, $2, $3) RETURNING *',
      [puid, validUntil, new Date()]
    );

    res.json(insertResult.rows[0]);
  } catch (error) {
    console.error('Error creating waiver:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Create payment route
app.post('/api/payments', authenticate, async (req, res) => {
  const { termName, puid } = req.body;
  
  if (!termName || !puid) {
    return res.status(400).json({ error: 'Term name and PUID are required' });
  }

  try {
    // Get the amount for the selected term
    const termResult = await pool.query('SELECT amount, validuntil FROM swingdb.paymentterms WHERE name = $1', [termName]);
    
    if (termResult.rows.length === 0) {
      return res.status(404).json({ error: 'Term not found' });
    }

    const amount = termResult.rows[0].amount;
    const validUntil = termResult.rows[0].validuntil;

    // Insert new payment entry
    const insertResult = await pool.query(
      'INSERT INTO swingdb.payments (puid, amount, date, validuntil) VALUES ($1, $2, $3, $4) RETURNING *',
      [puid, amount, new Date(), validUntil]
    );

    res.json(insertResult.rows[0]);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Create or update member route
app.post('/api/members', authenticate, async (req, res) => {
  const { puid, name, email } = req.body;
  
  if (!puid) {
    return res.status(400).json({ error: 'PUID is required' });
  }

  try {
    // Check if member exists
    const existingMember = await pool.query('SELECT * FROM swingdb.members WHERE puid = $1', [puid]);
    
    if (existingMember.rows.length === 0) {
      // Create new member
      const insertResult = await pool.query(
        'INSERT INTO swingdb.members (puid, name, email) VALUES ($1, $2, $3) RETURNING *',
        [puid, name, email]
      );
      res.json({ message: 'New member created', member: insertResult.rows[0] });
    } else {
      // Update existing member
      const updateFields = [];
      const updateValues = [puid];
      let queryIndex = 2;

      if (name) {
        updateFields.push(`name = $${queryIndex}`);
        updateValues.push(name);
        queryIndex++;
      }
      if (email) {
        updateFields.push(`email = $${queryIndex}`);
        updateValues.push(email);
      }

      if (updateFields.length > 0) {
        const updateQuery = `UPDATE swingdb.members SET ${updateFields.join(', ')} WHERE puid = $1 RETURNING *`;
        const updateResult = await pool.query(updateQuery, updateValues);
        res.json({ message: 'Member updated', member: updateResult.rows[0] });
      } else {
        res.json({ message: 'No updates required', member: existingMember.rows[0] });
      }
    }
  } catch (error) {
    console.error('Error creating/updating member:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Update the login route
app.post('/api/login', async (req, res) => {
  const { password } = req.body;
  
  try {
    // Fetch the stored password from the auth_table
    const result = await pool.query('SELECT password FROM swingdb.auth_table LIMIT 1');
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Authentication failed' });
    }

    const storedPassword = result.rows[0].password;

    // Compare the provided password with the stored password
    if (password === storedPassword) {
      res.json({ success: true });
    } else {
      res.status(401).json({ error: 'Incorrect password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Check member status route
app.post('/api/checkmember', authenticate, async (req, res) => {
  const { puid } = req.body;
  
  if (!puid) {
    return res.status(400).json({ error: 'PUID is required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if member exists and get their name
    const memberResult = await client.query('SELECT name FROM swingdb.members WHERE puid = $1', [puid]);
    
    if (memberResult.rows.length === 0) {
      await client.query('INSERT INTO swingdb.signins (puid, timestamp, admitted) VALUES ($1, CURRENT_TIMESTAMP, false)', [puid]);
      await client.query('COMMIT');
      return res.json({ status: 'not_found', message: 'Member not found. Please sign a waiver.' });
    }

    const memberName = memberResult.rows[0].name;

    // Check for valid waiver
    const waiverResult = await client.query('SELECT * FROM swingdb.waivers WHERE puid = $1 AND validuntil >= CURRENT_DATE', [puid]);
    const hasValidWaiver = waiverResult.rows.length > 0;

    // Check for valid payment
    const paymentResult = await client.query('SELECT * FROM swingdb.payments WHERE puid = $1 AND validuntil >= CURRENT_DATE', [puid]);
    const hasValidPayment = paymentResult.rows.length > 0;

    if (hasValidWaiver && !hasValidPayment) {
      // Check for existing warning
      const warningResult = await client.query('SELECT * FROM swingdb.warnings WHERE puid = $1 ORDER BY timestamp DESC LIMIT 1', [puid]);
      
      if (warningResult.rows.length > 0) {
        const lastWarning = warningResult.rows[0];
        const warningAge = new Date() - new Date(lastWarning.timestamp);
        const warningAgeHours = warningAge / (1000 * 60 * 60);

        if (warningAgeHours <= 24) {
          // Warning is within 24 hours, admit without creating a new warning
          await client.query('INSERT INTO swingdb.signins (puid, timestamp, admitted) VALUES ($1, CURRENT_TIMESTAMP, true)', [puid]);
          await client.query('COMMIT');
          return res.json({ status: 'warning_active', message: 'Member admitted. Please pay soon.', name: memberName });
        } else {
          // Warning is older than 24 hours, do not admit
          await client.query('INSERT INTO swingdb.signins (puid, timestamp, admitted) VALUES ($1, CURRENT_TIMESTAMP, false)', [puid]);
          await client.query('COMMIT');
          return res.json({ status: 'warning_expired', message: 'Previous warning expired. Entry not allowed. Please pay to regain access.', name: memberName });
        }
      } else {
        // No previous warning, create a new one and admit
        await client.query('INSERT INTO swingdb.warnings (puid, timestamp) VALUES ($1, CURRENT_TIMESTAMP)', [puid]);
        await client.query('INSERT INTO swingdb.signins (puid, timestamp, admitted) VALUES ($1, CURRENT_TIMESTAMP, true)', [puid]);
        await client.query('COMMIT');
        return res.json({ status: 'warning_issued', message: 'Warning issued. Member allowed entry this time. Please pay soon.', name: memberName });
      }
    }

    // Add entry to signins table
    await client.query('INSERT INTO swingdb.signins (puid, timestamp, admitted) VALUES ($1, CURRENT_TIMESTAMP, $2)', [puid, hasValidWaiver && hasValidPayment]);

    await client.query('COMMIT');

    if (hasValidWaiver && hasValidPayment) {
      return res.json({ status: 'active', message: 'Member has a valid waiver and payment.', name: memberName });
    } else if (hasValidWaiver) {
      return res.json({ status: 'unpaid', message: 'Member has a valid waiver but needs to pay.', name: memberName });
    } else if (hasValidPayment) {
      return res.json({ status: 'no_waiver', message: 'Member has paid but needs to sign a waiver.', name: memberName });
    } else {
      return res.json({ status: 'inactive', message: 'Member needs to sign a waiver and pay.', name: memberName });
    }

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error checking member status:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  } finally {
    client.release();
  }
});

// Admin routes
app.post('/api/admin/auth', adminAuth, async (req, res) => {
  res.json({ success: true });
});



app.post('/api/admin/viewtable', adminAuth, async (req, res) => {
  const { tableName } = req.body;
  try {
    // First, get the column information for the table
    const columnInfoQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'swingdb' AND table_name = $1
    `;
    const columnInfo = await pool.query(columnInfoQuery, [tableName]);

    // Construct the SELECT part of the query
    const selectParts = columnInfo.rows.map(col => {
      if (col.data_type === 'boolean') {
        return `(CASE WHEN ${col.column_name} IS NULL THEN NULL ELSE ${col.column_name}::text END) AS ${col.column_name}`;
      }
      return col.column_name;
    });

    // Construct and execute the final query
    const query = `SELECT ${selectParts.join(', ')} FROM swingdb.${tableName}`;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching table:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/admin/addterm', adminAuth, async (req, res) => {
  const { termType, name, amount, validUntil } = req.body;
  try {
    let query;
    let values;
    if (termType === 'payment') {
      query = `INSERT INTO swingdb.${termType}terms (name, amount, validuntil) VALUES ($1, $2, $3) RETURNING *`;
      values = [name, amount, validUntil];
    } else {
      query = `INSERT INTO swingdb.${termType}terms (name, validuntil) VALUES ($1, $2) RETURNING *`;
      values = [name, validUntil];
    }
    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error adding term:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/admin/changepassword', adminAuth, async (req, res) => {
  const { type, value } = req.body;
  try {
    await pool.query(`UPDATE swingdb.auth_table SET ${type} = $1`, [value]);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Attendance route
app.post('/api/admin/attendance', adminAuth, async (req, res) => {
  const { date } = req.body;
  
  if (!date) {
    return res.status(400).json({ error: 'Date is required' });
  }

  try {
    const query = `
      SELECT m.name, s.puid, s.timestamp
      FROM swingdb.signins s
      LEFT JOIN swingdb.members m ON s.puid = m.puid
      WHERE DATE(s.timestamp) = $1
      ORDER BY s.timestamp
    `;
    const result = await pool.query(query, [date]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});