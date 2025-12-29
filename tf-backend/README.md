# Backend API - Flawless Service Platform

A secure, high-performance Node.js REST API built with Express.js and MySQL, providing comprehensive services for a beauty/wellness service marketplace including authentication, bookings, payments, messaging, and admin management.

##  Features

### Core Functionality
- **User Management** - Registration, authentication, profile management
- **Artist Management** - Artist profiles, availability, location tracking
- **Booking System** - Create, manage, and track service bookings
- **Payment Processing** - Stripe integration for secure payments
- **Shopping Cart** - Cart management with real-time updates
- **Messaging** - Real-time chat between users and artists
- **Catalog Management** - Services, categories, and pricing
- **Wishlist** - Save favorite services
- **Training Services** - Training booking and management
- **Gallery** - Image management for artists and services
- **Device Management** - Push notification device tokens

### Security Features
-  JWT-based authentication
-  Input validation on all endpoints
-  SQL injection prevention (parameterized queries)
-  IDOR protection (resource ownership verification)
-  Secure error handling (no stack trace exposure)
-  Environment-based configuration
-  Rate limiting ready

### Performance Features
-  In-memory caching (node-cache)
-  Database connection pooling
-  Optimized query performance
-  Cache invalidation strategies

##  Tech Stack

### Core
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database (mysql2 with connection pooling)
- **JWT** - Authentication (jsonwebtoken)

### Security & Validation
- **Joi** - Input validation
- **bcrypt** - Password hashing
- **dotenv** - Environment configuration

### Third-Party Services
- **Stripe** - Payment processing
- **AWS S3** - File storage
- **Twilio** - SMS/OTP services
- **Firebase Admin** - Push notifications
- **Nodemailer** - Email services

### Utilities
- **node-cache** - In-memory caching
- **moment** - Date/time handling
- **uuid** - Unique ID generation
- **multer** - File uploads
- **axios** - HTTP client

##  Architecture

### Layered Architecture

```
┌─────────────────────────────────────┐
│         Routes Layer                │  ← API endpoint definitions
├─────────────────────────────────────┤
│       Controllers Layer             │  ← Request/response handling
├─────────────────────────────────────┤
│        Services Layer               │  ← Business logic
├─────────────────────────────────────┤
│      Data Access Layer              │  ← Database operations
└─────────────────────────────────────┘
```

### Project Structure

```
backend-main/
├── routes/              # API route definitions
│   ├── index.js        # Main API router
│   ├── admin/          # Admin routes
│   └── legacyRoutes.js # Backward compatibility
├── controllers/         # Request handlers
├── services/           # Business logic
├── middleware/         # Auth, validation, error handling
├── validators/         # Input validation schemas
├── utils/              # Utility functions
├── connection/         # Database connections
├── config/             # Configuration files
└── tests/              # Test suites
```

For detailed architecture documentation, see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## 🛠️ Setup & Installation

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database Configuration
DB_HOST=your_db_host
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-2
S3_BUCKET_NAME=your_bucket_name

# Google Maps API
GOOGLE_MAPS_API_KEY=your_google_maps_key

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number

# Firebase (optional)
FIREBASE_PROJECT_ID=your_firebase_project_id
```

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Verify database connection**
   ```bash
   npm run verify:db
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run local

   # Production mode
   npm start
   ```

The API will be available at `http://localhost:3000` (or your configured port).

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
Most endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Main Endpoints

#### Authentication (`/api/auth`)
- `POST /api/auth/create-user` - Register new user
- `GET /api/auth/get-otp` - Request OTP
- `POST /api/auth/token` - Get JWT token

#### Users (`/api/users`)
- `GET /api/users/profile` - Get user profile
- `POST /api/users/update` - Update user profile
- `POST /api/users/addresses` - Add address
- `GET /api/users/addresses` - Get user addresses
- `DELETE /api/users/addresses/:addressId` - Delete address

#### Bookings (`/api/bookings`)
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get user bookings
- `POST /api/bookings/cancel` - Cancel booking
- `POST /api/bookings/gratuity` - Add gratuity
- `POST /api/bookings/rating` - Add rating

#### Artists (`/api/artists`)
- `GET /api/artists/profile` - Get artist profile
- `POST /api/artists/update` - Update artist profile
- `GET /api/artists/bookings` - Get artist bookings

#### Payments (`/api/payments`)
- `POST /api/payments/gratuity` - Process gratuity payment
- `POST /api/payments/booking` - Process booking payment

#### Catalog (`/api/catalog`)
- `GET /api/catalog/categories` - Get categories with services
- `GET /api/catalog/subcategories` - Get subcategories by service
- `GET /api/catalog/prices` - Get prices for service

For complete API documentation, see the Postman collection in `connection/postmancollection/`.

##  Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
- Unit tests for services
- Integration tests for API endpoints
- Test helpers in `tests/helpers/`

##  Security

### Implemented Security Measures
-  **Authentication** - JWT-based authentication on all protected routes
-  **Authorization** - Resource ownership verification (IDOR protection)
-  **Input Validation** - Joi validation on all endpoints
-  **SQL Injection Prevention** - Parameterized queries throughout
-  **Error Handling** - Secure error responses (no stack traces in production)
-  **Secrets Management** - Environment variables only, no hardcoded secrets
-  **CORS** - Configured for allowed origins

### Security Best Practices
- All user IDs come from JWT tokens, not request parameters
- Resource ownership verified before access/modification
- Input sanitization and validation
- Secure password hashing with bcrypt
- Environment-based configuration

For detailed security documentation, see [`docs/SECURITY_FIXES_SUMMARY.md`](docs/SECURITY_FIXES_SUMMARY.md).

##  Performance

### Caching Strategy
- **Catalog Data** - 2 hours TTL (rarely changes)
- **Artist Details** - 30 minutes TTL
- **User Profile** - 15 minutes TTL
- **User Addresses** - 15 minutes TTL

### Performance Optimizations
- Database connection pooling
- In-memory caching for frequently accessed data
- Optimized database queries
- Cache invalidation on data updates

Expected performance improvements:
- 70-95% reduction in database queries for cached endpoints
- 10-40x faster response times for cached requests

##  Code Quality

### Documentation
- JSDoc comments on all public functions
- Architecture documentation
- Code style guide
- API documentation

### Naming Conventions
- **Routes**: `{resource}Routes.js`
- **Controllers**: `{action}{Resource}Controller`
- **Services**: `{Action}{Resource}`
- **Validators**: `{resource}Validators.js`

For detailed coding standards, see [`docs/CODE_STYLE_GUIDE.md`](docs/CODE_STYLE_GUIDE.md).

##  Available Scripts

```bash
# Start server
npm start

# Start in development mode with auto-reload
npm run local

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Verify database connection
npm run verify:db

# Import database
npm run import:db
```

##  Key Files

- `app.js` - Main application entry point
- `routes/index.js` - Main API router
- `middleware/authMiddleware.js` - JWT authentication
- `middleware/errorHandler.js` - Error handling
- `middleware/validation.js` - Input validation
- `utils/cacheService.js` - Caching service
- `connection/database.js` - Database connection pool

##  Configuration

### Database
- Connection pooling configured
- Production and development environments
- Automatic reconnection handling

### Caching
- In-memory caching with node-cache
- Configurable TTL per endpoint
- Automatic cache invalidation

### Error Handling
- Centralized error handler
- Environment-aware error messages
- Proper HTTP status codes
- Error logging

##  Documentation

Comprehensive documentation is available in the `docs/` directory:

- [`ARCHITECTURE.md`](docs/ARCHITECTURE.md) - Architecture overview
- [`CODE_STYLE_GUIDE.md`](docs/CODE_STYLE_GUIDE.md) - Coding standards
- [`SECURITY_FIXES_SUMMARY.md`](docs/SECURITY_FIXES_SUMMARY.md) - Security improvements
- [`PERFORMANCE_CACHING_SUMMARY.md`](docs/PERFORMANCE_CACHING_SUMMARY.md) - Caching implementation
- [`INPUT_VALIDATION_ERROR_HANDLING_SUMMARY.md`](docs/INPUT_VALIDATION_ERROR_HANDLING_SUMMARY.md) - Validation & error handling
- [`POSTMAN_TESTING_GUIDE.md`](docs/POSTMAN_TESTING_GUIDE.md) - API testing guide

##  Contributing

### Code Style
- Follow the established naming conventions
- Add JSDoc comments to all public functions
- Write tests for new features
- Follow the layered architecture pattern

### Pull Request Process
1. Create a feature branch
2. Make your changes
3. Add/update tests
4. Update documentation
5. Submit pull request

##  Important Notes

### Environment Variables
- **Never commit `.env` file** - It's in `.gitignore`
- **Rotate exposed credentials** - If any secrets were exposed, rotate them immediately
- **Use strong secrets** - Generate strong JWT secrets and database passwords

### Database
- Use parameterized queries only
- Verify resource ownership before operations
- Handle database errors gracefully

### Security
- Keep dependencies updated
- Review security advisories regularly
- Follow security best practices

##  Support

For issues, questions, or contributions, please refer to the project documentation or contact the development team.

