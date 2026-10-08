const crypto = require('crypto');
const User = require('../models/User');
const Company = require('../models/Company');
const Notification = require('../models/Notification');
const { sendCredentialsEmail } = require('../utils/email');

exports.getUsers = async (req, res, next) => {
  try {
    const filter = { company: req.user.company._id };
    const users = await User.find(filter).populate('company', 'name').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) { next(error); }
};

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('company', 'name');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: user });
  } catch (error) { next(error); }
};

exports.createUser = async (req, res, next) => {
  try {
    req.body.company = req.user.company._id;
    req.body.createdBy = req.user._id;
    req.body.isEmailVerified = true;
    // No self-signup anymore: manager-created accounts are active immediately
    req.body.approvalStatus = 'approved';
    req.body.approvedBy = req.user._id;
    req.body.approvedAt = new Date();

    // Manager can type a password, otherwise we generate one and email it
    const generatedPassword = !req.body.password;
    if (generatedPassword) req.body.password = crypto.randomBytes(9).toString('base64url');

    const user = await User.create(req.body);

    // Email the login credentials to the user (nodemailer / SMTP from .env)
    const email = await sendCredentialsEmail({
      to: user.email,
      firstName: user.firstName,
      password: req.body.password,
    });

    const safeUser = user.toObject();
    delete safeUser.password;

    res.status(201).json({
      success: true,
      data: safeUser,
      emailSent: email.sent,
      // Only reveal the generated password when the email could not be sent,
      // so the manager can pass the credentials on manually
      tempPassword: generatedPassword && !email.sent ? req.body.password : undefined,
      message: email.sent
        ? `${user.firstName} ${user.lastName} created — login credentials sent to ${user.email}.`
        : `${user.firstName} ${user.lastName} created — credentials email failed (${email.reason}).`,
    });
  } catch (error) { next(error); }
};

// @desc    Approve a pending user (they can log in afterwards)
// @route   PUT /api/users/:id/approve
// @access  Private (manager)
exports.approveUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (String(user.company) !== String(req.user.company._id)) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.approvalStatus !== 'approved') {
      user.approvalStatus = 'approved';
      user.approvedBy = req.user._id;
      user.approvedAt = new Date();
      user.isActive = true;
      await user.save({ validateBeforeSave: false });

      await Notification.create({
        title: 'Account approved ✅',
        message: `Hi ${user.firstName}, your account has been approved. You can now log in.`,
        type: 'general',
        recipient: user._id,
        actionUrl: '/login',
        company_ref: user.company,
        createdBy: req.user._id,
      }).catch(() => {});
    }

    res.status(200).json({
      success: true, data: user,
      message: `${user.firstName} ${user.lastName} can now log in`,
    });
  } catch (error) { next(error); }
};

// @desc    Reject a pending user
// @route   PUT /api/users/:id/reject
// @access  Private (manager)
exports.rejectUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (String(user.company) !== String(req.user.company._id)) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot reject your own account' });
    }

    user.approvalStatus = 'rejected';
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true, data: user,
      message: `${user.firstName} ${user.lastName}'s registration was rejected`,
    });
  } catch (error) { next(error); }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { password, ...updateData } = req.body;
    updateData.updatedBy = req.user._id;
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
      .populate('company', 'name');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: user });
  } catch (error) { next(error); }
};

exports.deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, message: 'User deleted' });
  } catch (error) { next(error); }
};

exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });
    res.status(200).json({ success: true, data: user, message: `User ${user.isActive ? 'activated' : 'deactivated'}` });
  } catch (error) { next(error); }
};
