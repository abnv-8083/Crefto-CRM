const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema({
  quoteNumber: { type: String, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  deal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    description: String,
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  }],
  subtotal: { type: Number, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  totalTax: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  validUntil: { type: Date },
  notes: { type: String, default: '' },
  terms: { type: String, default: '' },
  status: { type: String, enum: ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'], default: 'Draft' },
  sentAt: { type: Date },
  acceptedAt: { type: Date },
  rejectedAt: { type: Date },
  company_ref: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

quotationSchema.pre('save', async function () {
  if (!this.quoteNumber) {
    const count = await mongoose.model('Quotation').countDocuments({ company_ref: this.company_ref });
    this.quoteNumber = `QT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
  }
});

quotationSchema.index({ company_ref: 1, status: 1 });
quotationSchema.index({ company_ref: 1, createdAt: -1 });

module.exports = mongoose.model('Quotation', quotationSchema);
