const mongoose = require('mongoose');

const pipelineSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  stages: [{
    name: { type: String, required: true },
    order: { type: Number, required: true },
    color: { type: String, default: '#6366F1' },
    probability: { type: Number, default: 0, min: 0, max: 100 },
  }],
  isDefault: { type: Boolean, default: false },
  company_ref: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Pipeline', pipelineSchema);
