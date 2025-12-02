const db = require('../config/db');

class SalerProducts {
  static async getAll() {
    const [rows] = await db.query('SELECT * FROM saler_products');
    return rows;
  }

  static async getById(id) {
    const [rows] = await db.query('SELECT * FROM saler_products WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(data) {
    const { product_name, product_place, product_price, pieces_price, stock, date } = data;
    const query = 'INSERT INTO saler_products (product_name, product_place, product_price, pieces_price, stock, date) VALUES (?, ?, ?, ?, ?, ?)';
    const [result] = await db.query(query, [product_name, product_place, product_price, pieces_price, stock, date]);
    return { insertId: result.insertId, ...data }; // Return the inserted record
  }

  static async update(id, data) {
    const { product_name, product_place, product_price, pieces_price, stock, date } = data;
    const query = `
      UPDATE saler_products 
      SET product_name = ?, product_place = ?, product_price = ?,pieces_price = ?, stock = ?, date = ? 
      WHERE id = ?
    `;
    const [result] = await db.query(query, [product_name, product_place, product_price, pieces_price, stock, date, id]);
    return result.affectedRows > 0; // Return true if rows were updated
  }

  static async delete(id) {
    const query = 'DELETE FROM saler_products WHERE id = ?';
    const [result] = await db.query(query, [id]);
    return result.affectedRows > 0; // Return true if rows were deleted
  }

  static async getAllSalerDailyTotalPrice() {
    const [rows] = await db.query('SELECT * FROM daily_seler_product_total_price');
    return rows;
  }

  static async createSalerDailyTotalPrice(data) {
    const {  daily_seler_product_total_price, date } = data;
    const query = 'INSERT INTO daily_seler_product_total_price ( daily_seler_product_total_price, date) VALUES ( ?, ?)';
    const [result] = await db.query(query, [ daily_seler_product_total_price, date]);
    return { insertId: result.insertId, ...data }; // Return the inserted record
  }

  static async deleteSalerDailyTotalPrice(id) {
    const query = 'DELETE FROM daily_seler_product_total_price WHERE id = ?';
    const [result] = await db.query(query, [id]);
    return result.affectedRows > 0; // Return true if rows were deleted
  }

}

module.exports = SalerProducts;
