const mongoose = require('mongoose');

const VendorSchema = new mongoose.Schema({
  leads: { type: Number, default: 0 },
  companyName: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  companyWebsite: { type: String, required: true },
  minimumBudget: { type: Number, required: true },
  selectedIndustries: { type: [String], required: true },
  selectedServices: { type: [String], required: true },
  additionalInfo: { type: String },
  agreeToTerms: { type: Boolean, required: true },
  matchedBuyers: [
    {
      buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer' },
      buyerEmail: { type: String},
      companyName: { type: String},
      buyerName: { type: String},
      status: { type: String}
    }
  ]
}, {
  timestamps: true,
});

module.exports = mongoose.model('Vendor', VendorSchema);
