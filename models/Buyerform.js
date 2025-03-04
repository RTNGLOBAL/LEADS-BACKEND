const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  service: { type: String, required: true },
  timeframe: { type: String, required: true },
  budget: { type: String, required: true },
  active: { type: Boolean, default: true }
});

const BuyerSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  companyWebsite: { type: String, required: true },
  companySize: { type: String, required: true },
  industries: { type: [String], required: true }, // Change from single industry to multiple industries
  additionalInfo: { type: String },
  services: { type: [ServiceSchema], required: true },
  active: { type: Boolean, default: true }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Buyer', BuyerSchema);
