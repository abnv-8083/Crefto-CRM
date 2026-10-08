const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customerId: { type: String, unique: true },
  name: { type: String, required: true, trim: true },
  company: { type: String, trim: true, default: '' },
  email: { type: String, lowercase: true, trim: true, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  country: { type: String, default: '' },
  industry: { type: String, default: '' },
  customerType: { type: String, enum: ['Individual', 'Business'], default: 'Individual' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  totalDeals: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  lastContact: { type: Date },
  customerSince: { type: Date, default: Date.now },
  notes: { type: String, default: '' },
  tags: [{ type: String }],
  website: { type: String, default: '' },
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  status: { type: String, enum: ['active', 'inactive', 'churned'], default: 'active' },
  company_ref: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

customerSchema.pre('save', async function () {
  if (!this.customerId) {
    const count = await mongoose.model('Customer').countDocuments({ company_ref: this.company_ref });
    this.customerId = `CUST-${String(count + 1).padStart(4, '0')}`;
  }
});

customerSchema.index({ company_ref: 1, status: 1 });
customerSchema.index({ company_ref: 1, createdAt: -1 });

module.exports = mongoose.model('Customer', customerSchema);
