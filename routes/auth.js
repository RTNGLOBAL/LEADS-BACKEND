const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Buyer = require('../models/Buyerform');
const Vendor = require('../models/Vendorform');
const sendEmail = require('../utils/email');

const sendStatusChangeEmail = async (user, newStatus) => {
  const emailText = `
    <html>
      <body>
        <h2>Account Status Update</h2>
        <p>Dear ${user.firstName} ${user.lastName},</p>
        <p>Your account status has been updated to: ${newStatus ? 'Active' : 'Inactive'}</p>
        <p>If you have any questions about this change, please contact our support team.</p>
        <p>Best regards,</p>
        <p>The Reachly Team</p>
      </body>
    </html>
  `;
  await sendEmail(user.email, 'Account Status Update', emailText);
};
// Signup route
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Check if email exists in Buyer or Vendor collection
    const existingBuyer = await Buyer.findOne({ email });
    const existingVendor = await Vendor.findOne({ email });

    if (!existingBuyer && !existingVendor) {
      return res.status(400).json({ message: 'Please fill out the buyer or vendor form first' });
    }

    // Check activation status only for the existing account type
    if (existingBuyer && !existingBuyer.active) {
      return res.status(403).json({ 
        message: 'Your buyer account is not active. Please contact support.' 
      });
    }

    if (existingVendor && !existingVendor.active) {
      return res.status(403).json({ 
        message: 'Your vendor account is not active. Please contact support.' 
      });
    }

    let role, name;
    if (existingBuyer) {
      role = 'buyer';
      name = `${existingBuyer.firstName} ${existingBuyer.lastName}`;
    } else if (existingVendor) {
      role = 'vendor';
      name = `${existingVendor.firstName} ${existingVendor.lastName}`;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user with active status matching their buyer/vendor status
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      active: existingBuyer ? existingBuyer.active : existingVendor.active
    });

    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      role: user.role,
      email: user.email,
      message: 'User created successfully'
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Please check your credentials and try again' });
    }

    // Check if user is active
    if (!user.active) {
      return res.status(403).json({ 
        message: 'Your account is not active. Please contact support.' 
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Please check your credentials and try again' });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      role: user.role,
      email: user.email,
      message: 'Logged in successfully'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Update the toggle-activation route
router.post('/toggle-activation/:email', async (req, res) => {
  try {
    const buyer = await Buyer.findOne({ email: req.params.email });
    const vendor = await Vendor.findOne({ email: req.params.email });
    const user = await User.findOne({ email: req.params.email });

    if (!buyer && !vendor) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update buyer if exists
    if (buyer) {
      buyer.active = !buyer.active;
      await buyer.save();
      await sendStatusChangeEmail(buyer, buyer.active);
      
    }

    // Update vendor if exists
    if (vendor) {
      vendor.active = !vendor.active;
      await vendor.save();
      await sendStatusChangeEmail(vendor, vendor.active);
    }

    // Update user if exists
    if (user) {
      user.active = buyer?.active || vendor?.active || false;
      await user.save();
    }

    // Determine the active status from either buyer or vendor
    const isActive = buyer?.active || vendor?.active || false;

    res.json({ 
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      active: isActive
    });

  } catch (error) {
    console.error('Toggle activation error:', error);
    res.status(500).json({ message: 'Error toggling user activation' });
  }
});

// Add this new route
router.get('/user/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ active: user.active });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ message: 'Error getting user status' });
  }
});

module.exports = router;