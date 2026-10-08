const mongoose = require('mongoose');

const demoRequestSchema = new mongoose.Schema({
  requestId: { type: String, unique: true },
  title: { type: String, required: true, trim: true },
  // Client details captured by the sales rep
  clientName: { type: String, required: true, trim: true },
  clientEmail: { type: String, default: '', trim: true },
  clientPhone: { type: String, default: '', trim: true },
  clientCompany: { type: String, default: '', trim: true },
  description: { type: String, default: '' },
  // Pipeline status
  status: {
    type: String,
    enum: ['requested', 'in_progress', 'delivered'],
    default: 'requested',
  },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Delivery sent back by the developer once the demo is finished
  demoVideo: { type: String, default: '' },
  demoPhoto: { type: String, default: '' },
  demoLink: { type: String, default: '' },
  deliveryNotes: { type: String, default: '' },
  deliveredAt: Date,
  company_ref: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

demoRequestSchema.index({ company_ref: 1, status: 1, createdAt: -1 });
demoRequestSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('DemoRequest', demoRequestSchema);
