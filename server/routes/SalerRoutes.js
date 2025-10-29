const express = require('express');
const SalerProducts = require('../controllers/SalerController');

const router = express.Router();

// Get all Saler Products
router.get('/products', async (req, res) => {
  try {
    const products = await SalerProducts.getAll();
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch Saler Products', error });
  }
});

// Get Saler Product by ID
router.get('/product/:id', async (req, res) => {
  try {
    const product = await SalerProducts.getById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Saler Product not found' });
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch Saler Product', error });
  }
});

// Create a new Saler Product
router.post('/product', async (req, res) => {
  try {
    const result = await SalerProducts.create(req.body);
    res.status(201).json({
      message: 'Saler Product created successfully',
      product: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create Saler Product', error });
  }
});

// Update a Saler Product
router.put('/product/:id', async (req, res) => {
  try {
    const updated = await SalerProducts.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'Saler Product not found' });
    res.json({ message: 'Saler Product updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update Saler Product', error });
  }
});

// Delete a Saler Product
router.delete('/product/:id', async (req, res) => {
  try {
    const deleted = await SalerProducts.delete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Saler Product not found' });
    res.json({ message: 'Saler Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete Saler Product', error });
  }
});

module.exports = router;
