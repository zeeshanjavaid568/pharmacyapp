const db = require('../config/db');

class Dues {
  // GIVEN DUES CONTROLLER START SECTION

  static async getAllGiveDues() {
    const [rows] = await db.query('SELECT * FROM dues ORDER BY date ASC, id ASC');
    return rows;
  }

  static async getByIdGiveDues(id) {
    const [rows] = await db.query('SELECT * FROM dues WHERE id = ?', [id]);
    return rows[0];
  }

  static async createGiveDues(data) {
    const { khata_name, name, single_piece_price, m_pieces, total_piece, o_pieces, given_dues, taken_dues, date } = data;
    const query = 'INSERT INTO dues (khata_name, name, single_piece_price, m_pieces, total_piece, o_pieces, given_dues, taken_dues, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const [result] = await db.query(query, [khata_name || 'All Khatas', name, single_piece_price, m_pieces, total_piece, o_pieces, given_dues, taken_dues, date]);
    return { insertId: result.insertId, ...data };
  }

  static async updateDues(id, data) {
    const { name, single_piece_price, m_pieces, total_piece, o_pieces, given_dues, taken_dues, date } = data;
    const query = `
      UPDATE dues 
      SET name = ?, single_piece_price = ?, m_pieces = ?, total_piece = ?, o_pieces = ?, given_dues = ?, taken_dues = ?, date = ? 
      WHERE id = ?
    `;
    const [result] = await db.query(query, [name, single_piece_price, m_pieces, total_piece, o_pieces, given_dues, taken_dues, date, id]);
    return result.affectedRows > 0;
  }

  static async deleteGiveDues(id) {
    const query = 'DELETE FROM dues WHERE id = ?';
    const [result] = await db.query(query, [id]);
    return result.affectedRows > 0;
  }

  // ✅ ADDED: Rename Khata method
  static async renameKhata(oldKhataName, newKhataName) {
    // Validate input
    if (!oldKhataName || !newKhataName) {
      throw new Error('Both old and new khata names are required');
    }

    if (oldKhataName.trim() === newKhataName.trim()) {
      throw new Error('New khata name must be different from old name');
    }

    if (oldKhataName.trim() === '' || newKhataName.trim() === '') {
      throw new Error('Khata name cannot be empty');
    }

    // Get a connection from the pool for transaction
    const connection = await db.getConnection();

    try {
      // Start transaction using connection.query (not execute)
      await connection.query('START TRANSACTION');

      // Check if new khata name already exists
      const checkQuery = 'SELECT COUNT(*) as count FROM dues WHERE LOWER(khata_name) = LOWER(?)';
      const [checkResult] = await connection.query(checkQuery, [newKhataName.trim()]);
      
      if (checkResult[0].count > 0) {
        throw new Error(`Khata name "${newKhataName}" already exists`);
      }

      // Check if old khata exists
      const checkOldQuery = 'SELECT COUNT(*) as count FROM dues WHERE LOWER(khata_name) = LOWER(?)';
      const [checkOldResult] = await connection.query(checkOldQuery, [oldKhataName.trim()]);
      
      if (checkOldResult[0].count === 0) {
        throw new Error(`Khata "${oldKhataName}" not found`);
      }

      // Update khata name
      const updateQuery = 'UPDATE dues SET khata_name = ? WHERE LOWER(khata_name) = LOWER(?)';
      const [updateResult] = await connection.query(updateQuery, [newKhataName.trim(), oldKhataName.trim()]);

      // Commit transaction
      await connection.query('COMMIT');

      return {
        success: true,
        message: `Khata renamed successfully from "${oldKhataName}" to "${newKhataName}"`,
        affectedRows: updateResult.affectedRows
      };

    } catch (error) {
      // Rollback on error
      await connection.query('ROLLBACK');
      throw error;
    } finally {
      // Always release the connection back to the pool
      connection.release();
    }
  }

  // GIVEN DUES CONTROLLER END SECTION
}

module.exports = Dues;