const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  company: { type: String, trim: true, default: '' },
  email: { type: String, lowercase: true, trim: true, default: '' },
  phone: { type: String, default: '' },
  jobTitle: { type: String, default: '' },
  department: { type: String, default: '' },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  country: { type: String, default: '' },
  linkedCustomer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  linkedLead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  tags: [{ type: String }],
  notes: { type: String, default: '' },
  company_ref: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

contactSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

contactSchema.set('toJSON', { virtuals: true });
contactSchema.index({ company_ref: 1, createdAt: -1 });

module.exports = mongoose.model('Contact', contactSchema);
