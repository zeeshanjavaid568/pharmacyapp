const express = require('express');
const DuesController = require('../controllers/DuesController');

const router = express.Router();

  // GIVEN DUES ROUTES START SECTION

/**
 * @route   GET /dues/givedues
 * @desc    Get all Give Dues records
 * @access  Public (or protect if needed)
 */
router.get('/givedues', async (req, res) => {
  try {
    const giveDues = await DuesController.getAllGiveDues();
    res.status(200).json(giveDues);
  } catch (error) {
    console.error('Error fetching Dues:', error);
    res.status(500).json({ message: 'Failed to fetch Dues', error: error.message });
  }
});

/**
 * @route   GET /dues/givedues/:id
 * @desc    Get a single Give Dues record by ID
 */
router.get('/givedues/:id', async (req, res) => {
  try {
    const giveDue = await DuesController.getByIdGiveDues(req.params.id);
    if (!giveDue) {
      return res.status(404).json({ message: 'Give Due not found' });
    }
    res.status(200).json(giveDue);
  } catch (error) {
    console.error('Error fetching Give Due by ID:', error);
    res.status(500).json({ message: 'Failed to fetch Give Due', error: error.message });
  }
});

/**
 * @route   POST /dues/givedues
 * @desc    Create a new Give Dues record
 */
router.post('/givedues', async (req, res) => {
  try {
    const newGiveDue = await DuesController.createGiveDues(req.body);
    res.status(201).json({
      message: ' Due created successfully',
      giveDue: newGiveDue,
    });
  } catch (error) {
    console.error('Error creating  Due:', error);
    res.status(500).json({ message: 'Failed to create  Due', error: error.message });
  }
});

/**
 * @route   PUT /dues/givedues/:id
 * @desc    Update a Give Dues record
 */
router.put('/givedues/:id', async (req, res) => {
  try {
    const updatedGiveDue = await DuesController.update(req.params.id, req.body);
    if (!updatedGiveDue) {
      return res.status(404).json({ message: 'Give Due not found' });
    }
    res.status(200).json({ message: 'Give Due updated successfully', giveDue: updatedGiveDue });
  } catch (error) {
    console.error('Error updating Give Due:', error);
    res.status(500).json({ message: 'Failed to update Give Due', error: error.message });
  }
});

/**
 * @route   DELETE /dues/givedues/:id
 * @desc    Delete a Give Dues record
 */
router.delete('/givedues/:id', async (req, res) => {
  try {
    const deleted = await DuesController.deleteGiveDues(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: ' Due not found' });
    }
    res.status(200).json({ message: ' Due deleted successfully' });
  } catch (error) {
    console.error('Error deleting  Due:', error);
    res.status(500).json({ message: 'Failed to delete  Due', error: error.message });
  }
});

  // GIVEN DUES ROUTES END SECTION

 

module.exports = router;
