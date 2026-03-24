const nodemailer = require('nodemailer');
const { sendWhatsAppTicket } = require('../services/msg91Service');
const { generateTicketPdf } = require('../services/ticketPdfService');
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
    family: 4, // Force IPv4 (fixes ENETUNREACH IPv6 connectivity issues)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false // For development
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
    console.log(`📧 [Email Service] Received ticket data:`, {
      hasTicket: !!ticket,
      ticketNumber: ticket?.ticketNumber,
      hasQrCode: !!ticket?.qrCode,
      hasQrCodeUrl: !!ticket?.qrCodeUrl,
      qrCodeType: typeof ticket?.qrCode,
      qrCodeLength: ticket?.qrCode?.length,
      qrCodeUrlValue: ticket?.qrCodeUrl,
      qrCodePrefix: ticket?.qrCode?.substring(0, 50),
      ticketKeys: ticket ? Object.keys(ticket) : []
    });

    const eventDate = new Date(event.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Prefer hosted URL over base64 for better email client compatibility
    const qrCodeSrc = ticket?.qrCodeUrl || ticket?.qrCode;
    
    console.log(`🎫 [Email QR] Using ${ticket?.qrCodeUrl ? 'hosted URL' : 'base64'} for QR code`);

    // Build ticket section HTML if ticket is provided
    // Use max-width and display:block for better email client compatibility
    const ticketSection = ticket && qrCodeSrc ? `
      <div style="background: white; padding: 25px; border-radius: 12px; border: 2px dashed #22c55e; margin: 25px 0; text-align: center;">
        <h3 style="color: #22c55e; margin: 0 0 15px 0;">🎫 Your Event Ticket</h3>
        <p style="color: #333; font-size: 22px; font-weight: bold; margin: 10px 0; letter-spacing: 1px;">
          Ticket ID: ${ticket.ticketNumber}
        </p>
        <p style="color: #666; font-size: 16px; margin: 10px 0; background: #f3f4f6; padding: 8px 16px; border-radius: 6px; display: inline-block;">
          <strong>🎫 Ticket:</strong> ${ticket.quantity || 1} ${(ticket.quantity || 1) === 1 ? 'Spot' : 'Spots'}
        </p>
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 15px 0;">
          <img src="${qrCodeSrc}" alt="QR Code" style="width: 200px; height: 200px; max-width: 200px; margin: 10px auto; display: block; border: 2px solid #e5e7eb; padding: 10px; background: white;" />
          <p style="color: #666; font-size: 14px; margin: 15px 0 5px 0;">
            Show this QR code at the event entrance
          </p>
        </div>
        <p style="color: #666; font-size: 13px; margin-top: 15px;">
          💡 You can also find your ticket in your dashboard
        </p>
      </div>
    ` : '<div style="background: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0;"><p style="color: #991b1b; margin: 0;">⚠️ Ticket information is being generated. Please check your dashboard for your ticket.</p></div>';
    
    // Log QR code info for debugging
    if (ticket && qrCodeSrc) {
      console.log(`🎫 [Email Template] Including ticket ${ticket.ticketNumber} with QR source (${ticket?.qrCodeUrl ? 'URL' : 'base64'}, length: ${qrCodeSrc.length})`);
      if (!ticket?.qrCodeUrl) {
        console.log(`🎫 [QR Code Preview] ${ticket.qrCode.substring(0, 100)}...`);
      }
    } else {
      console.log(`⚠️ [Email Template] No ticket data or QR code provided to email template`);
    }

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
              <p style="color: #666; margin: 5px 0;"><strong>🕒 Time:</strong> ${event.startTime && event.endTime ? `${event.startTime} - ${event.endTime}` : event.time || 'TBD'}</p>
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
    console.log('✅ [Registration Email] Sent successfully to:', userEmail);
    console.log('📧 [Email Details] Event:', event.title, '| Ticket:', ticket?.ticketNumber || 'N/A');
    return result;
  } catch (error) {
    console.error('❌ [Registration Email] Failed to send to:', userEmail);
    console.error('❌ [Email Error]:', error.message);
    console.error('❌ [Email Stack]:', error.stack);
    throw error;
  }
};

// Send WhatsApp ticket notification (non-blocking, non-critical)
const sendWhatsAppTicketNotification = async (user, event, ticket) => {
  try {
    const phone = user.phoneNumber;
    if (!phone) {
      console.log('📱 [WhatsApp Ticket] No phoneNumber for user, skipping WhatsApp notification');
      return { success: false, message: 'No phone number' };
    }

    const firstName = (user.name || 'Guest').split(' ')[0];

    const eventDate = new Date(event.date).toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const eventTime = event.startTime && event.endTime
      ? `${event.startTime} - ${event.endTime}`
      : event.time || 'TBD';

    const venueName = [event.location?.address, event.location?.city]
      .filter(Boolean)
      .join(', ') || 'Venue TBD';

    const lat = event.location?.coordinates?.latitude;
    const lng = event.location?.coordinates?.longitude;
    // Only send the dynamic suffix (lat,lng) — template has the static prefix
    const venueMapUrl = lat && lng
      ? `${lat},${lng}`
      : '';

    // Generate PDF ticket with QR code + event poster
    const eventImageUrl = (event.images && event.images.length > 0) ? event.images[0] : '';
    let ticketPdfUrl = '';
    try {
      const pdfResult = await generateTicketPdf({
        ticketNumber: ticket?.ticketNumber || 'N/A',
        userName: user.name || firstName,
        eventName: event.title || 'Event',
        eventDate,
        eventTime,
        venueName,
        spots: ticket?.quantity || 1,
        qrCodeUrl: ticket?.qrCodeUrl || '',
        qrCodeBase64: ticket?.qrCode || '',
        eventImageUrl,
      });
      ticketPdfUrl = pdfResult?.url || '';
    } catch (pdfErr) {
      console.error('⚠️ [WhatsApp Ticket] PDF generation failed, skipping:', pdfErr.message);
    }

    if (!ticketPdfUrl) {
      console.log('📱 [WhatsApp Ticket] No PDF generated, skipping WhatsApp notification');
      return { success: false, message: 'PDF generation failed' };
    }

    const result = await sendWhatsAppTicket(phone, {
      userName: firstName,
      eventName: event.title || 'Event',
      eventDate,
      eventTime,
      venueName,
      venueMapUrl,
      spotsCount: String(ticket?.quantity || 1),
      ticketNumber: ticket?.ticketNumber || 'N/A',
      ticketPdfUrl,
    });

    return result;
  } catch (err) {
    console.error('❌ [WhatsApp Ticket] Failed to send WhatsApp ticket notification:', err.message);
    return { success: false, message: err.message };
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

// Send OTP email
const sendOTPEmail = async (emailAddress, otp, userName = 'User') => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: emailAddress,
      subject: 'Your IndulgeOut Login Code 🔐',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Your Login Code</h1>
          </div>
          
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${userName}! 👋</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              You requested to login to your IndulgeOut account. Use the code below to complete your login:
            </p>
            
            <div style="background: white; padding: 30px; border-radius: 12px; text-align: center; margin: 25px 0; border: 2px solid #6366f1;">
              <p style="color: #666; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Your OTP Code</p>
              <p style="color: #6366f1; font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 10px 0; font-family: 'Courier New', monospace;">
                ${otp}
              </p>
              <p style="color: #999; font-size: 13px; margin: 10px 0 0 0;">This code expires in 10 minutes</p>
            </div>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                ⚠️ <strong>Security Notice:</strong> Never share this code with anyone. IndulgeOut staff will never ask for your OTP.
              </p>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              If you didn't request this code, you can safely ignore this email. Someone may have entered your email address by mistake.
            </p>
            
            <p style="color: #666; line-height: 1.6; margin-top: 30px;">
              Best regards,<br>
              The IndulgeOut Team 🎉
            </p>
          </div>
          
          <div style="background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 14px;">
            <p style="margin: 0;">
              © 2025 IndulgeOut. All rights reserved.
            </p>
            <p style="margin: 10px 0 0 0;">
              Find offline experiences, join communities and connect with people
            </p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent successfully to:', emailAddress);
    return result;
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    throw error;
  }
};

// Send general notification email
const sendNotificationEmail = async (userEmail, title, message, actionUrl = null, actionText = null) => {
  try {
    const actionButton = actionUrl && actionText
      ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${actionUrl}" 
             style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
                    color: white;
                    padding: 14px 32px;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 600;
                    display: inline-block;
                    box-shadow: 0 4px 6px rgba(99, 102, 241, 0.3);">
            ${actionText}
          </a>
        </div>
      `
      : '';

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: title,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📬 ${title}</h1>
          </div>
          
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              ${message}
            </div>
            
            ${actionButton}
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; text-align: center;">
              <p style="margin: 5px 0;">
                This notification was sent from IndulgeOut
              </p>
              <p style="margin: 5px 0;">
                Manage your notification preferences in your dashboard settings
              </p>
            </div>
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

module.exports = {
  sendWelcomeEmail,
  sendOTPEmail,
  sendEventRegistrationEmail,
  sendEventNotificationToHost,
  sendNotificationEmail,
  sendWhatsAppTicketNotification
};