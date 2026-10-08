const Activity = require('../models/Activity');
const Lead = require('../models/Lead');
const Customer = require('../models/Customer');
const Deal = require('../models/Deal');
const Task = require('../models/Task');
const FollowUp = require('../models/FollowUp');

exports.getActivities = async (req, res, next) => {
  try {
    const filter = { ...req.companyFilter };
    if (req.query.type) filter.type = req.query.type;
    if (req.query.relatedLead) filter.relatedLead = req.query.relatedLead;
    if (req.query.relatedCustomer) filter.relatedCustomer = req.query.relatedCustomer;
    if (req.query.relatedDeal) filter.relatedDeal = req.query.relatedDeal;
    if (req.query.performedBy) filter.performedBy = req.query.performedBy;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const [activities, total] = await Promise.all([
      Activity.find(filter)
        .populate('performedBy', 'firstName lastName avatar')
        .populate('relatedLead', 'firstName lastName')
        .populate('relatedCustomer', 'name')
        .populate('relatedDeal', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit).limit(limit),
      Activity.countDocuments(filter)
    ]);

    res.status(200).json({ success: true, count: activities.length, total, page, pages: Math.ceil(total / limit), data: activities });
  } catch (error) { next(error); }
};

exports.createActivity = async (req, res, next) => {
  try {
    req.body.company_ref = req.user.company._id;
    req.body.createdBy = req.user._id;
    req.body.performedBy = req.user._id;
    const activity = await Activity.create(req.body);
    res.status(201).json({ success: true, data: activity });
  } catch (error) { next(error); }
};

// Global search
exports.globalSearch = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.status(200).json({ success: true, data: {} });

    const regex = new RegExp(q, 'i');
    const companyFilter = { company_ref: req.user.company._id };
    const limit = 5;

    const [leads, customers, contacts, deals, tasks] = await Promise.all([
      Lead.find({ ...companyFilter, $or: [{ firstName: regex }, { lastName: regex }, { email: regex }, { company: regex }] }).limit(limit).select('firstName lastName email company status leadId'),
      Customer.find({ ...companyFilter, $or: [{ name: regex }, { email: regex }, { company: regex }] }).limit(limit).select('name email company customerId'),
      require('../models/Contact').find({ ...companyFilter, $or: [{ firstName: regex }, { lastName: regex }, { email: regex }] }).limit(limit).select('firstName lastName email company'),
      Deal.find({ ...companyFilter, $or: [{ name: regex }, { dealId: regex }] }).limit(limit).select('name value stage dealId'),
      Task.find({ ...companyFilter, title: regex }).limit(limit).select('title status priority dueDate'),
    ]);

    res.status(200).json({ success: true, data: { leads, customers, contacts, deals, tasks } });
  } catch (error) { next(error); }
};

// Reports controller
exports.getReports = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    const company_ref = req.user.company._id;
    const companyObjId = mongoose.Types.ObjectId.createFromHexString(company_ref.toString());

    const { type, startDate, endDate, assignedTo } = req.query;
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    const matchFilter = { company_ref: companyObjId };
    if (Object.keys(dateFilter).length) matchFilter.createdAt = dateFilter;
    if (assignedTo) matchFilter.assignedTo = mongoose.Types.ObjectId.createFromHexString(assignedTo);

    let reportData = {};

    if (type === 'leads' || !type) {
      const [byStatus, bySource, byRep, timeline] = await Promise.all([
        Lead.aggregate([{ $match: matchFilter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
        Lead.aggregate([{ $match: matchFilter }, { $group: { _id: '$source', count: { $sum: 1 } } }]),
        Lead.aggregate([
          { $match: matchFilter },
          { $group: { _id: '$assignedTo', count: { $sum: 1 }, converted: { $sum: { $cond: ['$convertedToCustomer', 1, 0] } } } },
          { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
          { $unwind: '$user' },
          { $project: { count: 1, converted: 1, 'user.firstName': 1, 'user.lastName': 1 } }
        ]),
        Lead.aggregate([
          { $match: matchFilter },
          { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
          { $sort: { _id: 1 } }
        ])
      ]);
      reportData.leads = { byStatus, bySource, byRep, timeline };
    }

    if (type === 'sales' || !type) {
      const [byStage, byRep, timeline, conversionRate] = await Promise.all([
        Deal.aggregate([{ $match: matchFilter }, { $group: { _id: '$stage', count: { $sum: 1 }, totalValue: { $sum: '$value' } } }]),
        Deal.aggregate([
          { $match: { ...matchFilter, stage: 'Closed Won' } },
          { $group: { _id: '$assignedTo', revenue: { $sum: '$value' }, count: { $sum: 1 } } },
          { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
          { $unwind: '$user' },
          { $project: { revenue: 1, count: 1, 'user.firstName': 1, 'user.lastName': 1 } },
          { $sort: { revenue: -1 } }
        ]),
        Deal.aggregate([
          { $match: { ...matchFilter, stage: 'Closed Won' } },
          { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$wonAt' } }, revenue: { $sum: '$value' }, count: { $sum: 1 } } },
          { $sort: { _id: 1 } }
        ]),
        Deal.aggregate([
          { $match: matchFilter },
          { $group: { _id: null, total: { $sum: 1 }, won: { $sum: { $cond: [{ $eq: ['$stage', 'Closed Won'] }, 1, 0] } } } }
        ])
      ]);
      reportData.sales = { byStage, byRep, timeline, conversionRate };
    }

    res.status(200).json({ success: true, data: reportData });
  } catch (error) { next(error); }
};
