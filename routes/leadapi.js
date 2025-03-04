const express = require('express');
const router = express.Router(); // Use Router instead of express()
const nodemailer = require('nodemailer');
require('dotenv').config(); // Use dotenv to manage environment variables

const Vendor = require('../models/Vendorform');
const Buyer = require('../models/Buyerform');
const sendEmail = require('../utils/email'); // Import sendEmail function

// Add these email templates at the top of the file after the imports
const sendLeadsAssignedEmail = async (vendor, leadsAdded) => {
  const emailText = `
    <html>
      <body>
        <h2>New Leads Added to Your Account</h2>
        <p>Dear ${vendor.firstName} ${vendor.lastName},</p>
        <p>We're pleased to inform you that ${leadsAdded} new leads have been added to your account.</p>
        <p>Current lead balance: ${vendor.leads}</p>
        <p>You can access these leads through your vendor dashboard at any time.</p>
        <p>Best regards,</p>
        <p>The Reachly Team</p>
      </body>
    </html>
  `;
  await sendEmail(vendor.email, 'New Leads Added to Your Account', emailText);
};


const sendMatchNotificationEmails = async (vendor, buyer) => {
  // Email to vendor
  const vendorEmailText = `
    <html>
      <body>
        <h2>New Buyer Match Found!</h2>
        <p>Dear ${vendor.firstName} ${vendor.lastName},</p>
        <p>We've found a new potential match for your services:</p>
        <ul>
          <li>Company: ${buyer.companyName}</li>
          <li>Industry: ${buyer.industries.join(', ')}</li>
        </ul>
        <p>Please log in to your dashboard to review this match and take action.</p>
        <p>Best regards,</p>
        <p>The Reachly Team</p>
      </body>
    </html>
  `;

  // Email to buyer
  const buyerEmailText = `
    <html>
      <body>
        <h2>New Vendor Match Found!</h2>
        <p>Dear ${buyer.firstName} ${buyer.lastName},</p>
        <p>We've matched you with a vendor that matches your requirements:</p>
        <ul>
          <li>Company: ${vendor.companyName}</li>
          <li>Services: ${vendor.selectedServices.join(', ')}</li>
        </ul>
        <p>The vendor will review your profile and may reach out soon.</p>
        <p>Best regards,</p>
        <p>The Reachly Team</p>
      </body>
    </html>
  `;

  // Email to admin
  const adminEmailText = `
    <html>
      <body>
        <h2>New Match Created</h2>
        <p>A new match has been created:</p>
        <h3>Vendor Details:</h3>
        <ul>
          <li>Name: ${vendor.firstName} ${vendor.lastName}</li>
          <li>Company: ${vendor.companyName}</li>
          <li>Email: ${vendor.email}</li>
        </ul>
        <h3>Buyer Details:</h3>
        <ul>
          <li>Name: ${buyer.firstName} ${buyer.lastName}</li>
          <li>Company: ${buyer.companyName}</li>
          <li>Email: ${buyer.email}</li>
        </ul>
        <p>Best regards,</p>
        <p>The Reachly Team</p>
      </body>
    </html>
  `;

  await Promise.all([
    sendEmail(vendor.email, 'New Buyer Match Found', vendorEmailText),
    sendEmail(buyer.email, 'New Vendor Match Found', buyerEmailText),
    sendEmail('contact@reachly.ca', 'New Match Created - Admin Notification', adminEmailText)
  ]);
};

const sendLeadsLowNotification = async (vendor) => {
  const emailText = `
    <html>
      <body>
        <h2>Low Leads Balance Alert</h2>
        <p>Dear ${vendor.firstName} ${vendor.lastName},</p>
        <p>Your leads balance is now at ${vendor.leads}. To ensure uninterrupted access to new matches, please purchase additional leads.</p>
        <p>You can purchase more leads through your vendor dashboard.</p>
        <p>Best regards,</p>
        <p>The Reachly Team</p>
      </body>
    </html>
  `;
  await sendEmail(vendor.email, 'Low Leads Balance Alert', emailText);
};

// Endpoint to handle Vendor form submission
router.post('/vendor', async (req, res) => {
  try {
    // Check if email already exists in Vendor collection
    const existingVendor = await Vendor.findOne({ email: req.body.email });
    if (existingVendor) {
      return res.status(400).send({ message: 'This email is already registered as a vendor.' });
    }

    // Check if email already exists in Buyer collection
    const existingBuyer = await Buyer.findOne({ email: req.body.email });
    if (existingBuyer) {
      return res.status(400).send({ message: 'This email is already registered as a buyer.' });
    }

    const vendor = new Vendor(req.body);
    await vendor.save();
    // Send vendor welcome email
    const vendorEmailText = `
      <html>
        <body>
          <h2>Welcome to Reachly – Set Up Your Vendor Dashboard</h2>
          <p>Dear ${vendor.firstName} ${vendor.lastName},</p>
          <p>Thank you for signing up with Reachly! We're thrilled you've chosen us to help grow your business through high-quality, ready-to-buy leads. Your decision to work with us means you're on the right path to predictable, scalable revenue.</p>
          <p>To get started, please set up your password and access your Vendor Dashboard, where you can:</p>
          <ul>
            <li>View your matched leads and their details</li>
            <li>Track your engagement history and responses</li>
            <li>Manage your preferences and account settings</li>
          </ul>
          <p>Click below to create your password and log in:</p>
          <p><a href="https://www.reachly.ca/vendor-dashboard-2">Set Up My Vendor Dashboard</a></p>
          <p>We look forward to helping you connect with qualified buyers and drive more revenue. If you have any questions, our team is always here to help at <a href="mailto:support@reachly.ca">support@reachly.ca</a>.</p>
          <p>Welcome aboard!</p>
          <p>The Reachly Team</p>
        </body>
      </html>
    `;
    const adminEmailText = `
  <html>
    <body>
      <h2>New Vendor Registration – Action Required</h2>
      <p>Dear Admin,</p>
      <p>We are pleased to inform you that a new vendor has successfully signed up on Reachly:</p>
      <ul>
        <li><strong>Name:</strong> ${vendor.firstName} ${vendor.lastName}</li>
        <li><strong>Email:</strong> ${vendor.email}</li>
        <li><strong>Company:</strong> ${vendor.companyName}</li>
        <li><strong>Sign-Up Date:</strong> ${new Date().toLocaleDateString()}</li>
      </ul>
      <p>As the admin, you are now responsible for reviewing the vendor's profile and assigning relevant leads to them. Please follow these next steps:</p>
    <ol>
      <li>Log into the admin dashboard to access the vendor's profile.</li>
      <li>Review the matched leads that the platform has automatically assigned based on the vendor's profile and preferences.</li>
      <li>Confirm the matched leads and ensure they are appropriate for the vendor.</li>
      <li>Assign the leads to the vendor so they can begin engaging with them through their dashboard.</li>
      <li>Verify that the vendor has proper access to their Vendor Dashboard and ensure their onboarding is complete.</li>
      </ol>
      <p>Once the leads are assigned, the vendor will be able to track and engage with them directly through their dashboard.</p>
      <p>If you have any internal questions or need to review the process further, please refer to the admin documentation or check the internal guidelines for lead assignment.</p>
      <p>Best regards,</p>
      <p>The Reachly Team</p>
    </body>
  </html>
`;


    await sendEmail(vendor.email.trim(), 'Welcome to Reachly – Set Up Your Vendor Dashboard', vendorEmailText);
    await sendEmail('contact@reachly.ca', 'New Vendor Registration - Admin Notification', adminEmailText);

    // Respond to the client only after emails are sent
    res.status(201).send({ message: 'Request submitted. Please check your email for further instructions.' });
  } catch (error) {
    // If there's any error, respond with error message
    res.status(400).send({ error: 'Error submitting vendor form', details: error.message });
  }
});

router.post('/buyer', async (req, res) => {
  try {
    // Check if email already exists in Buyer collection
    const existingBuyer = await Buyer.findOne({ email: req.body.email });
    if (existingBuyer) {
      return res.status(400).send({ message: 'This email is already registered as a buyer.' });
    }

    // Check if email already exists in Vendor collection
    const existingVendor = await Vendor.findOne({ email: req.body.email });
    if (existingVendor) {
      return res.status(400).send({ message: 'This email is already registered as a vendor.' });
    }

    const buyer = new Buyer(req.body);
    await buyer.save();
    
    const buyerEmailText = `
      <html>
        <body>
          <h2>Welcome to Reachly! Connect with Top SaaS Vendors</h2>
          <p>Dear ${buyer.firstName},</p>
          <p>Thank you for signing up with Reachly! We're excited to connect you with top SaaS vendors who can help elevate your business. By choosing Reachly, you gain direct access to pre-vetted solutions that align with your needs.</p>
          <p>To get started, create your password and log in to your Buyer Dashboard, where you can:</p>
          <ul>
            <li>View the vendors you've been matched with</li>
            <li>Access their contact details and proposals</li>
            <li>Track and manage your inquiries seamlessly</li>
          </ul>
          <p>Click below to create your password and access your dashboard:</p>
          <p><a href="https://www.reachly.ca/buyer-dashboard">Set Up My Buyer Dashboard</a></p>
          <p>We're here to make your SaaS vendor selection process easier, faster, and more effective. If you have any questions, feel free to reach out at <a href="mailto:support@reachly.ca">support@reachly.ca</a>.</p>
          <p>We can't wait to help you find the perfect solution!</p>
          <p>The Reachly Team</p>
        </body>
      </html>
    `;
    const adminBuyerEmailText = `
  <html>
    <body>
      <h2>New Buyer Registration – Action Required</h2>
      <p>Dear Admin,</p>
      <p>We are excited to inform you that a new buyer has successfully signed up on Reachly:</p>
      <ul>
        <li><strong>Name:</strong> ${buyer.firstName} ${buyer.lastName}</li>
        <li><strong>Email:</strong> ${buyer.email}</li>
        <li><strong>Company:</strong> ${buyer.companyName}</li>
        <li><strong>Sign-Up Date:</strong> ${new Date().toLocaleDateString()}</li>
      </ul>
      <p>As the admin, please review the buyer's profile and ensure that their preferences and requirements are properly recorded. This will help to ensure they are matched with the most relevant vendors.</p>
      <p>Once the buyer's profile is reviewed, they will be automatically matched with the most suitable vendors based on their needs, and they can begin interacting with them via their Buyer Dashboard.</p>
      <p>Best regards,</p>
      <p>The Reachly Team</p>
    </body>
  </html>
`;

    await sendEmail('contact@reachly.ca', 'New Buyer Registration - Admin Notification', adminBuyerEmailText);
    
    await sendEmail(buyer.email, 'Welcome to Reachly! Connect with Top SaaS Vendors', buyerEmailText);
    
    // Respond to the client only after emails are sent
    res.status(201).send({ message: 'Request submitted. Please check your email for further instructions' });
  } catch (error) {
    // Handle any errors and send a detailed response
    res.status(400).send({ error: 'Error submitting buyer form', details: error.message });
  }
});


router.get('/getdata', async (req, res) => {
  try {
    const vendors = await Vendor.find({});
    const buyers = await Buyer.find({});

    const matchedVendors = [];
    const notMatchedVendors = [];
    const matchedBuyers = [];
    const notMatchedBuyers = [];

    let totalMatchedVendors = 0;
    let totalNotMatchedVendors = 0;
    let totalMatchedBuyers = 0;
    let totalNotMatchedBuyers = 0;

    // Process vendors to find matched and unmatched buyers
    vendors.forEach((vendor) => {
      const matchedVendorBuyers = [];
      buyers.forEach((buyer) => {
        const matchReasons = [];

        // Check for industryMatch
        const matchedIndustries = vendor.selectedIndustries.filter(
          (industry) => buyer.industries.includes(industry)
        );

        if (matchedIndustries.length > 0) {
          // If industryMatches, check for serviceMatch
          const matchedServices = buyer.services
            .filter((buyerService) =>
              vendor.selectedServices.includes(buyerService.service) && buyerService.active


            )
            .map((matchedService) => matchedService.service);

          if (matchedServices.length > 0) {
            matchReasons.push(
              `industryMatch: ${matchedIndustries.join(', ')}`,
              `serviceMatch: ${matchedServices.join(', ')}`
            );

            matchedVendorBuyers.push({
              buyer,
              matchReasons,
            });
          }
        }
      });

      if (matchedVendorBuyers.length > 0) {
        matchedVendors.push({
          vendor,
          matchedBuyers: matchedVendorBuyers,
        });
        totalMatchedVendors++;
      } else {
        notMatchedVendors.push(vendor);
        totalNotMatchedVendors++;
      }
    });

    // Process buyers to find matched and unmatched vendors
    buyers.forEach((buyer) => {
      const matchedBuyerVendors = [];
      vendors.forEach((vendor) => {
        const matchReasons = [];

        // Check for industryMatch
        const matchedIndustries = vendor.selectedIndustries.filter(
          (industry) => buyer.industries.includes(industry)
        );

        if (matchedIndustries.length > 0) {
          // If industryMatches, check for serviceMatch
          const matchedServices = buyer.services
            .filter((buyerService) =>
              vendor.selectedServices.includes(buyerService.service) && buyerService.active


            )
            .map((matchedService) => matchedService.service);

          if (matchedServices.length > 0) {
            matchReasons.push(
              `industryMatch: ${matchedIndustries.join(', ')}`,
              `serviceMatch: ${matchedServices.join(', ')}`
            );

            matchedBuyerVendors.push({
              vendor,
              matchReasons,
            });
          }
        }
      });

      if (matchedBuyerVendors.length > 0) {
        matchedBuyers.push({
          buyer,
          matchedVendors: matchedBuyerVendors,
        });
        totalMatchedBuyers++;
      } else {
        notMatchedBuyers.push(buyer);
        totalNotMatchedBuyers++;
      }
    });

    // After finding matches, send notifications for new matches
    for (const matchedVendor of matchedVendors) {
      const vendor = matchedVendor.vendor;
      for (const matchedBuyer of matchedVendor.matchedBuyers) {
        const buyer = matchedBuyer.buyer;
        
        // Check if this is a new match (not already in vendor's matchedBuyers)
        const existingMatch = vendor.matchedBuyers?.find(mb => mb.buyerEmail === buyer.email);
      }
    }

    // Send the response with total match counts
    res.send({
      buyer: {
        matched: matchedBuyers,
        notMatched: notMatchedBuyers,
        totalMatches: totalMatchedBuyers,
        totalNotMatched: totalNotMatchedBuyers,
      },
      vendor: {
        matched: matchedVendors,
        notMatched: notMatchedVendors,
        totalMatches: totalMatchedVendors,
        totalNotMatched: totalNotMatchedVendors,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Error processing data', details: error });
  }
});
router.put('/vendor/:vendorEmail/match/:buyerEmail', async (req, res) => {
  const { vendorEmail, buyerEmail } = req.params;
  const { status } = req.body;

  try {
    const vendor = await Vendor.findOne({ email: vendorEmail }).populate('matchedBuyers.buyer');
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const buyer = await Buyer.findOne({ email: buyerEmail });
    if (!buyer) {
      return res.status(404).json({ error: 'Buyer not found' });
    }

    // Find if buyer is already in matchedBuyers list
    const matchIndex = vendor.matchedBuyers.findIndex(mb => mb.buyer._id.toString() === buyer._id.toString());
    const isNewMatch = matchIndex === -1;

    // Handle lead deduction for 'accepted' status
    if (status === 'accepted') {
      // Check if vendor has enough leads
      if (vendor.leads <= 0) {
        return res.status(400).json({ error: 'Insufficient leads. Please purchase more leads to accept matches.' });
      }

      // Check if match was already accepted to prevent double deduction
      if (matchIndex !== -1 && vendor.matchedBuyers[matchIndex].status === 'accepted') {
        return res.status(400).json({ error: 'Match already accepted' });
      }

      // Deduct one lead for accepting the match
      vendor.leads -= 1;

      // Send low leads notification if balance is low
      if (vendor.leads <= 1) {
        await sendLeadsLowNotification(vendor);
      }
    }

    if (matchIndex !== -1) {
      // Update status if the buyer is already in the list
      vendor.matchedBuyers[matchIndex].status = status;
    } else {
      // Add new matched buyer if not found
      vendor.matchedBuyers.push({ 
        buyer: buyer._id, 
        buyerEmail: buyer.email,
        buyerName: buyer.firstName + ' ' + buyer.lastName,
        companyName: buyer.companyName, 
        status 
      });
    }

    await vendor.save();

    // Send match notification emails if this is a new match

    res.json({ 
      message: 'Match status updated successfully', 
      matchedBuyers: vendor.matchedBuyers,
      remainingLeads: vendor.leads
    });

  } catch (error) {
    console.error('Error updating match status:', error);
    res.status(500).json({ error: 'Error updating match status', details: error.message });
  }
});
router.put('/buyer/services/email/:email/:serviceId', async (req, res) => {
  try {
    const { email, serviceId } = req.params;
    const updatedService = req.body;

    const buyer = await Buyer.findOne({ email });
    if (!buyer) {
      return res.status(404).send({ message: 'Buyer not found' });
    }

    // Find the service by ID and update it
    const serviceIndex = buyer.services.findIndex(service => service._id.toString() === serviceId);
    if (serviceIndex === -1) {
      return res.status(404).send({ message: 'Service not found' });
    }

    // Update the specific service
    buyer.services[serviceIndex] = { 
      ...buyer.services[serviceIndex], 
      ...updatedService 
    };

    await buyer.save();

    res.status(200).send({ 
      message: 'Service updated successfully', 
      service: buyer.services[serviceIndex] 
    });
  } catch (error) {
    res.status(500).send({ 
      error: 'Error updating service', 
      details: error.message 
    });
  }
});

// Update service status
router.patch('/buyer/:email/services/:serviceId', async (req, res) => {
  try {
    const { email, serviceId } = req.params;
    const { isActive } = req.body;

    const buyer = await Buyer.findOne({ email });
    if (!buyer) {
      return res.status(404).json({ error: 'Buyer not found' });
    }

    const serviceIndex = buyer.services.findIndex(service => service._id.toString() === serviceId);
    if (serviceIndex === -1) {
      return res.status(404).json({ error: 'Service not found' });
    }

    buyer.services[serviceIndex].active = isActive;
    await buyer.save();

    res.json({ message: 'Service status updated successfully', service: buyer.services[serviceIndex] });
  } catch (error) {
    console.error('Error updating service status:', error);
    res.status(500).json({ error: 'Error updating service status', details: error.message });
  }
});

// Update service details
router.put('/buyer/services/email/:email', async (req, res) => {
  try {
    const { services } = req.body;
    const { email } = req.params;

    if (!Array.isArray(services)) {
      return res.status(400).send({ message: 'Services must be an array' });
    }

    // Validate each service object
    const isValidServices = services.every(service => 
      service.service && service.timeframe && service.budget
    );

    if (!isValidServices) {
      return res.status(400).send({ 
        message: 'Each service must include service name, timeframe, and budget' 
      });
    }

    const buyer = await Buyer.findOne({ email });
    if (!buyer) {
      return res.status(404).send({ message: 'Buyer not found' });
    }

    // Update services and set them as active
    buyer.services = services.map(service => ({
      ...service,
      active: true
    }));

    await buyer.save();

    res.status(200).send({ 
      message: 'Services updated successfully',
      services: buyer.services
    });
  } catch (error) {
    res.status(500).send({ 
      error: 'Error updating buyer services', 
      details: error.message 
    });
  }
});


router.get('/buyer/:email/matches', async (req, res) => {
  const { email } = req.params;

  try {
    // Find the buyer by email
    const buyer = await Buyer.findOne({ email });

    if (!buyer) {
      return res.status(404).send({ error: 'Buyer not found' });
    }

    // Find all vendors
    const vendors = await Vendor.find({});
    const matchedVendors = [];

    vendors.forEach((vendor) => {
      const matchReasons = [];

      // Check for industryMatch
      const matchedIndustries = vendor.selectedIndustries.filter(
        (industry) => buyer.industries.includes(industry)
      );

      if (matchedIndustries.length > 0) {
        // Check for serviceMatch
        const matchedServices = buyer.services
          .filter((buyerService) => 
            vendor.selectedServices.includes(buyerService.service) && buyerService.active


          )
          .map((matchedService) => matchedService.service);

        if (matchedServices.length > 0) {
          matchReasons.push(`industryMatch: ${matchedIndustries.join(', ')}`);
          matchReasons.push(`serviceMatch: ${matchedServices.join(', ')}`);
        }
      } // <-- The extra parenthesis was removed from here

      // Add to matched vendors if there are match reasons and vendor hasn't rejected the buyer
      if (matchReasons.length > 0) {
        // Check if this vendor has rejected the buyer
        const buyerMatch = vendor.matchedBuyers.find(mb => mb.buyerEmail === buyer.email);
        if (!buyerMatch || buyerMatch.status !== 'rejected') {
          matchedVendors.push({
            vendor,
            matchReasons,
          });
        }
      }
    });

    // Send the matched vendors along with the buyer data
    res.send({
      buyer,
      matchedVendors,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Error processing data', details: error });
  }
});

// get all vendors 
router.get('/getAllVendors', async function (req, res) {
  try {
    const vendors = await Vendor.find({}).populate('matchedBuyers.buyer');
    const buyers = await Buyer.find({});
    const vendorData = vendors.map((vendor) => {
      // Get all matched buyers with their status
      const existingMatches = vendor.matchedBuyers || [];
      
      // Calculate buyer statistics
      const acceptedBuyers = existingMatches.filter(mb => mb.status === 'accepted').length;
      const rejectedBuyers = existingMatches.filter(mb => mb.status === 'rejected').length;
      const pendingBuyers = existingMatches.filter(mb => !mb.status || mb.status === 'pending').length;
      
      const matchedBuyers = buyers
        .map((buyer) => {
          const matchReasons = [];
          const existingMatch = existingMatches.find(mb => mb.buyerEmail === buyer.email);

          // Check for industryMatch
          const matchedIndustries = vendor.selectedIndustries.filter(
            (industry) => buyer.industries.includes(industry)
          );
          if (matchedIndustries.length > 0) {
            // Check for serviceMatch
            const matchedServices = buyer.services
              .filter((buyerService) =>
                vendor.selectedServices.includes(buyerService.service) && buyerService.active


              )
              .map((matchedService) => matchedService.service);
            if (matchedServices.length > 0) {
              matchReasons.push(`industryMatch: ${matchedIndustries.join(', ')}`);
              matchReasons.push(`serviceMatch: ${matchedServices.join(', ')}`);
            }
          }

          if (matchReasons.length > 0) {
            return {
              buyer,
              matchReasons,
              status: existingMatch ? existingMatch.status : 'pending'
            };
          }
          return null;
        })
        .filter((match) => match !== null);

      return {
        vendor: {
          ...vendor.toObject(),
          acceptedBuyers,
          rejectedBuyers,
          pendingBuyers,
          totalMatches: matchedBuyers.length
        },
        matchedBuyers,
      };
    });

    res.send({ msg: 'All Vendors Data', vendors: vendorData });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Error fetching vendors', details: error });
  }
});

// Update the getAllBuyers route
router.get('/getAllBuyers', async function (req, res) {
  try {
    const buyers = await Buyer.find({});
    const vendors = await Vendor.find({}).populate('matchedBuyers.buyer');

    const buyerData = buyers.map((buyer) => {
      // Find all vendors that have matched with this buyer
      const matchedVendors = vendors.filter(vendor => 
        vendor.matchedBuyers.some(mb => mb.buyerEmail === buyer.email)
      ).map(vendor => {
        const matchStatus = vendor.matchedBuyers.find(mb => mb.buyerEmail === buyer.email);
        return {
          vendor: {
            _id: vendor._id,
            companyName: vendor.companyName,
            firstName: vendor.firstName,
            lastName: vendor.lastName,
            email: vendor.email,
            selectedIndustries: vendor.selectedIndustries,
            selectedServices: vendor.selectedServices
          },
          status: matchStatus ? matchStatus.status : 'pending'
        };
      });

      // Calculate vendor statistics
      const acceptedVendors = matchedVendors.filter(mv => mv.status === 'accepted').length;
      const rejectedVendors = matchedVendors.filter(mv => mv.status === 'rejected').length;
      const pendingVendors = matchedVendors.filter(mv => !mv.status || mv.status === 'pending').length;

      return {
        buyer: {
          ...buyer.toObject(),
          acceptedVendors,
          rejectedVendors,
          pendingVendors,
          totalMatches: matchedVendors.length
        },
        matchedVendors
      };
    });

    res.send({ msg: 'All Buyers Data', buyers: buyerData });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Error fetching buyers', details: error });
  }
});


// update vendor data
router.put('/updateVendor/:email', async function (req, res) {
  const { email } = req.params;
  try {
    const vendor = await Vendor.findOne
    ({ email: email });
    if (!vendor) {
      return res.status(404).send({ error: 'Vendor not found' });
    }
    const updatedVendor = await Vendor
     .findOneAndUpdate(
        { email },
        {...req.body },
        { new: true }
      )
      //.populate('selectedServices.service')
      .exec();
      
    res.send({ msg: 'Vendor data updated successfully', vendor: updatedVendor });
    
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Error updating vendor data', details: error });
  }
}
);

// update buyer data
router.put('/updateBuyer/:email', async function (req, res) {
  const { email } = req.params;
  try {
    const buyer = await Buyer.findOne
    ({ email: email });
    if (!buyer) {
      return res.status(404).send({ error: 'Buyer not found' });
    }
    const updatedBuyer = await Buyer
     .findOneAndUpdate(
        { email },
        {...req.body },
        { new: true }
      )
      //.populate('selectedServices.service')
      .exec();
      
    res.send({ msg: 'Buyer data updated successfully', buyer: updatedBuyer });
    
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Error updating buyer data', details: error });
  }
}
);

// Endpoint to fetch vendor data by email
router.get('/vendor/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const vendor = await Vendor.findOne({ email });
    if (!vendor) {
      return res.status(404).send({ error: 'Vendor not found' });
    }
    res.send(vendor);
  } catch (error) {
    res.status(500).send({ error: 'Error fetching vendor data', details: error.message });
  }
});

// Endpoint to fetch buyer data by email
router.get('/buyer/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const buyer = await Buyer.findOne({ email });
    if (!buyer) {
      return res.status(404).send({ error: 'Buyer not found' });
    }
    res.send(buyer);
  } catch (error) {
    res.status(500).send({ error: 'Error fetching buyer data', details: error.message });
  }
});
router.get('/vendor/:email/matches', async (req, res) => {
  const { email } = req.params;

  try {
    // Find the vendor by email
    const vendor = await Vendor.findOne({ email }).populate('matchedBuyers.buyer');

    if (!vendor) {
      return res.status(404).send({ error: 'Vendor not found' });
    }

    // Find all buyers
    const buyers = await Buyer.find({});
    const matchedBuyers = [];

    buyers.forEach((buyer) => {
      const matchReasons = [];

      // Check if the vendor has already accepted the buyer
      const isAccepted = vendor.matchedBuyers.some(
        (matched) => matched.buyerEmail === buyer.email && matched.status === 'accepted'
      );

      // Check for industryMatch
      const matchedIndustries = vendor.selectedIndustries.filter(
        (industry) => buyer.industries.includes(industry)
      );
      if (matchedIndustries.length > 0) {
        // Check for serviceMatch (include inactive services if accepted)
        const matchedServices = buyer.services
          .filter((buyerService) =>
            vendor.selectedServices.includes(buyerService.service) && (buyerService.active || isAccepted)
          )
          .map((matchedService) => matchedService.service);

        if (matchedServices.length > 0) {
          matchReasons.push(`industryMatch: ${matchedIndustries.join(', ')}`);
          matchReasons.push(`serviceMatch: ${matchedServices.join(', ')}`);
        }
      }

      // Add to matched buyers if there are match reasons
      if (matchReasons.length > 0) {
        matchedBuyers.push({
          buyer,
          matchReasons,
          status: isAccepted ? 'accepted' : 'pending',
        });
      }
    });

    // Send the matched buyers along with the vendor data
    res.send({
      vendor,
      matchedBuyers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Error processing data', details: error });
  }
});


// Add leads to a vendor
router.post('/addLeads/:email', async (req, res) => {
  const { email } = req.params;
  const { leads } = req.body;

  try {
    const vendor = await Vendor.findOne({ email });
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const previousLeads = vendor.leads || 0;
    vendor.leads = previousLeads + parseInt(leads);
    await vendor.save();

    // Send email notification
    await sendLeadsAssignedEmail(vendor, leads);

    res.json({ 
      message: 'Leads added successfully', 
      vendor: vendor 
    });
  } catch (error) {
    console.error('Error adding leads:', error);
    res.status(500).json({ error: 'Error adding leads', details: error.message });
  }
});

// Get remaining leads for a vendor
router.get('/leads/:email', async (req, res) => {
  const { email } = req.params;

  try {
    const vendor = await Vendor.findOne({ email });
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json({ 
      leads: vendor.leads || 0
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Error fetching leads', details: error.message });
  }
});

module.exports = router;
