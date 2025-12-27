const express = require('express');
const MonthlyProfitController = require('../controllers/MonthlyProfitController');

const router = express.Router();

// Get all Monthly Profits
router.get('/product', async (req, res) => {
  try {
    const monthlyProfits = await MonthlyProfitController.getAll();
    res.json(monthlyProfits);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch monthly profits', error });
  }
});

// Get a Monthly Profit by ID
router.get('/product/:id', async (req, res) => {
  try {
    const monthlyProfit = await MonthlyProfitController.getById(req.params.id);
    if (!monthlyProfit) return res.status(404).json({ message: 'Monthly profit not found' });
    res.json(monthlyProfit);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch monthly profit', error });
  }
});

// Create a new Monthly Profit
router.post('/product', async (req, res) => {
  try {
    const result = await MonthlyProfitController.create(req.body);
    res.status(201).json({
      message: 'Monthly profit created successfully',
      monthlyProfit: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create monthly profit', error });
  }
});

// Update a Monthly Profit
router.put('/product/:id', async (req, res) => {
  try {
    const updated = await MonthlyProfitController.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'Monthly profit not found' });
    res.json({ message: 'Monthly profit updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update monthly profit', error });
  }
});

// Delete a Monthly Profit
router.delete('/product/:id', async (req, res) => {
  try {
    const deleted = await MonthlyProfitController.delete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Monthly profit not found' });
    res.json({ message: 'Monthly profit deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete monthly profit', error });
  }
});

module.exports = router;
