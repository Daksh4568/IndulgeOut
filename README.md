# IndulgeOut - Interest-Based Social Discovery Platform

IndulgeOut is a modern web application that helps people connect offline around shared interests including food, music, sports, art, and experiences. Built with React.js, Node.js, MongoDB, and Tailwind CSS.

## 🚀 Features

### Core Functionality
- **Dual User System**: Separate registration for regular users and community members (event hosts)
- **Interest-Based Matching**: Users select interests during signup to discover relevant events
- **Event Management**: Community members can create, manage, and host events
- **Smart Event Discovery**: Users see events based on their selected interests
- **Email Notifications**: Automated emails for registrations and confirmations
- **Real-time Updates**: Live participant counts and event status

### User Types
1. **Regular Users**
   - Browse and register for events
   - Interest-based event recommendations
   - Personal dashboard with registered events

2. **Community Members**
   - All user features plus:
   - Create and manage events
   - Set participant limits and pricing
   - Receive notifications when users register

### Interest Categories
- 🍷 Sip & Savor (Food & Drinks)
- ⚽ Sweat & Play (Sports & Fitness)
- 🎨 Art & DIY (Creative Activities)
- 🤝 Social Mixers (Networking)
- 🏕️ Adventure & Outdoors (Nature Activities)
- 🎬 Epic Screenings (Movies & Entertainment)
- 🎲 Indoor & Board Games
- 🎵 Music & Performance

## 🛠️ Tech Stack

### Frontend
- **React.js** with Vite for fast development
- **Tailwind CSS** for modern, responsive design
- **React Router** for navigation
- **Axios** for API communication
- **Lucide React** for icons

### Backend
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Nodemailer** for email services
- **bcryptjs** for password hashing

## 📁 Project Structure

```
IndulgeOut/
├── frontend/                 # React.js application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # App entry point
│   ├── package.json
│   └── tailwind.config.js
├── backend/                 # Node.js API server
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   ├── server.js           # Server entry point
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd IndulgeOut
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   
   # Copy environment variables
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Configuration**
   
   Create `.env` file in the backend directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/indulgeout
   JWT_SECRET=your_jwt_secret_key
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   CLIENT_URL=http://localhost:3000
   ```

### Running the Application

1. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

2. **Start Backend Server**
   ```bash
   cd backend
   npm run dev
   ```
   Server runs on http://localhost:5000

3. **Start Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```
   Application runs on http://localhost:3000

## 📧 Email Configuration

The application uses Nodemailer for sending emails. For Gmail:

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password
3. Use the App Password in the `EMAIL_PASS` environment variable

## 🎯 Key Features Implementation

### User Registration Flow
1. User selects role (User or Community Member)
2. Users select interests during signup
3. Email confirmation sent
4. Interest-based event recommendations displayed

### Event Creation Flow (Community Members)
1. Fill event details form
2. Set categories, participant limits, location
3. Event published to relevant users
4. Registration notifications via email

### Event Registration Flow
1. Users browse events by interests
2. Register for events with one click
3. Confirmation email sent to user
4. Notification email sent to event host

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Events
- `GET /api/events` - Get all events (with filters)
- `POST /api/events` - Create event (community members only)
- `GET /api/events/:id` - Get single event
- `POST /api/events/:id/register` - Register for event
- `GET /api/events/recommended/for-me` - Get recommended events

### Users
- `PUT /api/users/interests` - Update user interests
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

## 🎨 Design Decisions

### UI/UX
- **Clean, Modern Design**: Inspired by Misfits with focus on community building
- **Interest-Driven Navigation**: Visual interest categories with colorful cards
- **Mobile-First Approach**: Responsive design for all screen sizes
- **Accessible Color Scheme**: High contrast and readable typography

### Technical Architecture
- **Component-Based Structure**: Reusable React components
- **RESTful API Design**: Clear, consistent API endpoints
- **Secure Authentication**: JWT tokens with proper validation
- **Email Integration**: Automated notifications for better UX
- **Database Optimization**: Indexed queries for performance

### User Experience
- **Simplified Onboarding**: Quick interest selection during signup
- **Smart Recommendations**: Events matched to user interests
- **Real-time Feedback**: Immediate confirmation of actions
- **Community Focus**: Emphasis on real-world connections

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
# Deploy dist/ folder to Vercel
```

### Backend (Railway/Render)
```bash
cd backend
# Set environment variables in hosting platform
# Deploy with start script: "node server.js"
```

### Database
- Use MongoDB Atlas for production
- Update MONGODB_URI in environment variables

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Inspired by Misfits platform design and community-building approach
- Built for the IndulgeOut web development assignment
- Focus on real-world connections and shared interests

---

**Live Demo**: [Deploy URL will be added here]
**Repository**: [GitHub URL will be added here]