const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  dealId: { type: String, unique: true },
  name: { type: String, required: true, trim: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  contact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
  value: { type: Number, default: 0 },
  probability: { type: Number, default: 0, min: 0, max: 100 },
  expectedClosingDate: { type: Date },
  actualClosingDate: { type: Date },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  stage: {
    type: String,
    enum: ['New', 'Qualification', 'Discovery', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
    default: 'New'
  },
  pipeline: { type: mongoose.Schema.Types.ObjectId, ref: 'Pipeline' },
  source: { type: String, default: '' },
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    quantity: { type: Number, default: 1 },
    price: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  }],
  notes: { type: String, default: '' },
  tags: [{ type: String }],
  lostReason: { type: String, default: '' },
  wonAt: { type: Date },
  lostAt: { type: Date },
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  stageOrder: { type: Number, default: 0 },
  company_ref: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

dealSchema.pre('save', async function () {
  if (!this.dealId) {
    const count = await mongoose.model('Deal').countDocuments({ company_ref: this.company_ref });
    this.dealId = `DEAL-${String(count + 1).padStart(4, '0')}`;
  }
});

// Weighted value virtual
dealSchema.virtual('weightedValue').get(function () {
  return (this.value * this.probability) / 100;
});

dealSchema.set('toJSON', { virtuals: true });

dealSchema.index({ company_ref: 1, stage: 1 });
dealSchema.index({ company_ref: 1, assignedTo: 1 });
dealSchema.index({ company_ref: 1, createdAt: -1 });

module.exports = mongoose.model('Deal', dealSchema);
