/**
 * Compliance Service
 * Detects patterns that violate platform policies (contact info sharing, inappropriate content)
 */

const compliancePatterns = {
  // Phone number patterns (various formats)
  phone: [
    /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, // US/International
    /\d{10}/g, // Simple 10 digits
    /\d{5}[\s-]?\d{5}/g, // Indian format
    /(\+91|0)?[6-9]\d{9}/g, // Indian mobile
  ],

  // Email patterns
  email: [
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
  ],

  // Messaging app mentions
  messaging: [
    /(whatsapp|wa|telegram|signal|discord|wechat|line)/gi,
  ],

  // URL patterns (potential bypass attempts)
  url: [
    /(https?:\/\/[^\s]+)/gi,
    /(www\.[^\s]+)/gi,
  ],

  // Contact phrases
  contactPhrases: [
    /(contact\s+me\s+(at|on))/gi,
    /(call\s+me\s+(at|on)?)/gi,
    /(text\s+me)/gi,
    /(dm\s+me)/gi,
    /(message\s+me\s+(at|on)?)/gi,
    /(reach\s+(out|me)\s+(at|on)?)/gi,
    /(let'?s\s+(discuss|talk)\s+offline)/gi,
    /(send\s+(details|info)\s+to\s+my)/gi,
  ],

  // Profanity (basic list - extend as needed)
  profanity: [
    /\b(fuck|shit|damn|hell|asshole|bitch)\b/gi,
  ],
};

/**
 * Scan text for compliance violations
 * @param {String} text - Text to scan
 * @returns {Array} - Array of detected violations with types
 */
const scanText = (text) => {
  if (!text || typeof text !== 'string') return [];

  const violations = [];

  // Check for phone numbers
  compliancePatterns.phone.forEach((pattern) => {
    const matches = text.match(pattern);
    if (matches) {
      violations.push({
        type: 'phone_number',
        matches: matches.map(m => m.replace(/\s/g, '')),
        severity: 'high',
      });
    }
  });

  // Check for emails
  compliancePatterns.email.forEach((pattern) => {
    const matches = text.match(pattern);
    if (matches) {
      violations.push({
        type: 'email',
        matches,
        severity: 'high',
      });
    }
  });

  // Check for messaging apps
  compliancePatterns.messaging.forEach((pattern) => {
    const matches = text.match(pattern);
    if (matches) {
      violations.push({
        type: 'messaging_app',
        matches,
        severity: 'high',
      });
    }
  });

  // Check for URLs
  compliancePatterns.url.forEach((pattern) => {
    const matches = text.match(pattern);
    if (matches) {
      violations.push({
        type: 'url',
        matches,
        severity: 'medium',
      });
    }
  });

  // Check for contact phrases
  compliancePatterns.contactPhrases.forEach((pattern) => {
    const matches = text.match(pattern);
    if (matches) {
      violations.push({
        type: 'contact_phrase',
        matches,
        severity: 'medium',
      });
    }
  });

  // Check for profanity
  compliancePatterns.profanity.forEach((pattern) => {
    const matches = text.match(pattern);
    if (matches) {
      violations.push({
        type: 'profanity',
        matches,
        severity: 'low',
      });
    }
  });

  return violations;
};

/**
 * Scan entire form data object for compliance violations
 * @param {Object} formData - Form data to scan
 * @returns {Object} - Scan results with flags
 */
const scanFormData = (formData) => {
  const allViolations = [];
  const flaggedFields = [];

  // Recursive function to scan nested objects
  const scanObject = (obj, path = '') => {
    if (!obj || typeof obj !== 'object') return;

    Object.keys(obj).forEach((key) => {
      const value = obj[key];
      const currentPath = path ? `${path}.${key}` : key;

      if (typeof value === 'string') {
        const violations = scanText(value);
        if (violations.length > 0) {
          violations.forEach((v) => {
            allViolations.push({
              ...v,
              field: currentPath,
            });
          });
          flaggedFields.push(currentPath);
        }
      } else if (typeof value === 'object' && value !== null) {
        scanObject(value, currentPath);
      }
    });
  };

  scanObject(formData);

  // Determine overall risk level
  const highSeverityCount = allViolations.filter(v => v.severity === 'high').length;
  const mediumSeverityCount = allViolations.filter(v => v.severity === 'medium').length;

  let riskLevel = 'clean';
  if (highSeverityCount > 0) {
    riskLevel = 'high';
  } else if (mediumSeverityCount > 1) {
    riskLevel = 'medium';
  } else if (mediumSeverityCount > 0 || allViolations.length > 0) {
    riskLevel = 'low';
  }

  return {
    clean: allViolations.length === 0,
    riskLevel,
    violations: allViolations,
    flaggedFields: [...new Set(flaggedFields)], // Remove duplicates
    summary: {
      total: allViolations.length,
      high: highSeverityCount,
      medium: mediumSeverityCount,
      low: allViolations.filter(v => v.severity === 'low').length,
    },
  };
};

/**
 * Generate compliance flags array for database storage
 * @param {Object} scanResults - Results from scanFormData
 * @returns {Array} - Array of flag strings
 */
const generateFlags = (scanResults) => {
  if (scanResults.clean) return [];

  const flags = [];
  const violationTypes = [...new Set(scanResults.violations.map(v => v.type))];

  violationTypes.forEach((type) => {
    flags.push(`violation_${type}`);
  });

  if (scanResults.riskLevel === 'high') {
    flags.push('auto_reject_candidate');
  } else if (scanResults.riskLevel === 'medium') {
    flags.push('requires_review');
  }

  return flags;
};

module.exports = {
  scanText,
  scanFormData,
  generateFlags,
};
