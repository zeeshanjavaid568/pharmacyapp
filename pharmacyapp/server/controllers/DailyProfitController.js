const db = require('../config/db');

class DailyProfit {
  static async getAll() {
    const [rows] = await db.query('SELECT * FROM daily_profit');
    return rows;
  }

  static async getById(id) {
    const [rows] = await db.query('SELECT * FROM daily_profit WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(data) {
    const { daily_profit, daily_total_buyer_items, daily_total_saler_items, date } = data;
    const query = 'INSERT INTO daily_profit (daily_profit, daily_total_buyer_items, daily_total_saler_items, date) VALUES (?, ?, ?, ?)';
    const [result] = await db.query(query, [daily_profit, daily_total_buyer_items, daily_total_saler_items, date]);
    return { insertId: result.insertId, ...data }; // Return the inserted record
  }

  static async update(id, data) {
    const { daily_profit, daily_total_buyer_items, daily_total_saler_items, date } = data;
    const query = `
      UPDATE daily_profit 
      SET daily_profit = ?,daily_total_buyer_items = ?, daily_total_saler_items = ?, date = ? 
      WHERE id = ?
    `;
    const [result] = await db.query(query, [daily_profit, daily_total_buyer_items, daily_total_saler_items, date, id]);
    return result.affectedRows > 0; // Return true if rows were updated
  }

  static async delete(id) {
    const query = 'DELETE FROM daily_profit WHERE id = ?';
    const [result] = await db.query(query, [id]);
    return result.affectedRows > 0; // Return true if rows were deleted
  }
}

module.exports = DailyProfit;
