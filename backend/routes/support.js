const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { authMiddleware } = require('../utils/authUtils');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Create email transporter
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('📧 Email configuration missing - using mock transporter');
    return {
      sendMail: (options) => {
        console.log('📧 Support email would be sent:', {
          to: options.to,
          subject: options.subject,
          from: options.from
        });
        return Promise.resolve({ messageId: 'mock-email-id' });
      }
    };
  }

  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Submit support request
router.post('/submit', authMiddleware, upload.single('screenshot'), async (req, res) => {
  try {
    const { role, issueType, description } = req.body;
    const user = req.user;

    // Validate required fields
    if (!role || !issueType || !description) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (description.length < 500) {
      return res.status(400).json({ message: 'Description must be at least 500 characters' });
    }

    let screenshotUrl = null;

    // Upload screenshot to Cloudinary if provided
    if (req.file) {
      try {
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;
        
        const uploadResult = await cloudinary.uploader.upload(dataURI, {
          folder: 'support_screenshots',
          resource_type: 'auto'
        });
        
        screenshotUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('Error uploading screenshot:', uploadError);
        // Continue without screenshot if upload fails
      }
    }

    // Send email to support team
    const transporter = createTransporter();
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
        <div style="background: black; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Support Request</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-bottom: 20px;">New Support Request</h2>
          
          <div style="margin-bottom: 20px;">
            <strong style="color: #666;">From:</strong><br/>
            <span style="color: #333;">${user.name} (${user.email})</span>
          </div>
          
          <div style="margin-bottom: 20px;">
            <strong style="color: #666;">Role:</strong><br/>
            <span style="color: #333;">${role}</span>
          </div>
          
          <div style="margin-bottom: 20px;">
            <strong style="color: #666;">Issue Type:</strong><br/>
            <span style="color: #333;">${issueType}</span>
          </div>
          
          <div style="margin-bottom: 20px;">
            <strong style="color: #666;">Description:</strong><br/>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; color: #333; white-space: pre-wrap; margin-top: 10px;">
              ${description}
            </div>
          </div>
          
          ${screenshotUrl ? `
            <div style="margin-bottom: 20px;">
              <strong style="color: #666;">Screenshot:</strong><br/>
              <a href="${screenshotUrl}" style="color: #7878E9; text-decoration: none;">View Screenshot</a>
            </div>
          ` : ''}
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #999; font-size: 12px;">
            <p>User ID: ${user._id}</p>
            <p>Submitted: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'cs@indulgeout.com',
      cc: user.email, // Send copy to user
      subject: `Support Request: ${issueType} - ${user.name}`,
      html: emailHtml
    });

    res.json({ 
      message: 'Support request submitted successfully',
      success: true 
    });

  } catch (error) {
    console.error('Error submitting support request:', error);
    res.status(500).json({ 
      message: 'Failed to submit support request. Please try again.',
      error: error.message 
    });
  }
});

// Contact form submission (no auth required)
router.post('/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // Send email to support team
    const transporter = createTransporter();
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
        <div style="background: black; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Contact Form Submission</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-bottom: 20px;">New Contact Message</h2>
          
          <div style="margin-bottom: 20px;">
            <strong style="color: #666;">From:</strong><br/>
            <span style="color: #333;">${name}</span>
          </div>
          
          <div style="margin-bottom: 20px;">
            <strong style="color: #666;">Email:</strong><br/>
            <span style="color: #333;">${email}</span>
          </div>
          
          <div style="margin-bottom: 20px;">
            <strong style="color: #666;">Message:</strong><br/>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; color: #333; white-space: pre-wrap; margin-top: 10px;">
              ${message}
            </div>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #999; font-size: 12px;">
            <p>Submitted: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'cs@indulgeout.com',
      replyTo: email, // Allow direct reply to user
      subject: `Contact Form: ${name}`,
      html: emailHtml
    });

    res.json({ 
      message: 'Message sent successfully',
      success: true 
    });

  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({ 
      message: 'Failed to send message. Please try again.',
      error: error.message 
    });
  }
});

module.exports = router;
