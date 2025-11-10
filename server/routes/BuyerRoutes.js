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
    // Validation - check required fields
    const requiredFields = ['product_name', 'saling_price', 'product_price', 'pieces_price', 'pieces', 'stock', 'expire_date', 'date'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: 'Missing required fields', 
        missingFields 
      });
    }

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

// All Data Update a Buyer Product - SPECIFICALLY FOR buyerAllDataUpdate API
router.put('/allproduct/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if product exists
    const existingProduct = await BuyerProducts.getById(id);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Buyer Product not found' });
    }

    // Validation for required fields
    const requiredFields = ['product_name', 'saling_price', 'product_price', 'pieces_price', 'pieces', 'stock', 'expire_date', 'date'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    // if (missingFields.length > 0) {
    //   return res.status(400).json({ 
    //     message: 'Missing required fields for complete update', 
    //     missingFields 
    //   });
    // }

    // Use the specific buyerAllDataUpdate method
    const updated = await BuyerProducts.buyerAllDataUpdate(id, req.body);
    
    if (!updated) {
      return res.status(404).json({ message: 'Buyer Product not found or no changes made' });
    }
    
    // Get the updated product to return
    const updatedProduct = await BuyerProducts.getById(id);
    
    res.json({ 
      message: 'Buyer Product completely updated successfully',
      product: updatedProduct 
    });
  } catch (error) {
    console.error('Error in buyerAllDataUpdate:', error);
    res.status(500).json({ 
      message: 'Failed to completely update Buyer Product', 
      error: error.message 
    });
  }
});

// Partial Update a Buyer Product (only stock)
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

// Get all Buyer Products Total Price
router.get('/products/totalprice', async (req, res) => {
  try {
    const products = await BuyerProducts.getAllDailyProductsTotalPice();
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch Buyer Products Total Price', error });
  }
});

// Create a new Buyer Product Total Price
router.post('/totalpriceproduct', async (req, res) => {
  try {
    const result = await BuyerProducts.createTotalPrice(req.body);
    res.status(201).json({
      message: 'Buyer Product Total Price created successfully',
      product: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create Buyer Product Total Price', error });
  }
});

// Delete a Buyer Product Total Price
router.delete('/product/totalprice/:id', async (req, res) => {
  try {
    const deleted = await BuyerProducts.deleteTotalPrice(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Buyer Product Total Price not found' });
    res.json({ message: 'Buyer Product Total Price deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete Buyer Product Total Price', error });
  }
});

module.exports = router;