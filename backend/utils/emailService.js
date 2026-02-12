const nodemailer = require('nodemailer');
require('dotenv').config();

// Create email transporter
const createTransporter = () => {
  // Check if email configuration is available
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('📧 Email configuration missing - using mock transporter');
    return {
      sendMail: (options) => {
        console.log('📧 Email would be sent:', {
          to: options.to,
          subject: options.subject
        });
        return Promise.resolve({ messageId: 'mock-email-id' });
      }
    };
  }

  // Create real transporter with Gmail configuration
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    family: 4, // Force IPv4 - fixes ENETUNREACH error on networks without IPv6
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false // Accept self-signed certificates (for development)
    }
  });
};

const transporter = createTransporter();

// Send welcome email to new users
const sendWelcomeEmail = async (userEmail, userName) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Welcome to IndulgeOut! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to IndulgeOut!</h1>
          </div>
          
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${userName}! 👋</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              We're thrilled to have you join our community of passionate individuals who believe in the power of real-world connections!
            </p>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Here's what you can do next:
            </p>
            
            <ul style="color: #666; line-height: 1.8; margin-bottom: 30px;">
              <li>🎯 Complete your interest profile to discover amazing events</li>
              <li>📅 Browse upcoming events in your area</li>
              <li>👥 Connect with like-minded people</li>
              <li>🎉 Start hosting your own events (if you're a community member)</li>
            </ul>
            
            <p style="color: #666; line-height: 1.6; margin-top: 30px;">
              Questions? Just reply to this email - we're here to help!
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              Best regards,<br>
              The IndulgeOut Team
            </p>
          </div>
          
          <div style="background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 14px;">
            <p style="margin: 0;">
              © 2025 IndulgeOut. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent successfully to:', userEmail);
    return result;
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    throw error;
  }
};

// Send event registration confirmation email to user
const sendEventRegistrationEmail = async (userEmail, userName, event, ticket = null) => {
  try {
    const eventDate = new Date(event.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Build ticket section HTML if ticket is provided
    const ticketSection = ticket ? `
      <div style="background: white; padding: 25px; border-radius: 12px; border: 2px dashed #22c55e; margin: 25px 0; text-align: center;">
        <h3 style="color: #22c55e; margin: 0 0 15px 0;">🎫 Your Event Ticket</h3>
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 15px 0;">
          <img src="${ticket.qrCode}" alt="QR Code" style="width: 200px; height: 200px; margin: 10px auto; display: block;" />
          <p style="color: #333; font-size: 18px; font-weight: bold; margin: 15px 0;">
            Ticket #${ticket.ticketNumber}
          </p>
          <p style="color: #666; font-size: 14px; margin: 5px 0;">
            Show this QR code at the event entrance
          </p>
        </div>
        <p style="color: #666; font-size: 13px; margin-top: 15px;">
          💡 You can also find your ticket in your dashboard
        </p>
      </div>
    ` : '';

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `🎫 Your Ticket for ${event.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Registration Confirmed!</h1>
          </div>
          
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${userName}! 🎉</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Great news! You're all set for this amazing event. Your ticket is attached below.
            </p>
            
            ${ticketSection}
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 20px 0;">
              <h3 style="color: #333; margin: 0 0 15px 0;">${event.title}</h3>
              <p style="color: #666; margin: 5px 0;"><strong>📅 Date:</strong> ${eventDate}</p>
              <p style="color: #666; margin: 5px 0;"><strong>🕒 Time:</strong> ${event.time}</p>
              <p style="color: #666; margin: 5px 0;"><strong>📍 Location:</strong> ${event.location.address}, ${event.location.city}</p>
              <p style="color: #666; margin: 5px 0;"><strong>👥 Current Attendees:</strong> ${event.currentParticipants}/${event.maxParticipants}</p>
            </div>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #92400e; margin: 0;">
                <strong>📱 What to Bring:</strong> Just yourself, your ticket (digital or printed), and an open mind!
              </p>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              <strong>Event Description:</strong><br>
              ${event.description}
            </p>
            
            <p style="color: #666; line-height: 1.6; margin-top: 30px;">
              Can't wait to see you there!<br>
              The IndulgeOut Team
            </p>
          </div>
          
          <div style="background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 14px;">
            <p style="margin: 0;">
              © 2025 IndulgeOut. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Registration email sent successfully to:', userEmail);
    return result;
  } catch (error) {
    console.error('❌ Error sending registration email:', error);
    throw error;
  }
};

// Send notification to event host when someone registers
const sendEventNotificationToHost = async (hostEmail, hostName, user, event) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: hostEmail,
      subject: `New Registration for ${event.title} 🎉`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New Event Registration!</h1>
          </div>
          
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${hostName}! 👋</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Exciting news! Someone just registered for your event:
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0;">
              <h3 style="color: #333; margin: 0 0 15px 0;">${event.title}</h3>
              <p style="color: #666; margin: 5px 0;"><strong>👤 New Attendee:</strong> ${user.name}</p>
              <p style="color: #666; margin: 5px 0;"><strong>📧 Email:</strong> ${user.email}</p>
              <p style="color: #666; margin: 5px 0;"><strong>👥 Total Attendees:</strong> ${event.currentParticipants}/${event.maxParticipants}</p>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Your event is getting more popular! Make sure you're prepared for an amazing experience.
            </p>
            
            <p style="color: #666; line-height: 1.6; margin-top: 30px;">
              Keep up the great work!<br>
              The IndulgeOut Team
            </p>
          </div>
          
          <div style="background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 14px;">
            <p style="margin: 0;">
              © 2025 IndulgeOut. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Host notification email sent successfully to:', hostEmail);
    return result;
  } catch (error) {
    console.error('❌ Error sending host notification email:', error);
    throw error;
  }
};

// Send generic notification email
const sendNotificationEmail = async (userEmail, userName, notification) => {
  try {
    const { title, message, actionButton } = notification;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #7878E9 0%, #3D3DD4 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${title}</h1>
          </div>
          
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${userName}! 👋</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              ${message}
            </p>
            
            ${actionButton ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'https://indulgeout.com'}${actionButton.link}" 
                   style="background: linear-gradient(135deg, #7878E9 0%, #3D3DD4 100%); 
                          color: white; 
                          padding: 12px 30px; 
                          text-decoration: none; 
                          border-radius: 6px; 
                          display: inline-block;
                          font-weight: bold;">
                  ${actionButton.text}
                </a>
              </div>
            ` : ''}
            
            <p style="color: #666; line-height: 1.6; margin-top: 30px;">
              Best regards,<br>
              The IndulgeOut Team
            </p>
          </div>
          
          <div style="background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 14px;">
            <p style="margin: 0;">
              © 2025 IndulgeOut. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Notification email sent successfully to:', userEmail);
    return result;
  } catch (error) {
    console.error('❌ Error sending notification email:', error);
    throw error;
  }
};

// Send OTP email
const sendOTPEmail = async (userEmail, userName, otp) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Your IndulgeOut Login OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #7878E9 0%, #3D3DD4 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">IndulgeOut</h1>
          </div>
          
          <div style="padding: 40px; background: #f9fafb;">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${userName}! 👋</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
              Your One-Time Password (OTP) for logging into IndulgeOut is:
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="font-size: 36px; font-weight: bold; color: #7878E9; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${otp}
              </div>
            </div>
            
            <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin-bottom: 30px; border-radius: 4px;">
              <p style="color: #92400E; margin: 0; font-size: 14px;">
                <strong>⚠️ Important:</strong> This OTP is valid for <strong>10 minutes</strong> only. Do not share this code with anyone.
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              If you didn't request this OTP, please ignore this email or contact our support team.
            </p>
            
            <div style="text-align: center; margin-top: 40px;">
              <a href="${process.env.FRONTEND_URL || 'https://indulgeout.com'}" 
                 style="background: linear-gradient(135deg, #7878E9 0%, #3D3DD4 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                Go to IndulgeOut
              </a>
            </div>
          </div>
          
          <div style="padding: 20px; background: #1f2937; text-align: center;">
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
              © ${new Date().getFullYear()} IndulgeOut. All rights reserved.
            </p>
            <p style="color: #9ca3af; margin: 10px 0 0 0; font-size: 12px;">
              Need help? Contact us at support@indulgeout.com
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent successfully to: ${userEmail}`);
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    throw error;
  }
};

module.exports = {
  sendWelcomeEmail,
  sendEventRegistrationEmail,
  sendEventNotificationToHost,
  sendNotificationEmail,
  sendOTPEmail
};