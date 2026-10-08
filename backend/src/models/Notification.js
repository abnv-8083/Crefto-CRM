const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['lead_assigned', 'lead_status_changed', 'follow_up_due', 'task_due', 'task_assigned', 'deal_won', 'deal_lost', 'meeting_reminder', 'overdue_task', 'general'],
    default: 'general'
  },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  relatedLead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  relatedCustomer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  relatedDeal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },
  relatedTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  relatedFollowUp: { type: mongoose.Schema.Types.ObjectId, ref: 'FollowUp' },
  actionUrl: { type: String, default: '' },
  company_ref: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ company_ref: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
