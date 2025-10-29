const db = require('../config/db');

class BuyerProducts {
  static async getAll() {
    const [rows] = await db.query('SELECT * FROM buyer_products');
    return rows;
  }

  static async getById(id) {
    const [rows] = await db.query('SELECT * FROM buyer_products WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(data) {
    const { product_name, product_price, pieces_price, pieces, stock, expire_date, date } = data;
    const query = 'INSERT INTO buyer_products (product_name, product_price, pieces_price, pieces, stock, expire_date, date) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const [result] = await db.query(query, [product_name, product_price, pieces_price, pieces, stock, expire_date, date]);
    return { insertId: result.insertId, ...data }; // Return the inserted record
  }

  static async update(id, data) {
    const { stock } = data;
    const query = `
      UPDATE buyer_products 
      SET stock = ? 
      WHERE id = ?
    `;
    const [result] = await db.query(query, [ stock, id]);
    return result.affectedRows > 0; // Return true if rows were updated
  }

  static async delete(id) {
    const query = 'DELETE FROM buyer_products WHERE id = ?';
    const [result] = await db.query(query, [id]);
    return result.affectedRows > 0; // Return true if rows were deleted
  }
}

module.exports = BuyerProducts;
