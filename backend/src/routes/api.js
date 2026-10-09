const express = require('express');
const router = express.Router();
const { protect, setCompanyFilter, authorize } = require('../middleware/auth');
const { getLeads, getLead, createLead, updateLead, deleteLead, convertLead, addLeadActivity, bulkUpdateLeads } = require('../controllers/leadController');
const { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer, addCustomerActivity } = require('../controllers/customerController');
const { getDeals, getDeal, createDeal, updateDeal, deleteDeal } = require('../controllers/dealController');
const { getContacts, getContact, createContact, updateContact, deleteContact } = require('../controllers/contactController');
const { getTasks, getTask, createTask, updateTask, deleteTask } = require('../controllers/taskController');
const { getFollowUps, createFollowUp, updateFollowUp, deleteFollowUp } = require('../controllers/followUpController');
const { getNotifications, markAsRead, markAllAsRead, deleteNotification } = require('../controllers/notificationController');
const { getUsers, getUser, createUser, updateUser, deleteUser, toggleUserStatus, approveUser, rejectUser } = require('../controllers/userController');
const { getDemoRequests, createDemoRequest, updateDemoRequest, startDemoRequest, deliverDemoRequest, deleteDemoRequest } = require('../controllers/demoRequestController');
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { getQuotations, getQuotation, createQuotation, updateQuotation, deleteQuotation } = require('../controllers/quotationController');
const { getActivities, createActivity, globalSearch, getReports } = require('../controllers/activityController');
const { getDashboard } = require('../controllers/dashboardController');
const Company = require('../models/Company');

router.use(protect, setCompanyFilter);

// Role helpers: manager = everything, sales_rep = CRM modules, developer = demo projects
const managerOnly = authorize('manager');
const salesTeam = authorize('manager', 'sales_rep');
const devTeam = authorize('manager', 'developer');
// Tasks are open to every role; follow-ups are read-only for developers (calendar feed)
const allRoles = authorize('manager', 'sales_rep', 'developer');

// Leads
router.route('/leads').get(salesTeam, getLeads).post(salesTeam, createLead);
router.put('/leads/bulk', salesTeam, bulkUpdateLeads);
router.route('/leads/:id').get(salesTeam, getLead).put(salesTeam, updateLead).delete(salesTeam, deleteLead);
router.post('/leads/:id/convert', salesTeam, convertLead);
router.post('/leads/:id/activities', salesTeam, addLeadActivity);

// Dashboard
router.get('/dashboard', getDashboard);

// Reports (manager only)
router.get('/reports', managerOnly, getReports);

// Search (CRM data — manager & sales reps)
router.get('/search', salesTeam, globalSearch);

// Customers
router.route('/customers').get(allRoles, getCustomers).post(salesTeam, createCustomer);
router.route('/customers/:id').get(salesTeam, getCustomer).put(salesTeam, updateCustomer).delete(salesTeam, deleteCustomer);
router.post('/customers/:id/activities', salesTeam, addCustomerActivity);

// Deals
router.route('/deals').get(salesTeam, getDeals).post(salesTeam, createDeal);
router.route('/deals/:id').get(salesTeam, getDeal).put(salesTeam, updateDeal).delete(salesTeam, deleteDeal);

// Contacts
router.route('/contacts').get(salesTeam, getContacts).post(salesTeam, createContact);
router.route('/contacts/:id').get(salesTeam, getContact).put(salesTeam, updateContact).delete(salesTeam, deleteContact);

// Tasks
router.route('/tasks').get(allRoles, getTasks).post(allRoles, createTask);
router.route('/tasks/:id').get(allRoles, getTask).put(allRoles, updateTask).delete(allRoles, deleteTask);

// Follow-ups (developers get read access for the calendar)
router.route('/follow-ups').get(allRoles, getFollowUps).post(salesTeam, createFollowUp);
router.route('/follow-ups/:id').put(salesTeam, updateFollowUp).delete(salesTeam, deleteFollowUp);

// Activities (listing feeds the dashboard widget for every role)
router.route('/activities').get(getActivities).post(salesTeam, createActivity);

// Notifications
router.route('/notifications').get(getNotifications);
router.put('/notifications/mark-all-read', markAllAsRead);
router.route('/notifications/:id').put(markAsRead).delete(deleteNotification);

// Products (read for quotation building, manage = manager)
router.route('/products').get(allRoles, getProducts).post(managerOnly, createProduct);
router.route('/products/:id').get(salesTeam, getProduct).put(managerOnly, updateProduct).delete(managerOnly, deleteProduct);

// Quotations
router.route('/quotations').get(allRoles, getQuotations).post(allRoles, createQuotation);
router.route('/quotations/:id').get(allRoles, getQuotation).put(allRoles, updateQuotation).delete(allRoles, deleteQuotation);

// Demo requests: sales reps open them, developers deliver them, managers see all
router.route('/demo-requests').get(getDemoRequests).post(salesTeam, createDemoRequest);
router.put('/demo-requests/:id/start', devTeam, startDemoRequest);
router.put('/demo-requests/:id/delivery', devTeam, deliverDemoRequest);
router.route('/demo-requests/:id').put(updateDemoRequest).delete(deleteDemoRequest);

// Users (manager only — creation requires manager approval before login)
router.route('/users').get(managerOnly, getUsers).post(managerOnly, createUser);
router.route('/users/:id').get(managerOnly, getUser).put(managerOnly, updateUser).delete(managerOnly, deleteUser);
router.put('/users/:id/toggle-status', managerOnly, toggleUserStatus);
router.put('/users/:id/approve', managerOnly, approveUser);
router.put('/users/:id/reject', managerOnly, rejectUser);

// Company settings
router.get('/settings/company', async (req, res) => {
  const company = await Company.findById(req.user.company._id);
  res.json({ success: true, data: company });
});
router.put('/settings/company', managerOnly, async (req, res, next) => {
  try {
    const company = await Company.findByIdAndUpdate(req.user.company._id, req.body, { new: true });
    res.json({ success: true, data: company });
  } catch (e) { next(e); }
});

module.exports = router;
