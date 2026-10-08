const express = require('express');
const router = express.Router();
const { protect, setCompanyFilter } = require('../middleware/auth');
const {
  getLeads, getLead, createLead, updateLead, deleteLead,
  convertLead, addLeadActivity, bulkUpdateLeads
} = require('../controllers/leadController');

router.use(protect, setCompanyFilter);

router.route('/').get(getLeads).post(createLead);
router.route('/bulk').put(bulkUpdateLeads);
router.route('/:id').get(getLead).put(updateLead).delete(deleteLead);
router.post('/:id/convert', convertLead);
router.post('/:id/activities', addLeadActivity);

module.exports = router;
