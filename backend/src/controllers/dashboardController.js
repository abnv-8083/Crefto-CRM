const Lead = require('../models/Lead');
const Customer = require('../models/Customer');
const Deal = require('../models/Deal');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const FollowUp = require('../models/FollowUp');
const User = require('../models/User');
const mongoose = require('mongoose');

exports.getDashboard = async (req, res, next) => {
  try {
    const company_ref = req.user.company._id;
    const companyObjId = mongoose.Types.ObjectId.createFromHexString(company_ref.toString());

    // Date range
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const createdAtFilter = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Parallel queries
    const [
      totalLeads, newLeads, qualifiedLeads, totalCustomers,
      activeDeals, wonDeals, lostDeals,
      pendingTasks, followUpsToday,
      recentLeads, recentActivities, todayTasks, upcomingFollowUps,
      leadsByStatus, dealsByStage, recentWonDeals,
      leadsBySource, revenueByRep, leadsOverTime, revenueOverTime
    ] = await Promise.all([
      Lead.countDocuments({ company_ref }),
      Lead.countDocuments({ company_ref, status: 'New', ...createdAtFilter }),
      Lead.countDocuments({ company_ref, status: 'Qualified' }),
      Customer.countDocuments({ company_ref }),
      Deal.countDocuments({ company_ref, stage: { $nin: ['Closed Won', 'Closed Lost'] } }),
      Deal.countDocuments({ company_ref, stage: 'Closed Won' }),
      Deal.countDocuments({ company_ref, stage: 'Closed Lost' }),
      Task.countDocuments({ company_ref, status: { $in: ['Pending', 'In Progress'] } }),
      FollowUp.countDocuments({ company_ref, scheduledAt: { $gte: today, $lt: tomorrow }, status: 'Pending' }),

      // Recent leads
      Lead.find({ company_ref }).populate('assignedTo', 'firstName lastName avatar')
        .sort({ createdAt: -1 }).limit(5),
      // Recent activities
      Activity.find({ company_ref }).populate('performedBy', 'firstName lastName avatar')
        .sort({ createdAt: -1 }).limit(10),
      // Today tasks
      Task.find({ company_ref, dueDate: { $gte: today, $lt: tomorrow }, status: { $in: ['Pending', 'In Progress'] } })
        .populate('assignedTo', 'firstName lastName'),
      // Upcoming follow-ups (next 7 days)
      FollowUp.find({ company_ref, scheduledAt: { $gte: now, $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) }, status: 'Pending' })
        .populate('assignedTo', 'firstName lastName')
        .populate('relatedLead', 'firstName lastName')
        .populate('relatedCustomer', 'name')
        .sort({ scheduledAt: 1 }).limit(10),
      // Leads by status
      Lead.aggregate([
        { $match: { company_ref: companyObjId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      // Deals by stage with value
      Deal.aggregate([
        { $match: { company_ref: companyObjId } },
        { $group: { _id: '$stage', count: { $sum: 1 }, totalValue: { $sum: '$value' } } }
      ]),
      // Recently won deals
      Deal.find({ company_ref, stage: 'Closed Won' })
        .populate('customer', 'name')
        .populate('assignedTo', 'firstName lastName')
        .sort({ wonAt: -1 }).limit(5),
      // Leads by source
      Lead.aggregate([
        { $match: { company_ref: companyObjId } },
        { $group: { _id: '$source', count: { $sum: 1 } } }
      ]),
      // Revenue by sales rep
      Deal.aggregate([
        { $match: { company_ref: companyObjId, stage: 'Closed Won' } },
        { $group: { _id: '$assignedTo', totalRevenue: { $sum: '$value' }, count: { $sum: 1 } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { totalRevenue: 1, count: 1, 'user.firstName': 1, 'user.lastName': 1 } },
        { $sort: { totalRevenue: -1 } },
        { $limit: 5 }
      ]),
      // Leads over time (last 30 days grouped by day)
      Lead.aggregate([
        { $match: { company_ref: companyObjId, createdAt: { $gte: last30 } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      // Revenue over time (won deals last 30 days)
      Deal.aggregate([
        { $match: { company_ref: companyObjId, stage: 'Closed Won', wonAt: { $gte: last30 } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$wonAt' } }, revenue: { $sum: '$value' } } },
        { $sort: { _id: 1 } }
      ]),
    ]);

    // Total revenue
    const revenueAgg = await Deal.aggregate([
      { $match: { company_ref: companyObjId, stage: 'Closed Won' } },
      { $group: { _id: null, total: { $sum: '$value' } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalLeads, newLeads, qualifiedLeads, totalCustomers,
          activeDeals, wonDeals, lostDeals, totalRevenue,
          pendingTasks, followUpsToday,
        },
        charts: { leadsByStatus, dealsByStage, leadsBySource, revenueByRep, leadsOverTime, revenueOverTime },
        widgets: { recentLeads, recentActivities, todayTasks, upcomingFollowUps, recentWonDeals },
      }
    });
  } catch (error) { next(error); }
};
