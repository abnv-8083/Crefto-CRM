const FollowUp = require('../models/FollowUp');
const Notification = require('../models/Notification');

exports.getFollowUps = async (req, res, next) => {
  try {
    const filter = { ...req.companyFilter };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
    if (req.user.role === 'sales_rep') filter.assignedTo = req.user._id;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    if (req.query.period === 'today') {
      filter.scheduledAt = { $gte: today, $lt: tomorrow };
    } else if (req.query.period === 'overdue') {
      filter.scheduledAt = { $lt: now };
      filter.status = 'Pending';
    } else if (req.query.period === 'upcoming') {
      filter.scheduledAt = { $gte: now };
      filter.status = 'Pending';
    }

    if (req.query.startDate || req.query.endDate) {
      filter.scheduledAt = {};
      if (req.query.startDate) filter.scheduledAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.scheduledAt.$lte = new Date(req.query.endDate);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const [followUps, total] = await Promise.all([
      FollowUp.find(filter)
        .populate('assignedTo', 'firstName lastName avatar')
        .populate('relatedLead', 'firstName lastName email')
        .populate('relatedCustomer', 'name email')
        .populate('relatedDeal', 'name value')
        .sort({ scheduledAt: 1 })
        .skip((page - 1) * limit).limit(limit),
      FollowUp.countDocuments(filter)
    ]);

    // Auto-mark overdue
    await FollowUp.updateMany(
      { company_ref: req.user.company._id, scheduledAt: { $lt: now }, status: 'Pending' },
      { status: 'Overdue' }
    );

    res.status(200).json({ success: true, count: followUps.length, total, page, pages: Math.ceil(total / limit), data: followUps });
  } catch (error) { next(error); }
};

exports.createFollowUp = async (req, res, next) => {
  try {
    req.body.company_ref = req.user.company._id;
    req.body.createdBy = req.user._id;
    const followUp = await FollowUp.create(req.body);

    if (followUp.assignedTo && followUp.assignedTo.toString() !== req.user._id.toString()) {
      await Notification.create({
        title: 'Follow-up Assigned',
        message: `You have a follow-up scheduled: ${followUp.title}`,
        type: 'follow_up_due',
        recipient: followUp.assignedTo,
        relatedFollowUp: followUp._id,
        company_ref: req.user.company._id,
        createdBy: req.user._id,
      });
    }

    res.status(201).json({ success: true, data: followUp });
  } catch (error) { next(error); }
};

exports.updateFollowUp = async (req, res, next) => {
  try {
    const followUp = await FollowUp.findOne({ _id: req.params.id, ...req.companyFilter });
    if (!followUp) return res.status(404).json({ success: false, message: 'Follow-up not found' });

    if (req.body.status === 'Completed' && followUp.status !== 'Completed') {
      req.body.completedAt = new Date();
    }
    if (req.body.scheduledAt && req.body.scheduledAt !== followUp.scheduledAt?.toISOString()) {
      req.body.rescheduledFrom = followUp.scheduledAt;
      req.body.status = 'Rescheduled';
    }

    req.body.updatedBy = req.user._id;
    const updated = await FollowUp.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('assignedTo', 'firstName lastName avatar');
    res.status(200).json({ success: true, data: updated });
  } catch (error) { next(error); }
};

exports.deleteFollowUp = async (req, res, next) => {
  try {
    const followUp = await FollowUp.findOne({ _id: req.params.id, ...req.companyFilter });
    if (!followUp) return res.status(404).json({ success: false, message: 'Follow-up not found' });
    await followUp.deleteOne();
    res.status(200).json({ success: true, message: 'Follow-up deleted' });
  } catch (error) { next(error); }
};
