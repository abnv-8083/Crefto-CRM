const Lead = require('../models/Lead');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const Customer = require('../models/Customer');
const Deal = require('../models/Deal');

// @desc    Get all leads
// @route   GET /api/leads
// @access  Private
exports.getLeads = async (req, res, next) => {
  try {
    const company_ref = req.user.company._id;

    const filter = { company_ref };

    // Search
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { company: searchRegex },
        { phone: searchRegex },
        { leadId: searchRegex },
      ];
    }

    if (req.query.status) filter.status = req.query.status;
    if (req.query.source) filter.source = req.query.source;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;

    // Only show own leads for sales_rep
    if (req.user.role === 'sales_rep') {
      const userCondition = { $or: [{ assignedTo: req.user._id }, { createdBy: req.user._id }] };
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, userCondition];
        delete filter.$or;
      } else {
        filter.$or = userCondition.$or;
      }
    }

    // Date filter
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) filter.createdAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.createdAt.$lte = new Date(req.query.endDate);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const sortField = req.query.sortField || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .populate('assignedTo', 'firstName lastName email avatar')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),
      Lead.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      count: leads.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: leads,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single lead
// @route   GET /api/leads/:id
// @access  Private
exports.getLead = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, ...req.companyFilter })
      .populate('assignedTo', 'firstName lastName email avatar')
      .populate('customerId')
      .populate('dealId');

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    if (req.user.role === 'sales_rep') {
      const isOwner = (lead.assignedTo && lead.assignedTo._id.toString() === req.user._id.toString()) || 
                      (lead.createdBy && lead.createdBy.toString() === req.user._id.toString());
      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Not authorized to access this lead' });
      }
    }

    // Get activities
    const activities = await Activity.find({ relatedLead: lead._id })
      .populate('performedBy', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({ success: true, data: { lead, activities } });
  } catch (error) {
    next(error);
  }
};

// @desc    Create lead
// @route   POST /api/leads
// @access  Private
exports.createLead = async (req, res, next) => {
  try {
    req.body.company_ref = req.user.company._id;
    req.body.createdBy = req.user._id;
    
    if (req.user.role === 'sales_rep') {
      req.body.assignedTo = req.user._id;
    }

    const lead = await Lead.create(req.body);

    // Log activity
    await Activity.create({
      type: 'Lead Created',
      title: `Lead created: ${lead.firstName} ${lead.lastName}`,
      relatedLead: lead._id,
      performedBy: req.user._id,
      company_ref: req.user.company._id,
      createdBy: req.user._id,
    });

    // Notify assigned user
    if (lead.assignedTo && lead.assignedTo.toString() !== req.user._id.toString()) {
      await Notification.create({
        title: 'New Lead Assigned',
        message: `You have been assigned a new lead: ${lead.firstName} ${lead.lastName}`,
        type: 'lead_assigned',
        recipient: lead.assignedTo,
        relatedLead: lead._id,
        company_ref: req.user.company._id,
        createdBy: req.user._id,
      });
    }

    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
};

// @desc    Update lead
// @route   PUT /api/leads/:id
// @access  Private
exports.updateLead = async (req, res, next) => {
  try {
    const existingLead = await Lead.findOne({ _id: req.params.id, ...req.companyFilter });
    if (!existingLead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    if (req.user.role === 'sales_rep') {
      const isOwner = (existingLead.assignedTo && existingLead.assignedTo.toString() === req.user._id.toString()) || 
                      (existingLead.createdBy && existingLead.createdBy.toString() === req.user._id.toString());
      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Not authorized to update this lead' });
      }
    }

    const previousStatus = existingLead.status;
    req.body.updatedBy = req.user._id;

    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    }).populate('assignedTo', 'firstName lastName email avatar');

    // Log status change activity
    if (req.body.status && req.body.status !== previousStatus) {
      await Activity.create({
        type: 'Status Change',
        title: `Status changed from ${previousStatus} to ${req.body.status}`,
        relatedLead: lead._id,
        performedBy: req.user._id,
        company_ref: req.user.company._id,
        createdBy: req.user._id,
        metadata: { from: previousStatus, to: req.body.status },
      });

      if (req.body.status === 'Lost') {
        await Notification.create({
          title: 'Lead Marked as Lost',
          message: `Lead ${lead.firstName} ${lead.lastName} has been marked as lost`,
          type: 'lead_status_changed',
          recipient: lead.assignedTo,
          relatedLead: lead._id,
          company_ref: req.user.company._id,
          createdBy: req.user._id,
        });
      }
    }

    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete lead
// @route   DELETE /api/leads/:id
// @access  Private
exports.deleteLead = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, ...req.companyFilter });
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    if (req.user.role === 'sales_rep') {
      const isOwner = (lead.assignedTo && lead.assignedTo.toString() === req.user._id.toString()) || 
                      (lead.createdBy && lead.createdBy.toString() === req.user._id.toString());
      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete this lead' });
      }
    }
    await lead.deleteOne();
    res.status(200).json({ success: true, message: 'Lead deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Convert lead to customer
// @route   POST /api/leads/:id/convert
// @access  Private
exports.convertLead = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, ...req.companyFilter });
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    if (lead.convertedToCustomer) {
      return res.status(400).json({ success: false, message: 'Lead already converted' });
    }

    // Create customer from lead
    const customer = await Customer.create({
      name: `${lead.firstName} ${lead.lastName}`,
      company: lead.company,
      email: lead.email,
      phone: lead.phone,
      industry: lead.industry,
      notes: lead.notes,
      tags: lead.tags,
      assignedTo: lead.assignedTo,
      leadId: lead._id,
      company_ref: req.user.company._id,
      createdBy: req.user._id,
    });

    // Update lead
    lead.convertedToCustomer = true;
    lead.convertedAt = new Date();
    lead.status = 'Converted';
    lead.customerId = customer._id;
    await lead.save();

    // Create deal if requested
    let deal;
    if (req.body.createDeal) {
      deal = await Deal.create({
        name: req.body.dealName || `Deal with ${customer.name}`,
        customer: customer._id,
        value: lead.expectedValue,
        assignedTo: lead.assignedTo,
        leadId: lead._id,
        company_ref: req.user.company._id,
        createdBy: req.user._id,
      });
      lead.dealId = deal._id;
      await lead.save();
    }

    await Activity.create({
      type: 'Status Change',
      title: `Lead converted to customer: ${customer.name}`,
      relatedLead: lead._id,
      relatedCustomer: customer._id,
      performedBy: req.user._id,
      company_ref: req.user.company._id,
      createdBy: req.user._id,
    });

    res.status(200).json({ success: true, data: { lead, customer, deal } });
  } catch (error) {
    next(error);
  }
};

// @desc    Add activity to lead
// @route   POST /api/leads/:id/activities
// @access  Private
exports.addLeadActivity = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, ...req.companyFilter });
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const activity = await Activity.create({
      ...req.body,
      relatedLead: lead._id,
      performedBy: req.user._id,
      company_ref: req.user.company._id,
      createdBy: req.user._id,
    });

    lead.lastContactedDate = new Date();
    await lead.save();

    res.status(201).json({ success: true, data: activity });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk update leads
// @route   PUT /api/leads/bulk
// @access  Private
exports.bulkUpdateLeads = async (req, res, next) => {
  try {
    const { ids, updates } = req.body;
    await Lead.updateMany(
      { _id: { $in: ids }, ...req.companyFilter },
      { ...updates, updatedBy: req.user._id }
    );
    res.status(200).json({ success: true, message: `${ids.length} leads updated` });
  } catch (error) {
    next(error);
  }
};
