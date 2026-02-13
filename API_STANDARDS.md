# IndulgeOut API Standards & Guidelines

**Last Updated:** January 23, 2026  
**Purpose:** Standardized API communication patterns for production-ready development

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [API Configuration](#api-configuration)
3. [Usage Patterns](#usage-patterns)
4. [Authentication](#authentication)
5. [Error Handling](#error-handling)
6. [Migration Guide](#migration-guide)
7. [Best Practices](#best-practices)

---

## Architecture Overview

### Centralized API Instance
IndulgeOut uses a single, configured axios instance for all API communication. This ensures:
- ✅ Consistent authentication across all requests
- ✅ Centralized error handling (401 auto-logout)
- ✅ Easy debugging and logging
- ✅ Request/response interceptors for cross-cutting concerns
- ✅ Single source of truth for API configuration

### File Structure
```
frontend/src/config/api.js          # API configuration & axios instance
backend/                             # REST API endpoints
```

---

## API Configuration

### Frontend: `frontend/src/config/api.js`

```javascript
import axios from 'axios';

// Base URL configuration
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD 
    ? 'https://indulge-out-production.vercel.app' 
    : 'http://localhost:5000')
).replace(/\/$/, '');

// Configured axios instance with interceptors
export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - adds JWT token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handles 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Exports
export const API_URL = API_BASE_URL;        // URL string
export { API_BASE_URL };                    // URL string (backward compat)
export default API_BASE_URL;                 // URL string (backward compat)
```

### Key Configuration Points:
- **baseURL:** Already includes `/api` prefix
- **Authentication:** Automatic token injection from localStorage
- **Error Handling:** 401 errors trigger logout & redirect
- **Environment-aware:** Uses `VITE_API_URL` in production

---

## Usage Patterns

### ✅ CORRECT: Using the API Instance

```javascript
import { api } from '../config/api';

// GET request
const fetchEvents = async () => {
  try {
    const response = await api.get('/events');
    // URL becomes: http://localhost:5000/api/events
    setEvents(response.data.events);
  } catch (error) {
    console.error('Error:', error);
  }
};

// POST request with data
const createEvent = async (eventData) => {
  try {
    const response = await api.post('/events', eventData);
    // Token added automatically via interceptor
    return response.data;
  } catch (error) {
    if (error.response?.status === 400) {
      // Handle validation errors
    }
  }
};

// PUT request
const updateProfile = async (profileData) => {
  const response = await api.put('/users/profile', profileData);
  return response.data;
};

// DELETE request
const deleteEvent = async (eventId) => {
  await api.delete(`/events/${eventId}`);
};

// Query parameters
const searchEvents = async (query) => {
  const response = await api.get('/events/search', {
    params: { q: query, limit: 20 }
  });
  // URL becomes: /api/events/search?q=music&limit=20
  return response.data;
};
```

### ❌ WRONG: Manual axios with URL construction

```javascript
// DON'T DO THIS!
import axios from 'axios';
import API_BASE_URL from '../config/api';

const fetchEvents = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_BASE_URL}/api/events`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
```

**Problems with manual approach:**
- ❌ Manual token management (duplicated code)
- ❌ No centralized error handling
- ❌ Easy to forget authentication headers
- ❌ Inconsistent across codebase
- ❌ No 401 auto-logout

---

## Authentication

### How It Works

1. **User logs in** → Server returns JWT token
2. **Frontend stores token** → `localStorage.setItem('token', token)`
3. **All API requests** → Interceptor automatically adds:
   ```
   Authorization: Bearer <token>
   ```
4. **Token expires/invalid** → 401 response → Auto logout & redirect to `/login`

### Manual Token Management (NOT NEEDED)

```javascript
// ❌ DON'T DO THIS - handled automatically
const token = localStorage.getItem('token');
config.headers.Authorization = `Bearer ${token}`;

// ✅ JUST USE api instance - token added automatically
await api.get('/users/profile');
```

### Protected Routes

Backend routes using `authMiddleware` automatically verify tokens:

```javascript
// Backend: routes/events.js
router.get('/my-events', authMiddleware, async (req, res) => {
  // req.user available (extracted from JWT)
  const events = await Event.find({ user: req.user.id });
  res.json({ events });
});
```

Frontend just calls:
```javascript
// Frontend
const myEvents = await api.get('/events/my-events');
// Token sent automatically, req.user populated on backend
```

---

## Error Handling

### Standard Error Pattern

```javascript
const fetchData = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const response = await api.get('/endpoint');
    setData(response.data);
  } catch (error) {
    console.error('Error fetching data:', error);
    
    // Extract error message
    const message = error.response?.data?.message || 
                   error.message || 
                   'Failed to fetch data';
    setError(message);
    
    // Handle specific status codes
    if (error.response?.status === 404) {
      // Handle not found
    } else if (error.response?.status === 403) {
      // Handle forbidden
    }
  } finally {
    setLoading(false);
  }
};
```

### Automatic Error Handling

**401 Unauthorized:**  
Interceptor automatically:
1. Removes token from localStorage
2. Redirects to `/login`
3. User sees login page

**Other Errors:**  
Handle in catch block based on `error.response.status`

---

## Migration Guide

### Refactoring Old Code to New Standard

**Step 1: Update Imports**

```diff
- import axios from 'axios';
- import API_BASE_URL from '../config/api';
+ import { api } from '../config/api';
```

**Step 2: Replace Manual axios Calls**

```diff
- const token = localStorage.getItem('token');
- const response = await axios.get(`${API_BASE_URL}/api/events/${id}`, {
-   headers: { Authorization: `Bearer ${token}` }
- });
+ const response = await api.get(`/events/${id}`);
```

**Step 3: Remove Token Management**

```diff
  const createEvent = async (data) => {
-   const token = localStorage.getItem('token');
    const response = await api.post('/events', data);
-   // Don't need to manually set headers anymore
    return response.data;
  };
```

**Step 4: Update URL Paths**

```diff
- await api.get(`${API_BASE_URL}/api/events`)  // ❌ Wrong
+ await api.get('/events')                      // ✅ Correct
  
// Note: /api prefix is already in baseURL
```

### Files Refactored ✅

- ✅ `frontend/src/contexts/AuthContext.jsx`
- ✅ `frontend/src/components/TicketViewer.jsx`
- ✅ `frontend/src/pages/EventDetail.jsx`
- ✅ `frontend/src/pages/Profile.jsx`
- ✅ `frontend/src/pages/UserDashboard.jsx`
- ✅ `frontend/src/pages/VenueDashboard.jsx`
- ⏳ (Others in progress)

---

## Best Practices

### 1. Always Use the API Instance
```javascript
import { api } from '../config/api';
// Never import axios directly for API calls
```

### 2. Handle Loading States
```javascript
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

try {
  setLoading(true);
  const data = await api.get('/endpoint');
} catch (err) {
  setError(err.message);
} finally {
  setLoading(false);
}
```

### 3. URL Path Conventions
```javascript
// ✅ Correct - relative paths (baseURL has /api)
await api.get('/events');
await api.post('/users/profile');
await api.get('/tickets/my-tickets');

// ❌ Wrong - don't include /api in path
await api.get('/api/events');
```

### 4. Error Messages
```javascript
// Extract user-friendly error messages
const errorMessage = 
  error.response?.data?.message ||  // Backend error message
  error.message ||                   // Network error
  'An unexpected error occurred';    // Fallback
```

### 5. Request Configuration
```javascript
// Timeout
await api.get('/endpoint', { timeout: 5000 });

// Query params
await api.get('/events', { params: { page: 1, limit: 20 } });

// Custom headers (rarely needed)
await api.post('/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

### 6. Response Data Structure
```javascript
// Backend typically returns:
{ success: true, data: {...}, message: '...' }

// Access like:
const response = await api.get('/events');
const events = response.data.events; // or response.data.data
```

### 7. Cancellation (Advanced)
```javascript
useEffect(() => {
  const controller = new AbortController();
  
  api.get('/events', { signal: controller.signal })
    .then(res => setEvents(res.data))
    .catch(err => {
      if (err.name !== 'CanceledError') {
        setError(err.message);
      }
    });
  
  return () => controller.abort();
}, []);
```

---

## Environment Variables

### `.env` Configuration

```bash
# Development
VITE_API_URL=http://localhost:5000

# Production
VITE_API_URL=https://indulge-out-production.vercel.app
```

### Usage in Code
```javascript
// Automatically used in api.js baseURL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

---

## Testing Patterns

### Unit Tests
```javascript
import { api } from '../config/api';
import MockAdapter from 'axios-mock-adapter';

const mock = new MockAdapter(api);

test('fetches events', async () => {
  mock.onGet('/events').reply(200, {
    success: true,
    events: [{ id: 1, title: 'Test Event' }]
  });
  
  const response = await api.get('/events');
  expect(response.data.events).toHaveLength(1);
});
```

---

## Debugging

### Enable Request Logging
```javascript
// In api.js - add to request interceptor
api.interceptors.request.use((config) => {
  console.log('API Request:', config.method.toUpperCase(), config.url);
  return config;
});
```

### Response Logging
```javascript
// In api.js - add to response interceptor
api.interceptors.response.use((response) => {
  console.log('API Response:', response.config.url, response.status);
  return response;
});
```

### Check Token
```javascript
// In browser console
localStorage.getItem('token')
```

---

## Common Pitfalls

### 1. Double /api in URL
```javascript
❌ await api.get('/api/events')  // Results in /api/api/events
✅ await api.get('/events')       // Results in /api/events
```

### 2. Forgetting to Import api
```javascript
❌ import axios from 'axios';     // Wrong instance
✅ import { api } from '../config/api';
```

### 3. Manual Token Management
```javascript
❌ const token = localStorage.getItem('token');
   config.headers = { Authorization: `Bearer ${token}` };
   
✅ // Automatic via interceptor - just use api instance
```

### 4. Not Handling Errors
```javascript
❌ const data = await api.get('/events'); // Unhandled rejection

✅ try {
     const data = await api.get('/events');
   } catch (error) {
     console.error(error);
   }
```

---

## Future Enhancements

### Planned Features:
1. **Request Retry Logic** - Automatic retry on network failures
2. **Request Caching** - Cache GET requests for performance
3. **Request Queueing** - Queue requests when offline
4. **Analytics Integration** - Track API performance
5. **Rate Limiting** - Client-side rate limit handling

---

## Support & Questions

For questions or issues with API integration:
1. Check this documentation first
2. Review `frontend/src/config/api.js`
3. Check browser DevTools Network tab
4. Review backend routes in `backend/routes/`

---

## Version History

**v1.0.0** - January 23, 2026
- Initial standardization of API patterns
- Centralized axios instance with interceptors
- Comprehensive documentation created
- Migration of core files completed

---

**End of Documentation**
