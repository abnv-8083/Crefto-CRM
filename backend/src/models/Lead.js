const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  leadId: { type: String, unique: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  company: { type: String, trim: true, default: '' },
  email: { type: String, lowercase: true, trim: true, default: '' },
  phone: { type: String, default: '' },
  alternatePhone: { type: String, default: '' },
  website: { type: String, default: '' },
  industry: { type: String, default: '' },
  location: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  country: { type: String, default: '' },
  source: {
    type: String,
    enum: ['Website', 'Google', 'Facebook', 'Instagram', 'WhatsApp', 'LinkedIn', 'Twitter', 'Referral', 'Cold Call', 'Email', 'Advertisement', 'Trade Show', 'Partner', 'Other'],
    default: 'Other'
  },
  status: {
    type: String,
    enum: ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Converted', 'Lost'],
    default: 'New'
  },
  score: { type: Number, default: 0, min: 0, max: 100 },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  expectedValue: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  tags: [{ type: String }],
  lastContactedDate: { type: Date },
  nextFollowUpDate: { type: Date },
  convertedToCustomer: { type: Boolean, default: false },
  convertedAt: { type: Date },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  dealId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },
  lostReason: { type: String, default: '' },
  company_ref: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Auto-generate leadId
leadSchema.pre('save', async function () {
  if (!this.leadId) {
    const count = await mongoose.model('Lead').countDocuments({ company_ref: this.company_ref });
    this.leadId = `LEAD-${String(count + 1).padStart(4, '0')}`;
  }
});

// Virtual for full name
leadSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

leadSchema.set('toJSON', { virtuals: true });

// Indexes
leadSchema.index({ company_ref: 1, status: 1 });
leadSchema.index({ company_ref: 1, assignedTo: 1 });
leadSchema.index({ company_ref: 1, createdAt: -1 });
leadSchema.index({ email: 1, company_ref: 1 });

module.exports = mongoose.model('Lead', leadSchema);
