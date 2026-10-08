const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  relatedLead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  relatedCustomer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  relatedDeal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'], default: 'Pending' },
  dueDate: { type: Date },
  completedAt: { type: Date },
  reminder: { type: Date },
  tags: [{ type: String }],
  company_ref: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

taskSchema.index({ company_ref: 1, status: 1 });
taskSchema.index({ company_ref: 1, assignedTo: 1 });
taskSchema.index({ company_ref: 1, dueDate: 1 });

module.exports = mongoose.model('Task', taskSchema);
