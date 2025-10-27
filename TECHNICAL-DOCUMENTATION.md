# IndulgeOut - Technical Documentation

## 📋 Project Overview

**IndulgeOut** is a full-stack web application that connects people with shared interests through events and community building. Users can discover events, host their own, and build connections based on common passions like food, sports, art, music, and outdoor activities.

## 🏗️ Architecture Overview

### System Architecture
```
Frontend (React + Vite) ← HTTP/API Calls → Backend (Node.js + Express) ← Database → MongoDB
```

### Technology Stack

**Frontend:**
- React 18.2.0 with functional components and hooks
- React Router DOM 6.18.0 for client-side routing
- Axios 1.12.2 for HTTP requests
- Tailwind CSS for styling
- Lucide React for icons
- Vite for build tooling

**Backend:**
- Node.js with Express.js framework
- MongoDB with Mongoose ODM
- JWT for authentication
- bcryptjs for password hashing
- CORS for cross-origin requests
- dotenv for environment variables

**Deployment:**
- Vercel for both frontend and backend hosting
- MongoDB Atlas for cloud database
- GitHub for version control

## 🎨 Frontend Architecture

### Component Structure
```
src/
├── components/          # Reusable UI components
├── pages/              # Route-based page components
│   ├── Homepage.jsx    # Landing page with animations
│   ├── Login.jsx       # User authentication
│   ├── Register.jsx    # User registration
│   ├── Dashboard.jsx   # User dashboard
│   ├── EventCreation.jsx # Create new events
│   ├── EventDiscovery.jsx # Browse and filter events
│   └── InterestSelection.jsx # Choose user interests
├── contexts/           # React Context for state management
│   └── AuthContext.jsx # Authentication state
├── config/            # Configuration files
│   └── api.js         # API endpoints configuration
└── App.jsx            # Main application component
```

### Key Frontend Features

#### 1. **Authentication System**
- Context-based authentication using React Context API
- JWT token storage in localStorage
- Protected routes with authentication guards
- Automatic token validation on app load

```javascript
// AuthContext implementation
const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// Token management
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}
```

#### 2. **State Management**
- React Context for global authentication state
- Local useState hooks for component-specific state
- Custom hooks for reusable logic

#### 3. **Routing & Navigation**
- React Router DOM with protected routes
- Programmatic navigation using useNavigate
- Route-based code splitting

#### 4. **UI/UX Features**
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Animations**: CSS keyframes and transforms for engaging UX
- **Interactive Elements**: Hover effects, transitions, loading states
- **Carousel Component**: Auto-sliding testimonials with manual controls

#### 5. **Event Management**
- Event creation with category selection
- Event discovery with interest-based filtering
- Real-time registration status updates
- User's hosted events dashboard

#### 6. **Interest System**
- Multi-select interest categories
- Interest-based event filtering
- Dynamic interest matching algorithm

## 🔧 Backend Architecture

### API Structure
```
backend/
├── models/             # Database schemas
│   ├── User.js        # User model with interests
│   └── Event.js       # Event model with participants
├── routes/            # API endpoints
│   ├── auth.js        # Authentication routes
│   ├── events.js      # Event CRUD operations
│   └── users.js       # User management
├── utils/             # Utility functions
│   └── emailService.js # Email notifications
├── scripts/           # Database scripts
│   └── fixInterests.js # Interest format migration
└── server.js          # Express server setup
```

### Database Design

#### User Schema
```javascript
{
  name: String (required),
  email: String (unique, required),
  password: String (hashed, required),
  interests: [String] (enum values),
  createdAt: Date,
  updatedAt: Date
}
```

#### Event Schema
```javascript
{
  title: String (required),
  description: String (required),
  category: String (enum, required),
  date: Date (required),
  location: String (required),
  maxParticipants: Number (required),
  organizer: ObjectId (ref: User),
  participants: [ObjectId] (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

#### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create new event
- `GET /api/events/my-hosted` - Get user's hosted events
- `POST /api/events/:id/register` - Register for event

#### Users
- `PUT /api/users/interests` - Update user interests

### Security Implementation

#### 1. **Password Security**
```javascript
// Password hashing with bcryptjs
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);
```

#### 2. **JWT Authentication**
```javascript
// Token generation
const token = jwt.sign(
  { userId: user._id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);
```

#### 3. **Middleware Protection**
```javascript
// Authentication middleware
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Access denied' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
```

## 🎯 Key Technical Implementations

### 1. **Interest-Based Filtering System**
```javascript
// Frontend filtering logic
const matchesUserInterests = (event) => {
  if (!user?.interests?.length) return true;
  
  const categoryMap = {
    'sip-savor': 'Sip & Savor',
    'sweat-play': 'Sweat & Play',
    // ... more mappings
  };
  
  const eventCategoryName = categoryMap[event.category];
  return user.interests.includes(eventCategoryName);
};
```

### 2. **Animation System**
```css
/* CSS Keyframes for animations */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}
```

### 3. **Carousel Implementation**
```javascript
// Auto-sliding testimonials
useEffect(() => {
  if (!isAutoSliding) return;
  
  const interval = setInterval(() => {
    setCurrentTestimonial(prev => 
      prev === testimonials.length - 1 ? 0 : prev + 1
    );
  }, 4000);

  return () => clearInterval(interval);
}, [isAutoSliding]);
```

### 4. **Error Handling**
```javascript
// Backend error middleware
app.use((error, req, res, next) => {
  console.error(error.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? error.message : {}
  });
});
```

## 🚀 Deployment Configuration

### Vercel Configuration

#### Backend (vercel.json)
```json
{
  "version": 2,
  "builds": [{ "src": "server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "/server.js" }]
}
```

#### Frontend (vercel.json)
```json
{
  "version": 2,
  "builds": [{ "src": "package.json", "use": "@vercel/static-build" }],
  "routes": [{ "src": "/(.*)", "dest": "/index.html" }]
}
```

### Environment Variables
```bash
# Backend
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
NODE_ENV=production

# Frontend
VITE_API_URL=https://your-backend.vercel.app
```

## 📝 Technical Interview Questions & Answers

### React.js Questions

#### Q1: How do you manage state in this React application?
**Answer:** We use a hybrid approach:
- **React Context** for global authentication state that needs to be shared across components
- **useState hooks** for local component state like form inputs and UI toggles
- **Custom hooks** could be implemented for reusable stateful logic

#### Q2: Explain the authentication flow in your React app.
**Answer:** 
1. User submits login credentials
2. Frontend sends POST request to `/api/auth/login`
3. Backend validates credentials and returns JWT token
4. Frontend stores token in localStorage and updates AuthContext
5. Token is automatically added to all subsequent API requests via axios interceptors
6. Protected routes check authentication status from context

#### Q3: How do you handle side effects in React?
**Answer:** We use useEffect hooks for:
- API calls when components mount
- Setting up intervals for auto-sliding carousel
- Cleanup functions to prevent memory leaks
- Dependency arrays to control when effects run

#### Q4: Explain your routing strategy.
**Answer:** We use React Router DOM v6 with:
- Route-based component rendering
- Protected routes using authentication context
- Programmatic navigation with useNavigate hook
- Nested routing for different sections of the app

#### Q5: How do you optimize React performance?
**Answer:** 
- Functional components with hooks (lighter than class components)
- Conditional rendering to avoid unnecessary DOM updates
- Event handler optimization with useCallback (could be implemented)
- Component memoization with React.memo (could be added for heavy components)

### Node.js Questions

#### Q6: Explain your Express.js middleware stack.
**Answer:**
```javascript
app.use(cors()); // Enable cross-origin requests
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
// Custom auth middleware for protected routes
// Error handling middleware at the end
```

#### Q7: How do you handle asynchronous operations?
**Answer:** We use async/await pattern throughout:
- Database operations with Mongoose
- API route handlers are async functions
- Proper error handling with try-catch blocks
- Promise-based HTTP requests on frontend

#### Q8: Explain your database design decisions.
**Answer:**
- **User model**: Stores authentication data and user preferences (interests)
- **Event model**: Contains event details with references to organizer and participants
- **Mongoose ODM**: Provides schema validation and object modeling
- **Indexing**: MongoDB indexes on frequently queried fields like email

#### Q9: How do you secure your API?
**Answer:**
- **JWT tokens** for stateless authentication
- **Password hashing** with bcryptjs and salt rounds
- **Input validation** with Mongoose schemas
- **CORS configuration** to control cross-origin access
- **Environment variables** for sensitive data

#### Q10: Explain your error handling strategy.
**Answer:**
- Try-catch blocks in async functions
- Global error middleware in Express
- Consistent error response format
- Different error handling for development vs production
- Frontend displays user-friendly error messages

### Database Questions

#### Q11: Why did you choose MongoDB over SQL databases?
**Answer:**
- **Flexible schema**: User interests and event data can vary
- **JSON-like documents**: Natural fit for JavaScript/Node.js
- **Scalability**: Easy horizontal scaling with MongoDB Atlas
- **Rapid development**: Less setup overhead than relational databases

#### Q12: How do you handle data relationships?
**Answer:**
- **User-Event relationship**: Events reference organizer user ID
- **Many-to-many**: Event participants array stores user IDs
- **Population**: Mongoose populate() for fetching related data
- **Embedded vs References**: Small arrays embedded, large collections referenced

### System Design Questions

#### Q13: How would you scale this application?
**Answer:**
- **Frontend**: CDN for static assets, code splitting, lazy loading
- **Backend**: Horizontal scaling with load balancers, caching with Redis
- **Database**: MongoDB sharding, read replicas
- **Infrastructure**: Container orchestration with Docker/Kubernetes

#### Q14: How do you handle real-time features?
**Answer:**
- **Current**: HTTP polling for updates
- **Future**: WebSocket implementation with Socket.io
- **Real-time notifications**: Push notifications for event updates
- **Live updates**: Real-time participant counts

#### Q15: Explain your deployment strategy.
**Answer:**
- **Serverless deployment** on Vercel for cost-effectiveness
- **Separate deployments** for frontend and backend
- **Environment-based configuration** for different stages
- **Git-based deployment** with automatic builds

## 🔧 Development Workflow

### 1. **Local Development Setup**
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### 2. **Code Organization**
- Modular component structure
- Separation of concerns (models, routes, controllers)
- Environment-based configuration
- Consistent naming conventions

### 3. **Version Control**
- Git workflow with meaningful commits
- .gitignore for node_modules and environment files
- Branch-based development (could be implemented)

## 🚀 Future Enhancements

### Technical Improvements
1. **Testing**: Unit tests with Jest, integration tests
2. **Performance**: React.memo, useMemo, useCallback optimization
3. **SEO**: Server-side rendering or static generation
4. **PWA**: Service workers for offline functionality
5. **Real-time**: WebSocket implementation
6. **Monitoring**: Error tracking with Sentry
7. **CI/CD**: Automated testing and deployment pipelines

### Feature Enhancements
1. **Advanced Search**: Full-text search with filters
2. **User Profiles**: Detailed user pages with activity history
3. **Event Categories**: More granular categorization
4. **Social Features**: Friend connections, event sharing
5. **Payment Integration**: Paid events with Stripe
6. **Mobile App**: React Native implementation

## 📊 Performance Considerations

### Frontend Optimization
- Bundle size optimization with Vite
- Image optimization and lazy loading
- Code splitting for route-based chunks
- CSS purging with Tailwind

### Backend Optimization
- Database query optimization
- Caching strategies for frequently accessed data
- Rate limiting for API endpoints
- Connection pooling for database

### Security Best Practices
- Input sanitization and validation
- SQL injection prevention (MongoDB injection)
- XSS protection
- CSRF protection for state-changing operations
- Regular security audits of dependencies

---