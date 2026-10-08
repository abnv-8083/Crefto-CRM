const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).populate('company');

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (!req.user.isActive) {
      return res.status(401).json({ success: false, message: 'Account has been deactivated' });
    }

    // Users who were never approved by a manager cannot use the API
    if (req.user.approvalStatus === 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Account is pending approval by the manager',
      });
    }
    if (req.user.approvalStatus === 'rejected') {
      return res.status(403).json({
        success: false,
        message: 'Account registration was rejected',
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
};

// Authorize roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

// Set company filter for multi-tenant
exports.setCompanyFilter = (req, res, next) => {
  req.companyFilter = req.user.company ? { company_ref: req.user.company._id } : {};
  next();
};
