const db = require('../config/db');

class Dues {

  // GIVEN DUES CONTROLLER START SECTION

  static async getAllGiveDues() {
    const [rows] = await db.query('SELECT * FROM dues');
    return rows;
  }

  static async getByIdGiveDues(id) {
    const [rows] = await db.query('SELECT * FROM dues WHERE id = ?', [id]);
    return rows[0];
  }

  static async createGiveDues(data) {
    const {khata_name, name, single_piece_price, m_pieces, total_piece, o_pieces, given_dues, taken_dues, date } = data;
    const query = 'INSERT INTO dues ( khata_name, name, single_piece_price, m_pieces, total_piece, o_pieces, given_dues, taken_dues, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const [result] = await db.query(query, [ khata_name, name, single_piece_price, m_pieces, total_piece, o_pieces, given_dues, taken_dues, date]);
    return { insertId: result.insertId, ...data }; // Return the inserted record
  }

  static async updateDues(id, data) {
    const { name, single_piece_price, m_pieces, total_piece, o_pieces, given_dues, taken_dues, date } = data;
    const query = `
      UPDATE dues 
      SET name = ?, single_piece_price = ?, m_pieces = ?,  total_piece = ?, o_pieces = ?, given_dues = ?, taken_dues = ?, date = ? 
      WHERE id = ?
    `;
    const [result] = await db.query(query, [name, single_piece_price, m_pieces, total_piece, o_pieces, given_dues, taken_dues, date, id]);
    return result.affectedRows > 0; // Return true if rows were updated
  }

  static async deleteGiveDues(id) {
    const query = 'DELETE FROM dues WHERE id = ?';
    const [result] = await db.query(query, [id]);
    return result.affectedRows > 0; // Return true if rows were deleted
  }

  // GIVEN DUES CONTROLLER END SECTION

  


}

module.exports = Dues;
