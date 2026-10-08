const Deal = require('../models/Deal');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const Customer = require('../models/Customer');

exports.getDeals = async (req, res, next) => {
  try {
    const company_ref = req.user.company._id;
    const filter = { company_ref };

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [{ name: searchRegex }, { dealId: searchRegex }];
    }
    if (req.query.stage) filter.stage = req.query.stage;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
    if (req.user.role === 'sales_rep') filter.assignedTo = req.user._id;
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) filter.createdAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.createdAt.$lte = new Date(req.query.endDate);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [deals, total] = await Promise.all([
      Deal.find(filter)
        .populate('customer', 'name email phone')
        .populate('assignedTo', 'firstName lastName email avatar')
        .populate('contact', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit),
      Deal.countDocuments(filter)
    ]);

    // Aggregated stats
    const stats = await Deal.aggregate([
      { $match: { company_ref: require('mongoose').Types.ObjectId.createFromHexString(company_ref.toString()) } },
      { $group: {
        _id: '$stage',
        count: { $sum: 1 },
        totalValue: { $sum: '$value' },
        weightedValue: { $sum: { $multiply: ['$value', { $divide: ['$probability', 100] }] } }
      }}
    ]);

    res.status(200).json({ success: true, count: deals.length, total, page, pages: Math.ceil(total / limit), data: deals, stats });
  } catch (error) { next(error); }
};

exports.getDeal = async (req, res, next) => {
  try {
    const deal = await Deal.findOne({ _id: req.params.id, ...req.companyFilter })
      .populate('customer', 'name email phone')
      .populate('assignedTo', 'firstName lastName email avatar')
      .populate('contact', 'firstName lastName email')
      .populate('products.product', 'name price tax');

    if (!deal) return res.status(404).json({ success: false, message: 'Deal not found' });

    const activities = await Activity.find({ relatedDeal: deal._id })
      .populate('performedBy', 'firstName lastName avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: { deal, activities } });
  } catch (error) { next(error); }
};

exports.createDeal = async (req, res, next) => {
  try {
    req.body.company_ref = req.user.company._id;
    req.body.createdBy = req.user._id;
    const deal = await Deal.create(req.body);

    await Activity.create({
      type: 'Deal Created',
      title: `Deal created: ${deal.name}`,
      relatedDeal: deal._id,
      relatedCustomer: deal.customer,
      performedBy: req.user._id,
      company_ref: req.user.company._id,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: deal });
  } catch (error) { next(error); }
};

exports.updateDeal = async (req, res, next) => {
  try {
    const existing = await Deal.findOne({ _id: req.params.id, ...req.companyFilter });
    if (!existing) return res.status(404).json({ success: false, message: 'Deal not found' });

    const previousStage = existing.stage;
    req.body.updatedBy = req.user._id;

    if (req.body.stage === 'Closed Won' && previousStage !== 'Closed Won') {
      req.body.wonAt = new Date();
      // Update customer revenue
      if (existing.customer) {
        await Customer.findByIdAndUpdate(existing.customer, {
          $inc: { totalRevenue: existing.value, totalDeals: 1 }
        });
      }
      await Notification.create({
        title: '🎉 Deal Won!',
        message: `Congratulations! Deal "${existing.name}" has been won! Value: $${existing.value}`,
        type: 'deal_won',
        recipient: existing.assignedTo,
        relatedDeal: existing._id,
        company_ref: req.user.company._id,
        createdBy: req.user._id,
      });
    }

    if (req.body.stage === 'Closed Lost' && previousStage !== 'Closed Lost') {
      req.body.lostAt = new Date();
      await Notification.create({
        title: 'Deal Lost',
        message: `Deal "${existing.name}" has been marked as lost`,
        type: 'deal_lost',
        recipient: existing.assignedTo,
        relatedDeal: existing._id,
        company_ref: req.user.company._id,
        createdBy: req.user._id,
      });
    }

    const deal = await Deal.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('customer', 'name email phone')
      .populate('assignedTo', 'firstName lastName email avatar');

    if (req.body.stage && req.body.stage !== previousStage) {
      await Activity.create({
        type: req.body.stage === 'Closed Won' ? 'Deal Won' : req.body.stage === 'Closed Lost' ? 'Deal Lost' : 'Status Change',
        title: `Deal stage changed: ${previousStage} → ${req.body.stage}`,
        relatedDeal: deal._id,
        relatedCustomer: deal.customer,
        performedBy: req.user._id,
        company_ref: req.user.company._id,
        createdBy: req.user._id,
        metadata: { from: previousStage, to: req.body.stage },
      });
    }

    res.status(200).json({ success: true, data: deal });
  } catch (error) { next(error); }
};

exports.deleteDeal = async (req, res, next) => {
  try {
    const deal = await Deal.findOne({ _id: req.params.id, ...req.companyFilter });
    if (!deal) return res.status(404).json({ success: false, message: 'Deal not found' });
    await deal.deleteOne();
    res.status(200).json({ success: true, message: 'Deal deleted' });
  } catch (error) { next(error); }
};
