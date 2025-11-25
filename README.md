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

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
### **Phase 1: Month 1 (1,000 DAU) - ₹3,500/month**

| Service | Monthly Cost (₹) | Basic Configuration |
|---------|-------------------|---------------------|
| **AWS Lambda** | ₹800 | Standard x86, 512MB memory, basic setup |
| **API Gateway** | ₹600 | Basic setup, no caching initially |
| **DynamoDB On-Demand** | ₹400 | 5GB storage, 300K reads, 50K writes |
| **S3 Storage** | ₹300 | 20GB basic file storage |
| **CloudWatch** | ₹400 | Standard monitoring |
| **Route 53** | ₹200 | Basic DNS |
| **AWS WAF** | ₹300 | Basic security rules |
| **SES (Email)** | ₹200 | Email notifications |
| **Direct S3 Delivery** | ₹300 | Files served directly from S3 (no CDN) |

### **Phase 2: Months 2-3 (2,000 DAU) - ₹6,800/month**

| Service | Monthly Cost (₹) | Scaling Factor |
|---------|-------------------|----------------|
| **AWS Lambda** | ₹1,200 | 2M requests, standard config |
| **API Gateway** | ₹800 | 2M API calls, basic caching enabled |
| **DynamoDB On-Demand** | ₹800 | 10GB storage, 600K reads, 100K writes |
| **S3 Storage** | ₹400 | 40GB storage |
| **CloudFront CDN** | ₹1,200 | Adding CDN for global users |
| **ElastiCache** | ₹800 | t3.micro - add caching for performance |
| **CloudWatch** | ₹600 | Enhanced monitoring |
| **Route 53** | ₹200 | DNS management |
| **AWS WAF** | ₹400 | Security rules |
| **SES (Email)** | ₹200 | Email notifications |
| **S3 Data Transfer** | ₹200 | Direct delivery until CDN setup |

### **Phase 3: Months 4-7 (5,000 DAU) - ₹12,500/month**

| Service | Monthly Cost (₹) | Scaling Requirements |
|---------|-------------------|----------------------|
| **AWS Lambda** | ₹3,500 | 5M requests, standard memory |
| **API Gateway** | ₹2,000 | 5M API calls |
| **DynamoDB On-Demand** | ₹2,000 | 25GB storage, 1.5M reads, 300K writes |
| **S3 Storage** | ₹600 | 100GB storage |
| **CloudFront CDN** | ₹2,500 | Global distribution |
| **ElastiCache** | ₹1,500 | t3.medium |
| **CloudWatch** | ₹800 | Detailed monitoring |
| **AWS WAF** | ₹500 | Enhanced security |
| **SES (Email)** | ₹300 | Higher email volume |

### **Phase 4: Months 8-10 (7,000 DAU) - ₹17,500/month**

| Service | Monthly Cost (₹) | Growing Infrastructure |
|---------|-------------------|------------------------|
| **AWS Lambda** | ₹5,000 | 7M requests, some optimization |
| **API Gateway** | ₹2,800 | Higher traffic volume |
| **DynamoDB On-Demand** | ₹3,000 | 40GB storage, 2.5M reads, 500K writes |
| **S3 Storage** | ₹800 | 150GB storage |
| **CloudFront CDN** | ₹3,500 | Global content distribution |
| **ElastiCache** | ₹2,000 | t3.large |
| **CloudWatch** | ₹1,000 | Advanced monitoring |
| **AWS WAF** | ₹600 | Security scaling |
| **SES (Email)** | ₹400 | Email notifications |
| **Route 53** | ₹200 | DNS management |

### **Phase 5: Months 11-12 (10,000 DAU) - ₹25,000/month**

| Service | Monthly Cost (₹) | Full Scale Operations |
|---------|-------------------|----------------------|
| **AWS Lambda** | ₹7,500 | 10M requests, standard config |
| **API Gateway** | ₹4,000 | High volume traffic |
| **DynamoDB On-Demand** | ₹4,500 | 60GB storage, 4M reads, 800K writes |
| **S3 Storage** | ₹1,000 | 200GB storage |
| **CloudFront CDN** | ₹5,000 | Global distribution |
| **ElastiCache** | ₹2,500 | r6g.large |
| **CloudWatch** | ₹1,200 | Comprehensive monitoring |
| **AWS WAF** | ₹800 | Advanced security |
| **SES (Email)** | ₹500 | High email volume |
| **Route 53** | ₹200 | DNS management |
| **SNS (Push Notifications)** | ₹300 | Mobile push notifications |
\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
