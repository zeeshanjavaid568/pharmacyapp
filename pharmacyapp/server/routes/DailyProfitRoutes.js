const express = require('express');
const DailyProfitController = require('../controllers/DailyProfitController');

const router = express.Router();

// Get all Daily Profits
router.get('/products', async (req, res) => {
  try {
    const dailyProfits = await DailyProfitController.getAll();
    res.json(dailyProfits);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch daily profits', error });
  }
});

// Get a Daily Profit by ID
router.get('/product/:id', async (req, res) => {
  try {
    const dailyProfit = await DailyProfitController.getById(req.params.id);
    if (!dailyProfit) return res.status(404).json({ message: 'Daily profit not found' });
    res.json(dailyProfit);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch daily profit', error });
  }
});

// Create a new Daily Profit
router.post('/product', async (req, res) => {
  try {
    const result = await DailyProfitController.create(req.body);
    res.status(201).json({
      message: 'Daily profit created successfully',
      dailyProfit: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create daily profit', error });
  }
});

// Update a Daily Profit
router.put('/product/:id', async (req, res) => {
  try {
    const updated = await DailyProfitController.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'Daily profit not found' });
    res.json({ message: 'Daily profit updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update daily profit', error });
  }
});

// Delete a Daily Profit
router.delete('/product/:id', async (req, res) => {
  try {
    const deleted = await DailyProfitController.delete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Daily profit not found' });
    res.json({ message: 'Daily profit deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete daily profit', error });
  }
});

module.exports = router;
