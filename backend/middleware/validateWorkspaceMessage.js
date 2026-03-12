/**
 * Middleware to validate workspace messages and field notes
 * Blocks contact information, URLs, and inappropriate content
 */

const validateWorkspaceMessage = (req, res, next) => {
  const { message } = req.body;
  
  if (!message || typeof message !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Message is required and must be a string'
    });
  }
  
  // Trim and check length
  const trimmedMessage = message.trim();
  
  if (trimmedMessage.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Message cannot be empty'
    });
  }
  
  if (trimmedMessage.length > 500) {
    return res.status(400).json({
      success: false,
      error: 'Message cannot exceed 500 characters'
    });
  }
  
  // Blocked patterns
  const blockedPatterns = [
    // URLs
    {
      pattern: /https?:\/\//gi,
      message: 'URLs are not allowed in messages'
    },
    {
      pattern: /www\./gi,
      message: 'Web addresses are not allowed in messages'
    },
    {
      pattern: /\.(com|net|org|in|co|io|ai|app|dev|tech)\b/gi,
      message: 'Website addresses are not allowed in messages'
    },
    
    // Email addresses
    {
      pattern: /[\w\.-]+@[\w\.-]+\.\w+/gi,
      message: 'Email addresses are not allowed in messages'
    },
    {
      pattern: /\b[a-z0-9._%+-]+\s*@\s*[a-z0-9.-]+\s*\.\s*[a-z]{2,}\b/gi,
      message: 'Email addresses are not allowed in messages'
    },
    
    // Phone numbers
    {
      pattern: /(\+?\d{1,4}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g,
      message: 'Phone numbers are not allowed in messages'
    },
    {
      pattern: /\+?\d{10,15}/g,
      message: 'Phone numbers are not allowed in messages'
    },
    {
      pattern: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
      message: 'Phone numbers are not allowed in messages'
    },
    {
      pattern: /(\+91|0)[\s-]?\d{10}/gi,
      message: 'Indian phone numbers are not allowed in messages'
    },
    
    // Social media handles and messaging apps
    {
      pattern: /@[\w]{3,}/gi,
      message: 'Social media handles are not allowed in messages'
    },
    {
      pattern: /\b(whatsapp|telegram|instagram|facebook|twitter|snapchat|tiktok|linkedin)\b/gi,
      message: 'Social media or messaging app references are not allowed'
    },
    {
      pattern: /\b(whatsapp|telegram|insta|fb|ig|snap|linkedin)\b/gi,
      message: 'Social media or messaging app references are not allowed'
    },
    
    // Common contact information patterns
    {
      pattern: /\b(call me|text me|dm me|message me|reach me|contact me at)\b/gi,
      message: 'Direct contact requests are not allowed'
    },
    {
      pattern: /\b(my number|my email|my phone|my contact)\b/gi,
      message: 'Sharing contact information is not allowed'
    }
  ];
  
  // Check message against all patterns
  for (const { pattern, message: errorMsg } of blockedPatterns) {
    if (pattern.test(trimmedMessage)) {
      return res.status(400).json({
        success: false,
        error: errorMsg,
        hint: 'Please use this workspace to discuss collaboration details only. Contact information will be exchanged after final confirmation.'
      });
    }
  }
  
  // If all validations pass, attach the trimmed message
  req.body.message = trimmedMessage;
  next();
};

module.exports = validateWorkspaceMessage;
