const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Call', 'Email', 'WhatsApp', 'Meeting', 'Note', 'Follow-up', 'Task', 'Status Change', 'Deal Created', 'Deal Won', 'Deal Lost', 'Lead Created', 'Customer Created', 'Quote Sent'],
    required: true
  },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  outcome: { type: String, default: '' },
  duration: { type: Number, default: 0 }, // in minutes
  relatedLead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  relatedCustomer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  relatedDeal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },
  relatedContact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
  relatedTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  scheduledAt: { type: Date },
  completedAt: { type: Date },
  metadata: { type: mongoose.Schema.Types.Mixed },
  company_ref: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

activitySchema.index({ company_ref: 1, createdAt: -1 });
activitySchema.index({ relatedLead: 1, createdAt: -1 });
activitySchema.index({ relatedCustomer: 1, createdAt: -1 });
activitySchema.index({ relatedDeal: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
