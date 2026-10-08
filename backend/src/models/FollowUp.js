const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  notes: { type: String, default: '' },
  scheduledAt: { type: Date, required: true },
  reminderAt: { type: Date },
  completedAt: { type: Date },
  status: { type: String, enum: ['Pending', 'Completed', 'Overdue', 'Rescheduled', 'Cancelled'], default: 'Pending' },
  type: { type: String, enum: ['Call', 'Email', 'Meeting', 'WhatsApp', 'Other'], default: 'Call' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  relatedLead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  relatedCustomer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  relatedDeal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },
  rescheduledFrom: { type: Date },
  company_ref: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

followUpSchema.index({ company_ref: 1, scheduledAt: 1 });
followUpSchema.index({ company_ref: 1, assignedTo: 1, status: 1 });

module.exports = mongoose.model('FollowUp', followUpSchema);
