const nodemailer = require('nodemailer');

// Configure nodemailer with your email service credentials
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME, // Your email address
    pass: process.env.EMAIL_PASSWORD // Your email password
  }
});

// Function to send email
async function sendEmail({ to, subject, text }) {
  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: to,
    subject: subject,
    text: text
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error; // This will need to be handled by the caller
  }
}

// Export the function so it can be used by other parts of your application
module.exports = { sendEmail };
