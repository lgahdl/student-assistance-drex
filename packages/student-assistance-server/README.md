# Student Assistance Server

> **Node.js/Express server for managing student assistance data, expense types, and transaction metadata**

## 📋 Overview

The Student Assistance Server is a RESTful API backend that manages the student assistance system for DREX (Digital Real) blockchain integration. It handles student registration, spending limits, expense categorization, transaction metadata, and provides authentication and authorization for web and mobile applications.

## 🏗️ Architecture

### System Architecture

The server follows a layered architecture pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
│              (Web App, Mobile App, Admin Panel)            │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/REST API
┌─────────────────────────▼───────────────────────────────────┐
│                  Express.js Server                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │ Middleware  │ │   Routes    │ │      Validation        ││
│  │   Layer     │ │             │ │      (Zod)            ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────────┬───────────────────────────────────┘
                          │ Prisma ORM
┌─────────────────────────▼───────────────────────────────────┐
│                    PostgreSQL Database                     │
└─────────────────────────────────────────────────────────────┘
```

### Project Structure

```
src/
├── database/           # Database configuration and utilities
│   ├── client.ts      # Prisma client configuration
│   └── seed.ts        # Database seeding script
├── middleware/         # Express middleware functions
│   ├── auth.ts        # JWT authentication middleware
│   ├── errorHandler.ts # Global error handling
│   └── notFoundHandler.ts # 404 handler
├── routes/            # API route handlers
│   ├── auth.ts        # Authentication endpoints
│   ├── students.ts    # Student management endpoints
│   ├── expense-types.ts # Expense types management
│   ├── transactions.ts # Transaction metadata endpoints
│   ├── addresses.ts   # Known addresses management
│   └── health.ts      # Health check endpoints
├── utils/             # Utility functions
│   ├── validation.ts  # Zod validation schemas
│   └── logger.ts      # Winston logger configuration
└── index.ts           # Application entry point

prisma/
├── schema.prisma      # Database schema definition
└── migrations/        # Database migration files
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Docker (optional)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment setup:**
   Create a `.env` file:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5434/student_assistance_db"
   
   # JWT
   JWT_SECRET="your-super-secret-jwt-key"
   JWT_EXPIRES_IN="24h"
   
   # Server
   PORT=3001
   NODE_ENV=development
   ```

3. **Database setup:**
   ```bash
   # Generate Prisma client
   npm run generate
   
   # Run migrations
   npm run migrate
   
   # Seed database (optional)
   npm run seed
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run migrate` | Run database migrations |
| `npm run generate` | Generate Prisma client |
| `npm run studio` | Open Prisma Studio |
| `npm run seed` | Seed database with initial data |
| `npm test` | Run tests |

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | Secret key for JWT signing | - |
| `JWT_EXPIRES_IN` | JWT expiration time | `24h` |
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment mode | `development` |

### Database Schema

The application uses the following main entities:

- **Users**: Admin and staff authentication
- **Students**: Student registration with wallet addresses
- **ExpenseTypes**: Categorized expense types (Food, Housing, etc.)
- **SpendingLimits**: Per-student spending restrictions
- **Transactions**: Blockchain transaction metadata with student and receiver relationships
- **Receivers**: Known establishment addresses and recipient information

## 📡 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Authentication

All endpoints (except health and auth) require JWT authentication via `Authorization: Bearer <token>` header.

### Endpoints Overview

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/health` | GET | Health check endpoint | No |
| `/api/auth/login` | POST | Admin/Staff login | No |
| `/api/students` | GET | List students with filters | Yes |
| `/api/students/:walletAddress` | GET | Get student by wallet address | Yes |
| `/api/students` | POST | Create new student | Staff+ |
| `/api/students/:walletAddress` | PUT | Update student | Staff+ |
| `/api/students/:walletAddress` | DELETE | Delete student | Staff+ |
| `/api/students/:walletAddress/toggle-active` | PUT | Toggle student active status | Staff+ |
| `/api/receivers` | GET | List receivers with filters | Yes |
| `/api/receivers/:address` | GET | Get receiver by address | Yes |
| `/api/receivers/check/:address` | GET | Check if receiver exists | Yes |
| `/api/receivers` | POST | Create new receiver | Staff+ |
| `/api/receivers/:address` | PUT | Update receiver | Staff+ |
| `/api/receivers/:address/verify` | PUT | Toggle receiver verification | Staff+ |
| `/api/receivers/:address` | DELETE | Delete receiver | Staff+ |
| `/api/expense-types` | GET | List all expense types | Yes |
| `/api/expense-types/:id` | GET | Get expense type by ID | Yes |
| `/api/expense-types` | POST | Create expense type | Staff+ |
| `/api/expense-types/:id` | PUT | Update expense type | Staff+ |
| `/api/expense-types/:id` | DELETE | Delete expense type | Staff+ |
| `/api/transactions` | GET | List transactions with filters | Yes |
| `/api/transactions/:txHash` | GET | Get transaction by hash | Yes |
| `/api/transactions/:txHash` | PUT | Update transaction metadata | Yes |
| `/api/transactions/student/:address` | GET | Get transactions for student | Yes |
| `/api/transactions/bulk-create` | POST | Bulk create transactions | Yes |
| `/api/transactions/stats` | GET | Get transaction statistics | Yes |

### Request/Response Examples

#### Authentication
```bash
# Login as admin
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Response
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "username": "admin",
    "role": "admin"
  }
}
```

#### Student Management
```bash
# Get all students
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/students

# Get student by wallet address
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/students/0x1234567890123456789012345678901234567890

# Create new student
curl -X POST http://localhost:3001/api/students \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0xabcdef1234567890123456789012345678901234",
    "name": "João Silva",
    "cpf": "12345678901",
    "university": "UFSC",
    "monthlyAmount": 500.00,
    "spendingLimits": [
      {
        "expenseTypeId": 1,
        "limitValue": 200.00,
        "limitType": "absolute"
      }
    ]
  }'
```

#### Receiver Management
```bash
# Get all receivers with expense types
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/receivers

# Get receiver by address
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/receivers/0x4567890123456789012345678901234567890123
```

#### Transaction Management
```bash
# Get transactions for a specific student
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/transactions/student/0x1234567890123456789012345678901234567890

# Update transaction with student and receiver
curl -X PUT http://localhost:3001/api/transactions/0xabc123... \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentAddress": "0x1234567890123456789012345678901234567890",
    "receiverAddress": "0x4567890123456789012345678901234567890123",
    "expenseTypeId": 1
  }'

# Bulk create transactions (for blockchain indexer)
curl -X POST http://localhost:3001/api/transactions/bulk-create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transactions": [
      {
        "txHash": "0xabc123...",
        "fromAddress": "0x1234567890123456789012345678901234567890",
        "toAddress": "0x4567890123456789012345678901234567890123",
        "amount": "25.50",
        "timestamp": "2024-01-01T12:00:00Z",
        "blockNumber": "12345678"
      }
    ]
  }'
```

## 🔄 System Flows

### Authentication Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant DB as Database
    
    C->>S: POST /api/auth/login<br/>{username, password}
    S->>S: Validate request data
    S->>DB: SELECT user WHERE username
    DB-->>S: User data (hashed password)
    S->>S: Compare passwords (bcrypt)
    alt Valid credentials
        S->>S: Generate JWT token
        S-->>C: 200 OK<br/>{token, user}
    else Invalid credentials
        S-->>C: 401 Unauthorized<br/>{error: "Invalid credentials"}
    end
```

### Student Registration Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant Auth as Auth Middleware
    participant DB as Database
    
    C->>S: POST /api/students<br/>{student data, spending limits}
    S->>Auth: Verify JWT token
    Auth->>Auth: Decode & validate token
    alt Valid token
        Auth-->>S: User info
        S->>S: Validate request data (Zod)
        S->>DB: BEGIN TRANSACTION
        S->>DB: INSERT INTO students
        S->>DB: INSERT INTO spending_limits
        S->>DB: COMMIT TRANSACTION
        DB-->>S: Created student with limits
        S-->>C: 201 Created<br/>{student, spending_limits}
    else Invalid token
        Auth-->>C: 401 Unauthorized
    else Validation error
        S-->>C: 400 Bad Request<br/>{validation errors}
    else Database error
        S->>DB: ROLLBACK TRANSACTION
        S-->>C: 500 Internal Server Error
    end
```

### Transaction Indexing Flow

```mermaid
sequenceDiagram
    participant I as Indexer
    participant S as Server
    participant DB as Database
    
    Note over I: Blockchain event detected
    I->>S: POST /api/transactions/bulk<br/>[{transaction_hash, block_number, from_address, to_address, amount, timestamp}]
    S->>S: Validate JWT token (indexer auth)
    S->>S: Validate request data
    loop For each transaction
        S->>DB: SELECT student WHERE wallet_address = from_address
        alt Student found
            S->>DB: INSERT INTO transactions<br/>(student_id, metadata)
        else Student not found
            S->>DB: INSERT INTO transactions<br/>(student_id: null, metadata)
        end
    end
    S-->>I: 201 Created<br/>{created_count, skipped_count}
    
    Note over S,DB: Transactions stored for<br/>expense categorization
```

### Expense Validation Flow

```mermaid
sequenceDiagram
    participant App as Mobile/Web App
    participant S as Server
    participant DB as Database
    
    App->>S: GET /api/students/:id/spending-status
    S->>S: Authenticate request
    S->>DB: SELECT student WITH spending_limits
    S->>DB: SELECT transactions WHERE student_id<br/>AND date >= current_month
    S->>S: Calculate spent amounts by expense type
    S->>S: Compare with spending limits
    S-->>App: 200 OK<br/>{limits, spent, remaining, violations}
    
    Note over App: Display spending status<br/>and limit warnings
```

## 🔒 Security Features

### Authentication & Authorization

- **JWT-based authentication** with configurable expiration
- **Role-based access control** (Admin, Staff)
- **Password hashing** using bcryptjs
- **Request validation** using Zod schemas

### Security Middleware

- **Helmet.js** for security headers
- **CORS** configuration for cross-origin requests
- **Rate limiting** to prevent abuse
- **Request sanitization** and validation
- **Error handling** without information leakage

### Data Protection

- **Wallet address validation** using ethers.js
- **CPF format validation** (Brazilian tax ID)
- **SQL injection prevention** via Prisma ORM
- **Input sanitization** for all user inputs

## 📊 Entity Relationship Diagram

The database follows a normalized structure optimized for blockchain integration:

```mermaid
erDiagram
    User {
        bigint id PK
        string username UK
        string password_hash
        string role
        datetime created_at
        datetime updated_at
    }
    
    Student {
        string wallet_address PK
        string name
        string cpf UK
        string university
        decimal monthly_amount
        boolean active
        datetime created_at
        datetime updated_at
    }
    
    ExpenseType {
        bigint id PK
        string name UK
        string description
        string category
        boolean active
        datetime created_at
    }
    
    Receiver {
        string address PK
        string name
        string cpf_cnpj
        string type
        boolean verified
        datetime created_at
    }
    
    Transaction {
        string tx_hash PK
        string from_address
        string to_address
        decimal amount
        datetime timestamp
        bigint block_number
        string student_address FK
        string receiver_address FK
        bigint expense_type_id FK
        boolean is_unknown_destiny
        datetime indexed_at
        datetime updated_at
    }
    
    SpendingLimit {
        bigint id PK
        string student_address FK
        bigint expense_type_id FK
        decimal limit_value
        string limit_type
        datetime created_at
        datetime updated_at
    }
    
    ReceiverExpenseType {
        string receiver_address PK,FK
        bigint expense_type_id PK,FK
        datetime created_at
    }
    
    IndexerState {
        string key PK
        string value
        datetime updated_at
    }
    
    Student ||--o{ SpendingLimit : "has spending limits"
    Student ||--o{ Transaction : "makes transactions"
    Receiver ||--o{ Transaction : "receives transactions"
    Receiver ||--o{ ReceiverExpenseType : "accepts expense types"
    ExpenseType ||--o{ SpendingLimit : "constrains spending"
    ExpenseType ||--o{ Transaction : "categorizes"
    ExpenseType ||--o{ ReceiverExpenseType : "accepted by receivers"
```

### Key Design Decisions

1. **Blockchain-First Architecture**: Students and Receivers use wallet addresses as primary keys instead of auto-increment IDs
2. **Expense Type Relationships**: Receivers can be linked to multiple expense types, making categorization automatic
3. **Address-Based Linking**: Transactions are automatically linked to known students and receivers based on wallet addresses
4. **Flexible Spending Limits**: Students can have different limits per expense type (percentage or absolute)
5. **Transaction Indexing**: Built-in support for blockchain event indexing with state management

## 🚨 Error Handling

The server implements comprehensive error handling:

### Error Types

| Error Code | Description | Response |
|------------|-------------|----------|
| `400` | Bad Request - Invalid input data | `{error: "Validation error", details: [...]}` |
| `401` | Unauthorized - Invalid/missing token | `{error: "Authentication required"}` |
| `403` | Forbidden - Insufficient permissions | `{error: "Insufficient permissions"}` |
| `404` | Not Found - Resource doesn't exist | `{error: "Resource not found"}` |
| `409` | Conflict - Duplicate resource | `{error: "Resource already exists"}` |
| `500` | Internal Server Error | `{error: "Internal server error"}` |

### Error Response Format

```json
{
  "error": "Error message",
  "details": "Additional details (in development)",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/students"
}
```

## 📈 Monitoring & Logging

### Logging System

The server uses Winston for structured logging:

```javascript
// Log levels: error, warn, info, http, verbose, debug
logger.info('Student created', { 
  studentId: student.id, 
  userId: user.id,
  action: 'CREATE_STUDENT'
});
```

### Health Checks

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Basic health check |
| `GET /health/detailed` | Detailed system health with database stats |

### Metrics Tracked

- **Database connection status**
- **Active connections count**
- **Request/response times**
- **Error rates by endpoint**
- **Authentication success/failure rates**

## 🐳 Docker Configuration

### Development

```bash
# Start database only
docker-compose up server-db

# Start full stack
docker-compose up
```

### Production

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

## 🧪 Testing

### Test Structure

```
tests/
├── unit/              # Unit tests
│   ├── middleware/    # Middleware tests
│   ├── routes/        # Route handler tests
│   └── utils/         # Utility function tests
├── integration/       # Integration tests
│   ├── auth.test.js   # Authentication flow tests
│   ├── students.test.js # Student management tests
│   └── transactions.test.js # Transaction tests
└── fixtures/          # Test data fixtures
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- --testPathPattern=students
```

## 🔧 Development Guidelines

### Code Style

- **TypeScript** with strict mode enabled
- **ESLint** for code linting
- **Prettier** for code formatting
- **Conventional Commits** for commit messages

### API Design Principles

- **RESTful endpoints** with clear resource naming
- **Consistent response format** across all endpoints
- **Proper HTTP status codes** for different scenarios
- **Comprehensive input validation** using Zod
- **Pagination** for list endpoints
- **Filtering and sorting** capabilities

### Database Best Practices

- **Migrations** for schema changes
- **Indexes** on frequently queried fields
- **Constraints** for data integrity
- **Soft deletes** for important entities
- **Audit trails** with created_at/updated_at timestamps

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'feat: add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Commit Message Format

```
type(scope): description

feat: add new feature
fix: fix bug
docs: update documentation
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:

- **GitHub Issues**: Create an issue for bugs or feature requests
- **Documentation**: Check this README and inline code comments
- **Team Contact**: Reach out to the TCC Student Assistance Team

---

**Built with ❤️ by the TCC Student Assistance Team** 