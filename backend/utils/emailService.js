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
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
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
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL}/dashboard" 
                 style="background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Explore Events
              </a>
            </div>
            
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
const sendEventRegistrationEmail = async (userEmail, userName, event) => {
  try {
    const eventDate = new Date(event.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `Registration Confirmed: ${event.title} 🎊`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Registration Confirmed!</h1>
          </div>
          
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${userName}! 🎉</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Great news! You're all set for this amazing event:
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 20px 0;">
              <h3 style="color: #333; margin: 0 0 15px 0;">${event.title}</h3>
              <p style="color: #666; margin: 5px 0;"><strong>📅 Date:</strong> ${eventDate}</p>
              <p style="color: #666; margin: 5px 0;"><strong>🕒 Time:</strong> ${event.time}</p>
              <p style="color: #666; margin: 5px 0;"><strong>📍 Location:</strong> ${event.location.address}, ${event.location.city}</p>
              <p style="color: #666; margin: 5px 0;"><strong>👥 Current Attendees:</strong> ${event.currentParticipants}/${event.maxParticipants}</p>
            </div>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #92400e; margin: 0;">
                <strong>📱 What to Bring:</strong> Just yourself and an open mind! We'll take care of the rest.
              </p>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              <strong>Event Description:</strong><br>
              ${event.description}
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL}/events/${event._id}" 
                 style="background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Event Details
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
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
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL}/events/${event._id}" 
                 style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Manage Event
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
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

module.exports = {
  sendWelcomeEmail,
  sendEventRegistrationEmail,
  sendEventNotificationToHost
};