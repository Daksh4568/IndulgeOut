// Canonical list of Indian cities used across the platform.
// Each entry has a canonical `value` (stored in DB) and optional `aliases`
// so that existing data like "Bangalore" still matches "Bengaluru".

export const INDIAN_CITIES = [
  { value: 'Ahmedabad' },
  { value: 'Bengaluru', aliases: ['Bangalore', 'Bengaluru'] },
  { value: 'Bhopal' },
  { value: 'Bhubaneswar' },
  { value: 'Chandigarh' },
  { value: 'Chennai', aliases: ['Madras'] },
  { value: 'Coimbatore' },
  { value: 'Dehradun' },
  { value: 'Delhi', aliases: ['New Delhi'] },
  { value: 'Faridabad' },
  { value: 'Ghaziabad' },
  { value: 'Goa', aliases: ['Panaji'] },
  { value: 'Gurgaon', aliases: ['Gurugram'] },
  { value: 'Guwahati' },
  { value: 'Hyderabad' },
  { value: 'Indore' },
  { value: 'Jaipur' },
  { value: 'Jodhpur' },
  { value: 'Kanpur' },
  { value: 'Kochi', aliases: ['Cochin'] },
  { value: 'Kolkata', aliases: ['Calcutta'] },
  { value: 'Lucknow' },
  { value: 'Ludhiana' },
  { value: 'Mangalore', aliases: ['Mangaluru'] },
  { value: 'Mumbai', aliases: ['Bombay'] },
  { value: 'Mysuru', aliases: ['Mysore'] },
  { value: 'Nagpur' },
  { value: 'Nashik' },
  { value: 'Navi Mumbai' },
  { value: 'Noida' },
  { value: 'Patna' },
  { value: 'Pune' },
  { value: 'Raipur' },
  { value: 'Rajkot' },
  { value: 'Ranchi' },
  { value: 'Surat' },
  { value: 'Thane' },
  { value: 'Thiruvananthapuram', aliases: ['Trivandrum'] },
  { value: 'Udaipur' },
  { value: 'Vadodara', aliases: ['Baroda'] },
  { value: 'Varanasi', aliases: ['Banaras', 'Benares'] },
  { value: 'Vijayawada' },
  { value: 'Visakhapatnam', aliases: ['Vizag'] },
];

// Flat list of canonical city names (for simple <select> dropdowns)
export const INDIAN_CITY_NAMES = INDIAN_CITIES.map(c => c.value);

// Given a city string (possibly an alias), return the canonical name.
// Returns the original string if no match found (graceful fallback).
export const normalizeCityName = (city) => {
  if (!city) return '';
  const lower = city.toLowerCase().trim();
  for (const entry of INDIAN_CITIES) {
    if (entry.value.toLowerCase() === lower) return entry.value;
    if (entry.aliases?.some(a => a.toLowerCase() === lower)) return entry.value;
  }
  return city; // Return as-is if not in the list (e.g. "Other")
};

// Check if a search query matches a city (checks canonical name + aliases)
export const cityMatchesSearch = (cityEntry, search) => {
  if (!search) return true;
  const q = search.toLowerCase().trim();
  if (cityEntry.value.toLowerCase().includes(q)) return true;
  return cityEntry.aliases?.some(a => a.toLowerCase().includes(q)) || false;
};
