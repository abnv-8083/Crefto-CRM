const Customer = require('../models/Customer');
const Activity = require('../models/Activity');
const Deal = require('../models/Deal');
const Task = require('../models/Task');

exports.getCustomers = async (req, res, next) => {
  try {
    const company_ref = req.user.company._id;
    const filter = { company_ref };

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { name: searchRegex }, { email: searchRegex },
        { company: searchRegex }, { phone: searchRegex }, { customerId: searchRegex }
      ];
    }

    if (req.query.status) filter.status = req.query.status;
    if (req.query.customerType) filter.customerType = req.query.customerType;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
    if (req.user.role === 'sales_rep') filter.assignedTo = req.user._id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const sortField = req.query.sortField || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const [customers, total] = await Promise.all([
      Customer.find(filter)
        .populate('assignedTo', 'firstName lastName email avatar')
        .sort({ [sortField]: sortOrder })
        .skip(skip).limit(limit),
      Customer.countDocuments(filter)
    ]);

    res.status(200).json({ success: true, count: customers.length, total, page, pages: Math.ceil(total / limit), data: customers });
  } catch (error) { next(error); }
};

exports.getCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, ...req.companyFilter })
      .populate('assignedTo', 'firstName lastName email avatar');

    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const [activities, deals, tasks] = await Promise.all([
      Activity.find({ relatedCustomer: customer._id })
        .populate('performedBy', 'firstName lastName avatar')
        .sort({ createdAt: -1 }).limit(50),
      Deal.find({ customer: customer._id, ...req.companyFilter })
        .populate('assignedTo', 'firstName lastName'),
      Task.find({ relatedCustomer: customer._id, ...req.companyFilter })
        .populate('assignedTo', 'firstName lastName')
    ]);

    res.status(200).json({ success: true, data: { customer, activities, deals, tasks } });
  } catch (error) { next(error); }
};

exports.createCustomer = async (req, res, next) => {
  try {
    req.body.company_ref = req.user.company._id;
    req.body.createdBy = req.user._id;
    const customer = await Customer.create(req.body);
    await Activity.create({
      type: 'Customer Created',
      title: `Customer created: ${customer.name}`,
      relatedCustomer: customer._id,
      performedBy: req.user._id,
      company_ref: req.user.company._id,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: customer });
  } catch (error) { next(error); }
};

exports.updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, ...req.companyFilter });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    req.body.updatedBy = req.user._id;
    const updated = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('assignedTo', 'firstName lastName email avatar');
    res.status(200).json({ success: true, data: updated });
  } catch (error) { next(error); }
};

exports.deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, ...req.companyFilter });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    await customer.deleteOne();
    res.status(200).json({ success: true, message: 'Customer deleted' });
  } catch (error) { next(error); }
};

exports.addCustomerActivity = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, ...req.companyFilter });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    const activity = await Activity.create({
      ...req.body,
      relatedCustomer: customer._id,
      performedBy: req.user._id,
      company_ref: req.user.company._id,
      createdBy: req.user._id,
    });
    customer.lastContact = new Date();
    await customer.save();
    res.status(201).json({ success: true, data: activity });
  } catch (error) { next(error); }
};
