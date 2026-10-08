const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  logo: { type: String, default: '' },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  country: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  website: { type: String, default: '' },
  currency: { type: String, default: 'USD' },
  timezone: { type: String, default: 'UTC' },
  industry: { type: String, default: '' },
  size: { type: String, default: '' },
  status: { type: String, enum: ['active', 'suspended', 'trial'], default: 'active' },
  subscription: {
    plan: { type: String, enum: ['free', 'starter', 'professional', 'enterprise'], default: 'free' },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  settings: {
    leadSources: {
      type: [String],
      default: ['Website', 'Google', 'Facebook', 'Instagram', 'WhatsApp', 'Referral', 'Cold Call', 'Email', 'Advertisement', 'Other']
    },
    leadStatuses: {
      type: [String],
      default: ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Converted', 'Lost']
    },
    dealStages: {
      type: [String],
      default: ['New', 'Qualification', 'Discovery', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']
    },
    customerTypes: { type: [String], default: ['Individual', 'Business'] },
    taskPriorities: { type: [String], default: ['Low', 'Medium', 'High', 'Urgent'] },
    industries: {
      type: [String],
      default: ['Technology', 'Healthcare', 'Finance', 'Real Estate', 'Education', 'Retail', 'Manufacturing', 'Other']
    }
  },
  notifications: {
    emailNotifications: { type: Boolean, default: true },
    taskReminders: { type: Boolean, default: true },
    followUpReminders: { type: Boolean, default: true },
    dealNotifications: { type: Boolean, default: true },
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
