const express = require('express');
const BuyerProducts = require('../controllers/BuyerController');

const router = express.Router();

// Get all Buyer Products
router.get('/products', async (req, res) => {
  try {
    const products = await BuyerProducts.getAll();
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch Buyer Products', error });
  }
});

// Get Buyer Product by ID
router.get('/product/:id', async (req, res) => {
  try {
    const product = await BuyerProducts.getById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Buyer Product not found' });
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch Buyer Product', error });
  }
});

// Create a new Buyer Product
router.post('/product', async (req, res) => {
  try {
    const result = await BuyerProducts.create(req.body);
    res.status(201).json({
      message: 'Buyer Product created successfully',
      product: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create Buyer Product', error });
  }
});

// Create a new Buyer Product
router.post('/totalpriceproduct', async (req, res) => {
  try {
    const result = await BuyerProducts.createTotalPrice(req.body);
    res.status(201).json({
      message: 'Buyer Product created successfully',
      product: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create Buyer Product', error });
  }
});

// Update a Buyer Product
router.put('/product/:id', async (req, res) => {
  try {
    const updated = await BuyerProducts.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'Buyer Product not found' });
    res.json({ message: 'Buyer Product updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update Buyer Product', error });
  }
});

// Delete a Buyer Product
router.delete('/product/:id', async (req, res) => {
  try {
    const deleted = await BuyerProducts.delete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Buyer Product not found' });
    res.json({ message: 'Buyer Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete Buyer Product', error });
  }
});

module.exports = router;
