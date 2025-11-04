const db = require('../config/db');

class MonthlyProfit {
  static async getAll() {
    const [rows] = await db.query('SELECT * FROM monthly_profit');
    return rows;
  }

  static async getById(id) {
    const [rows] = await db.query('SELECT * FROM monthly_profit WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(data) {
    const { monthly_profit, date } = data;
    const query = 'INSERT INTO monthly_profit (monthly_profit, date) VALUES (?, ?)';
    const [result] = await db.query(query, [monthly_profit, date]);
    return { insertId: result.insertId, ...data }; // Return the inserted record
  }

  static async update(id, data) {
    const { monthly_profit, date } = data;
    const query = `
      UPDATE monthly_profit 
      SET monthly_profit = ?, date = ? 
      WHERE id = ?
    `;
    const [result] = await db.query(query, [monthly_profit, date, id]);
    return result.affectedRows > 0; // Return true if rows were updated
  }

  static async delete(id) {
    const query = 'DELETE FROM monthly_profit WHERE id = ?';
    const [result] = await db.query(query, [id]);
    return result.affectedRows > 0; // Return true if rows were deleted
  }
}

module.exports = MonthlyProfit;
