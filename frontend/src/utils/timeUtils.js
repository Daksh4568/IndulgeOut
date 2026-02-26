/**
 * Time Utility Functions
 * Handles conversion between 24-hour and 12-hour AM/PM formats
 */

/**
 * Convert 24-hour format (HH:mm) to 12-hour format with AM/PM (hh:mm AM/PM)
 * @param {string} time24 - Time in 24-hour format (e.g., "14:30", "09:00")
 * @returns {string} Time in 12-hour format (e.g., "02:30 PM", "09:00 AM")
 */
export const convert24To12Hour = (time24) => {
  if (!time24) return '';
  
  const [hours24, minutes] = time24.split(':').map(Number);
  
  if (isNaN(hours24) || isNaN(minutes)) return time24;
  
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12; // Convert 0 to 12 for midnight
  
  return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
};

/**
 * Convert 12-hour format with AM/PM to 24-hour format
 * @param {string} time12 - Time in 12-hour format (e.g., "02:30 PM", "09:00 AM")
 * @returns {string} Time in 24-hour format (e.g., "14:30", "09:00")
 */
export const convert12To24Hour = (time12) => {
  if (!time12) return '';
  
  // Handle if already in 24-hour format (no AM/PM)
  if (!time12.includes('AM') && !time12.includes('PM')) {
    return time12;
  }
  
  const [time, period] = time12.split(' ');
  const [hours12, minutes] = time.split(':').map(s => parseInt(s, 10));
  
  if (isNaN(hours12) || isNaN(minutes)) return time12;
  
  let hours24 = hours12;
  
  if (period === 'PM' && hours12 !== 12) {
    hours24 = hours12 + 12;
  } else if (period === 'AM' && hours12 === 12) {
    hours24 = 0;
  }
  
  return `${String(hours24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

/**
 * Parse time string and return components
 * @param {string} timeStr - Time in 12-hour format (e.g., "02:30 PM")
 * @returns {object} {hours: number, minutes: number, period: string}
 */
export const parseTime12Hour = (timeStr) => {
  if (!timeStr) return { hours: 12, minutes: 0, period: 'PM' };
  
  // If it's 24-hour format, convert first
  if (!timeStr.includes('AM') && !timeStr.includes('PM')) {
    timeStr = convert24To12Hour(timeStr);
  }
  
  const [time, period] = timeStr.trim().split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  
  return {
    hours: hours || 12,
    minutes: minutes || 0,
    period: period || 'PM'
  };
};

/**
 * Format time components into 12-hour string
 * @param {number} hours - Hours (1-12)
 * @param {number} minutes - Minutes (0-59)
 * @param {string} period - AM or PM
 * @returns {string} Formatted time (e.g., "02:30 PM")
 */
export const formatTime12Hour = (hours, minutes, period) => {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
};

/**
 * Generate time options for dropdown
 * @returns {array} Array of time strings in 12-hour format
 */
export const generateTimeOptions = () => {
  const times = [];
  
  for (let hour = 1; hour <= 12; hour++) {
    for (let min = 0; min < 60; min += 15) { // 15-minute intervals
      const hourStr = String(hour).padStart(2, '0');
      const minStr = String(min).padStart(2, '0');
      times.push(`${hourStr}:${minStr} AM`);
    }
  }
  
  for (let hour = 1; hour <= 12; hour++) {
    for (let min = 0; min < 60; min += 15) {
      const hourStr = String(hour).padStart(2, '0');
      const minStr = String(min).padStart(2, '0');
      times.push(`${hourStr}:${minStr} PM`);
    }
  }
  
  return times;
};
