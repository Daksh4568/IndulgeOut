import { useState, useEffect, useRef } from 'react';
import { Clock, ChevronDown } from 'lucide-react';
import { convert24To12Hour } from '../utils/timeUtils';

const TimeInput = ({ name, value, onChange, required = false, label }) => {
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [period, setPeriod] = useState('AM');
  const isInternalUpdate = useRef(false);

  // Parse incoming value (can be "02:30 PM" or "14:30")
  useEffect(() => {
    if (value && !isInternalUpdate.current) {
      let time12 = value;
      
      // Convert 24-hour to 12-hour if needed
      if (!value.includes('AM') && !value.includes('PM')) {
        time12 = convert24To12Hour(value);
      }
      
      // Parse the time
      const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (match) {
        const newHours = match[1].padStart(2, '0');
        const newMinutes = match[2];
        const newPeriod = match[3].toUpperCase();
        
        // Only update if values are different
        if (newHours !== hours || newMinutes !== minutes || newPeriod !== period) {
          setHours(newHours);
          setMinutes(newMinutes);
          setPeriod(newPeriod);
        }
      }
    }
    isInternalUpdate.current = false;
  }, [value]);

  const updateParent = (newHours, newMinutes, newPeriod) => {
    if (newHours && newMinutes) {
      isInternalUpdate.current = true;
      const timeString = `${newHours.padStart(2, '0')}:${newMinutes} ${newPeriod}`;
      onChange({
        target: {
          name,
          value: timeString
        }
      });
    }
  };

  const handleHoursChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 12)) {
      setHours(val);
      if (val && minutes) {
        updateParent(val, minutes, period);
      }
    }
  };

  const handleMinutesChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 59)) {
      setMinutes(val);
      if (hours && val) {
        updateParent(hours, val, period);
      }
    }
  };

  const handlePeriodChange = (e) => {
    const newPeriod = e.target.value;
    setPeriod(newPeriod);
    if (hours && minutes) {
      updateParent(hours, minutes, newPeriod);
    }
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-white text-sm font-medium mb-2">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      
      <div className="relative flex items-center gap-1 sm:gap-1.5 w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 focus-within:ring-2 focus-within:ring-[#7878E9] focus-within:border-transparent transition-all">
        <Clock className="h-4 w-4 text-[#7878E9] flex-shrink-0" />
        
        {/* Hours Input */}
        <input
          type="text"
          value={hours}
          onChange={handleHoursChange}
          placeholder="HH"
          maxLength="2"
          required={required}
          className="w-10 sm:w-11 bg-transparent border-none text-white text-center placeholder-gray-500 focus:outline-none text-sm sm:text-base"
        />
        
        {/* Colon Separator */}
        <span className="text-white text-sm sm:text-base">:</span>
        
        {/* Minutes Input */}
        <input
          type="text"
          value={minutes}
          onChange={handleMinutesChange}
          placeholder="MM"
          maxLength="2"
          required={required}
          className="w-10 sm:w-11 bg-transparent border-none text-white text-center placeholder-gray-500 focus:outline-none text-sm sm:text-base"
        />
        
        {/* AM/PM Dropdown with Custom Arrow */}
        <div className="relative flex items-center ml-1">
          <select
            value={period}
            onChange={handlePeriodChange}
            required={required}
            className="appearance-none bg-transparent border-none text-white focus:outline-none cursor-pointer text-sm sm:text-base pr-4 pl-1"
          >
            <option value="AM" className="bg-gray-800">AM</option>
            <option value="PM" className="bg-gray-800">PM</option>
          </select>
          <ChevronDown className="h-3 w-3 text-gray-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        
        {/* Hidden input for form submission */}
        <input
          type="hidden"
          name={name}
          value={hours && minutes ? `${hours.padStart(2, '0')}:${minutes} ${period}` : ''}
          required={required}
        />
      </div>
    </div>
  );
};

export default TimeInput;
