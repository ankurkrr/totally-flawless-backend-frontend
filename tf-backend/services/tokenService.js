const conn = require('../connection/database');
const jwt = require('jsonwebtoken');
const KeyProvider = require('../utils/keyProvider');
const { promisify } = require('util');

// Convert callback-based query to promise
const query = promisify(conn.query).bind(conn);

module.exports.CreateToken = async (req, res) => {
  const { id, otp, userType, phone } = req.body;
  
  try {
    let rawQuery = '';
    let queryParam = null;
    
    // Support both old format (id + userType) and new format (phone)
    if (phone) {
      // New format: use phone to find user
      rawQuery = `SELECT * FROM users WHERE phone = ?`;
      queryParam = phone;
    } else if (id && userType) {
      // Old format: use id and userType
      if (userType == 1) {
        rawQuery = `SELECT * FROM users WHERE id = ?`;
      } else {
        rawQuery = `SELECT * FROM artists WHERE id = ?`;
      }
      queryParam = id;
    } else {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Either (phone) or (id + userType) is required' 
      });
    }

    if (!otp) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'OTP is required' 
      });
    }

    // Execute query with parameterized values to prevent SQL injection
    const rows = await query(rawQuery, [queryParam]);

    if (rows.length === 0) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'User not found' 
      });
    }

    const user = rows[0];
    
    // Verify OTP (convert both to string for comparison)
    if (String(user.otp) !== String(otp)) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'OTP does not match.' 
      });
    }

    // Get JWT secret from KeyProvider (supports dynamic key management)
    // KeyProvider now handles fallback automatically, but we catch any remaining errors
    let jwtSecret;
    try {
      jwtSecret = await KeyProvider.getJWTSecret();
    } catch (error) {
      // Final fallback - if KeyProvider fails, try direct env var access
      // Suppress warning in test environment (expected behavior)
      if (process.env.NODE_ENV !== 'test') {
        console.warn('⚠️  KeyProvider failed, using direct JWT_SECRET from environment variables.');
      }
      jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return res.status(500).json({ 
          status: 'error',
          message: 'JWT_SECRET not found. Please set JWT_SECRET in .env file or set up Key Management System.'
        });
      }
    }
    
    // Generate JWT token
    const payload = {
      id: user.id,
      userId: user.id,
      phone: user.phone || user.mobile,
      userType: userType || 1
    };
    
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '7d' });

    // Return success response with token
    return res.status(200).json({ 
      status: 'success', 
      message: 'Login successfully.',
      data: {
        _id: user.id,
        id: user.id,
        phone: user.phone || user.mobile,
        accessToken: token,
        ...user
      }
    });
    
  } catch (err) {
    console.error('Error in CreateToken:', err);
    return res.status(500).json({ 
      status: 'error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
    });
  }
};
