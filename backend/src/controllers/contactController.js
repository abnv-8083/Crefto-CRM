const Contact = require('../models/Contact');

exports.getContacts = async (req, res, next) => {
  try {
    const filter = { ...req.companyFilter };
    if (req.query.search) {
      const r = new RegExp(req.query.search, 'i');
      filter.$or = [{ firstName: r }, { lastName: r }, { email: r }, { company: r }, { phone: r }];
    }
    if (req.query.linkedCustomer) filter.linkedCustomer = req.query.linkedCustomer;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const [contacts, total] = await Promise.all([
      Contact.find(filter).populate('linkedCustomer', 'name').populate('linkedLead', 'firstName lastName')
        .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Contact.countDocuments(filter)
    ]);
    res.status(200).json({ success: true, count: contacts.length, total, page, pages: Math.ceil(total / limit), data: contacts });
  } catch (error) { next(error); }
};

exports.getContact = async (req, res, next) => {
  try {
    const contact = await Contact.findOne({ _id: req.params.id, ...req.companyFilter })
      .populate('linkedCustomer', 'name email').populate('linkedLead', 'firstName lastName email');
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
    res.status(200).json({ success: true, data: contact });
  } catch (error) { next(error); }
};

exports.createContact = async (req, res, next) => {
  try {
    req.body.company_ref = req.user.company._id;
    req.body.createdBy = req.user._id;
    const contact = await Contact.create(req.body);
    res.status(201).json({ success: true, data: contact });
  } catch (error) { next(error); }
};

exports.updateContact = async (req, res, next) => {
  try {
    const contact = await Contact.findOne({ _id: req.params.id, ...req.companyFilter });
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
    req.body.updatedBy = req.user._id;
    const updated = await Contact.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: updated });
  } catch (error) { next(error); }
};

exports.deleteContact = async (req, res, next) => {
  try {
    const contact = await Contact.findOne({ _id: req.params.id, ...req.companyFilter });
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
    await contact.deleteOne();
    res.status(200).json({ success: true, message: 'Contact deleted' });
  } catch (error) { next(error); }
};
