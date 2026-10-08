const DemoRequest = require('../models/DemoRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');

const isManager = (user) => user.role === 'manager';
const isDeveloper = (user) => user.role === 'developer';

const notify = async (recipients, payload) => {
  if (!recipients.length) return;
  try {
    await Notification.insertMany(recipients.map((id) => ({ ...payload, recipient: id })));
  } catch { /* notifications must never block the main action */ }
};

// @desc    List demo requests (sales reps see only their own)
// @route   GET /api/demo-requests
// @access  Private (all roles)
exports.getDemoRequests = async (req, res, next) => {
  try {
    const filter = { ...req.companyFilter };
    if (req.user.role === 'sales_rep') filter.requestedBy = req.user._id;
    if (req.query.status) filter.status = req.query.status;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const [data, total] = await Promise.all([
      DemoRequest.find(filter)
        .populate('requestedBy', 'firstName lastName email')
        .populate('assignedTo', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      DemoRequest.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true, count: data.length, total, page, pages: Math.ceil(total / limit), data,
    });
  } catch (error) { next(error); }
};

// @desc    Create a demo request with client details
// @route   POST /api/demo-requests
// @access  Private (manager, sales_rep)
exports.createDemoRequest = async (req, res, next) => {
  try {
    const { title, clientName, clientEmail, clientPhone, clientCompany, description } = req.body;
    if (!title || !clientName) {
      return res.status(400).json({ success: false, message: 'Title and client name are required' });
    }

    const company_ref = req.user.company._id;
    const count = await DemoRequest.countDocuments({ company_ref });

    const demoRequest = await DemoRequest.create({
      requestId: `DEMO-${String(count + 1).padStart(4, '0')}`,
      title,
      clientName,
      clientEmail,
      clientPhone,
      clientCompany,
      description,
      requestedBy: req.user._id,
      createdBy: req.user._id,
      company_ref,
    });

    // Tell developers (and managers) there is a new request to pick up
    const team = await User.find({
      company: company_ref,
      role: { $in: ['developer', 'manager'] },
      _id: { $ne: req.user._id },
      approvalStatus: 'approved',
    }).select('_id');
    await notify(team.map((u) => u._id), {
      title: 'New demo request',
      message: `${req.user.firstName} ${req.user.lastName} requested a demo for ${clientName} — "${title}"`,
      type: 'general',
      actionUrl: '/demo-requests',
      company_ref,
      createdBy: req.user._id,
    });

    const data = await DemoRequest.findById(demoRequest._id)
      .populate('requestedBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
};

const loadOwnedRequest = async (req, res) => {
  const demoRequest = await DemoRequest.findById(req.params.id);
  if (!demoRequest) {
    res.status(404).json({ success: false, message: 'Demo request not found' });
    return null;
  }
  if (String(demoRequest.company_ref) !== String(req.user.company._id)) {
    res.status(404).json({ success: false, message: 'Demo request not found' });
    return null;
  }
  return demoRequest;
};

// @desc    Edit basic details of a demo request
// @route   PUT /api/demo-requests/:id
// @access  Private (manager: anyone's; creator: own while not delivered)
exports.updateDemoRequest = async (req, res, next) => {
  try {
    const demoRequest = await loadOwnedRequest(req, res);
    if (!demoRequest) return;

    if (!isManager(req.user)) {
      const isOwner = String(demoRequest.requestedBy) === String(req.user._id);
      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'You can only edit your own demo requests' });
      }
      if (demoRequest.status === 'delivered') {
        return res.status(403).json({ success: false, message: 'Delivered demo requests can no longer be edited' });
      }
    }

    const allowed = ['title', 'clientName', 'clientEmail', 'clientPhone', 'clientCompany', 'description'];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) demoRequest[key] = req.body[key];
    });
    await demoRequest.save();

    const data = await DemoRequest.findById(demoRequest._id)
      .populate('requestedBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');
    res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

// @desc    Developer picks up a request and starts working
// @route   PUT /api/demo-requests/:id/start
// @access  Private (manager, developer)
exports.startDemoRequest = async (req, res, next) => {
  try {
    const demoRequest = await loadOwnedRequest(req, res);
    if (!demoRequest) return;

    if (demoRequest.status !== 'requested') {
      return res.status(400).json({ success: false, message: 'This request has already been started' });
    }

    demoRequest.status = 'in_progress';
    if (isDeveloper(req.user)) demoRequest.assignedTo = req.user._id;
    await demoRequest.save();

    await notify([demoRequest.requestedBy], {
      title: 'Demo request in progress',
      message: `"${demoRequest.title}" for ${demoRequest.clientName} is now being worked on`,
      type: 'general',
      actionUrl: '/demo-requests',
      company_ref: demoRequest.company_ref,
      createdBy: req.user._id,
    });

    const data = await DemoRequest.findById(demoRequest._id)
      .populate('requestedBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');
    res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

// @desc    Developer sends back the finished demo (video / photo / link)
// @route   PUT /api/demo-requests/:id/delivery
// @access  Private (manager, developer)
exports.deliverDemoRequest = async (req, res, next) => {
  try {
    const { demoVideo, demoPhoto, demoLink, deliveryNotes } = req.body;

    if (!demoVideo && !demoPhoto && !demoLink) {
      return res.status(400).json({
        success: false,
        message: 'Provide at least one of: demo video, photo, or link',
      });
    }

    const demoRequest = await loadOwnedRequest(req, res);
    if (!demoRequest) return;

    if (demoRequest.status === 'delivered') {
      return res.status(400).json({ success: false, message: 'This request was already delivered' });
    }

    demoRequest.demoVideo = demoVideo || '';
    demoRequest.demoPhoto = demoPhoto || '';
    demoRequest.demoLink = demoLink || '';
    demoRequest.deliveryNotes = deliveryNotes || '';
    demoRequest.status = 'delivered';
    demoRequest.deliveredAt = new Date();
    if (isDeveloper(req.user)) demoRequest.assignedTo = req.user._id;
    await demoRequest.save();

    await notify([demoRequest.requestedBy], {
      title: 'Demo delivered 🎉',
      message: `The demo for "${demoRequest.title}" (${demoRequest.clientName}) is ready — video, photos and links attached`,
      type: 'general',
      actionUrl: '/demo-requests',
      company_ref: demoRequest.company_ref,
      createdBy: req.user._id,
    });

    const data = await DemoRequest.findById(demoRequest._id)
      .populate('requestedBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');
    res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

// @desc    Delete a demo request
// @route   DELETE /api/demo-requests/:id
// @access  Private (manager: all; creator: own while still requested)
exports.deleteDemoRequest = async (req, res, next) => {
  try {
    const demoRequest = await loadOwnedRequest(req, res);
    if (!demoRequest) return;

    if (!isManager(req.user)) {
      const isOwner = String(demoRequest.requestedBy) === String(req.user._id);
      if (!isOwner || demoRequest.status !== 'requested') {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own requests while they are still pending',
        });
      }
    }

    await demoRequest.deleteOne();
    res.status(200).json({ success: true, message: 'Demo request deleted' });
  } catch (error) { next(error); }
};
