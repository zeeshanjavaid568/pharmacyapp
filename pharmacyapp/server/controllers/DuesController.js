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
    const {  khata_name, name, single_piece_price, total_piece, given_dues, taken_dues, price, date } = data;
    const query = 'INSERT INTO dues ( khata_name, name, single_piece_price, total_piece, given_dues, taken_dues, price, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const [result] = await db.query(query, [ khata_name, name, single_piece_price, total_piece, given_dues, taken_dues, price, date]);
    return { insertId: result.insertId, ...data }; // Return the inserted record
  }

  static async updateGiveDues(id, data) {
    const { name, price, date } = data;
    const query = `
      UPDATE dues 
      SET name = ?, price = ?, date = ? 
      WHERE id = ?
    `;
    const [result] = await db.query(query, [name, price, date, id]);
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
