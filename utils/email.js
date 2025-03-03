const axios = require('axios');
require('dotenv').config(); // Load environment variables
const sendEmail = async (to, subject, html) => {
  const data = {
    sender: {name: "Reachly", email: process.env.SENDINBLUE_EMAIL },
    to: [{ email: to }],
    subject: subject,
    htmlContent: html,
  };

  try {
    const response = await axios.post('https://api.sendinblue.com/v3/smtp/email', data, {
      headers: {
        'api-key': process.env.SENDINBLUE_API_KEY,
        'Content-Type': 'application/json',
      },
    });
    console.log('response',response);

    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message);
  }
};

module.exports = sendEmail;
