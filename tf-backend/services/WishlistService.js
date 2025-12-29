const conn = require('../connection/database');
const { contactUsMail } = require("../connection/sendmail");

module.exports.AddWishlist = async (req, res) => {
  const { user_id, artist_id } = req.body;

  if (!user_id || !artist_id) {
    return res.status(400).json({ error: 'user_id and artist_id are required' });
  }
  console.log("tsse");

  try {
    const checkQuery = `
            SELECT id 
            FROM wishlist 
            WHERE user_id = ? AND artist_id = ?`;

    const [existingEntry] = await conn.promise().query(checkQuery, [user_id, artist_id]);

    if (existingEntry.length > 0) {
      return res.status(409).json({ error: 'Artist is already in the wishlist' });
    }

    const insertQuery = `
            INSERT INTO wishlist (user_id, artist_id, created_at) 
            VALUES (?, ?, NOW())`;

    await conn.promise().query(insertQuery, [user_id, artist_id]);

    res.status(200).json({ status: 'success', message: 'Artist added to wishlist' });
  } catch (err) {
    console.error('Error adding to wishlist:', err);
    res
  }
};

module.exports.GetWishlist = async (req, res) => {
  const { user_id } = req.query;

  try {
    let query = `
            SELECT 
                w.id AS wishlist_id,
                w.user_id,
                w.artist_id,
                w.created_at,
                a.firstName AS artist_first_name,
                a.lastName AS artist_last_name,
                a.email AS artist_email,
                a.mobile AS artist_mobile,
                a.businessType AS artist_business_type,
                a.profileImage AS artist_profile_image
            FROM 
                wishlist w
            JOIN 
                artists a ON w.artist_id = a.id 
            WHERE w.user_id = ?
        `;

    const [result] = await conn.promise().query(query, [user_id ?? ""]);

    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'No wishlist data found' });
    }

    res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    console.error('Error fetching wishlist:', err);
    res.status(500).json({ error: 'An error occurred while fetching wishlist' });
  }
};

module.exports.RemoveWishlist = async (req, res) => {
  const { user_id, artist_id } = req.query;

  if (!user_id || !artist_id) {
    return res.status(400).json({ error: 'user_id and artist_id are required' });
  }

  try {
    const checkQuery = `
            SELECT id 
            FROM wishlist 
            WHERE user_id = ? AND artist_id = ?`;

    const [existingEntry] = await conn.promise().query(checkQuery, [user_id, artist_id]);

    if (existingEntry.length === 0) {
      return res.status(404).json({ error: 'Artist not found in the wishlist' });
    }

    const deleteQuery = `
            DELETE FROM wishlist 
            WHERE user_id = ? AND artist_id = ?`;

    await conn.promise().query(deleteQuery, [user_id, artist_id]);

    res.status(200).json({ status: 'success', message: 'Artist removed from wishlist' });
  } catch (err) {
    console.error('Error removing from wishlist:', err);
    res.status(500).json({ error: 'An error occurred while removing the artist from the wishlist' });
  }
};

module.exports.ContactSendMain = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // ✅ Phone is optional now
    if (!name || !email || !subject || !message) {
      return res
        .status(400)
        .json({ message: "Name, email, subject and message are required." });
    }

    // Send to your support email
    contactUsMail("info@teamcom", subject, name, email, phone, message);

    return res
      .status(200)
      .json({ message: "Message sent successfully." });
  } catch (error) {
    console.error("Contact API Error:", error);
    return res
      .status(500)
      .json({ message: "Failed to send message." });
  }
};
