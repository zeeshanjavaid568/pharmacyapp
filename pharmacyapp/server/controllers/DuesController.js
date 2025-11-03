const db = require('../config/db');

class Dues {

  // GIVEN DUES CONTROLLER START SECTION

  static async getAllGiveDues() {
    const [rows] = await db.query('SELECT * FROM give_dues');
    return rows;
  }

  static async getByIdGiveDues(id) {
    const [rows] = await db.query('SELECT * FROM give_dues WHERE id = ?', [id]);
    return rows[0];
  }

  static async createGiveDues(data) {
    const {  name, price, date } = data;
    const query = 'INSERT INTO give_dues ( name, price, date) VALUES (?, ?, ?)';
    const [result] = await db.query(query, [ name, price, date]);
    return { insertId: result.insertId, ...data }; // Return the inserted record
  }

  static async updateGiveDues(id, data) {
    const { name, price, date } = data;
    const query = `
      UPDATE give_dues 
      SET name = ?, price = ?, date = ? 
      WHERE id = ?
    `;
    const [result] = await db.query(query, [name, price, date, id]);
    return result.affectedRows > 0; // Return true if rows were updated
  }

  static async deleteGiveDues(id) {
    const query = 'DELETE FROM give_dues WHERE id = ?';
    const [result] = await db.query(query, [id]);
    return result.affectedRows > 0; // Return true if rows were deleted
  }

  // GIVEN DUES CONTROLLER END SECTION

  // TAKEN DUES CONTROLLER START SECTION

  static async getAllTakenDues() {
    const [rows] = await db.query('SELECT * FROM taken_dues');
    return rows;
  }

  static async createTakenDues(data) {
    const {  name, price, date } = data;
    const query = 'INSERT INTO taken_dues ( name, price, date) VALUES (?, ?, ?)';
    const [result] = await db.query(query, [ name, price, date]);
    return { insertId: result.insertId, ...data }; // Return the inserted record
  }

  static async deleteTakenDues(id) {
    const query = 'DELETE FROM taken_dues WHERE id = ?';
    const [result] = await db.query(query, [id]);
    return result.affectedRows > 0; // Return true if rows were deleted
  }

  // TAKEN DUES CONTROLLER END SECTION


}

module.exports = Dues;
