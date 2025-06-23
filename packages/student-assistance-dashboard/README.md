# Student Assistance Dashboard

A modern React dashboard application for managing the Student Assistance System, providing interfaces for admin and staff users to manage students, receivers, transactions, and expense types.

## 🚀 Features

- **Authentication & Authorization**: JWT-based login with role-based access control
- **Student Management**: Create, view, and manage student accounts with wallet addresses
- **Receiver Management**: Manage transaction receivers and their expense type associations
- **Transaction Monitoring**: View and categorize blockchain transactions
- **Expense Type Management**: Configure expense categories and spending limits
- **Responsive Design**: Modern UI with Tailwind CSS that works on all devices
- **Real-time Updates**: React Query for efficient data fetching and caching

## 🏗️ Architecture

### Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Router** for client-side routing
- **React Query** for server state management
- **React Hook Form** with Zod validation
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Axios** for API calls

### Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── DashboardLayout.tsx    # Main layout with sidebar
│   └── LoadingSpinner.tsx     # Loading indicator
├── hooks/               # Custom React hooks
│   └── useAuth.tsx      # Authentication context and hook
├── pages/               # Page components
│   ├── DashboardHome.tsx      # Dashboard overview
│   ├── LoginPage.tsx          # Authentication page
│   ├── StudentsPage.tsx       # Student management
│   ├── ReceiversPage.tsx      # Receiver management
│   ├── TransactionsPage.tsx   # Transaction monitoring
│   └── ExpenseTypesPage.tsx   # Expense type management
├── services/            # API service layer
│   └── api.ts          # Axios client and API methods
├── types/               # TypeScript type definitions
│   └── index.ts        # All application types
├── utils/               # Utility functions
│   └── index.ts        # Helper functions
├── App.tsx             # Main app component with routing
├── main.tsx            # Application entry point
├── index.css           # Global styles and Tailwind
└── vite-env.d.ts       # Vite type definitions
```

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Student Assistance Server running on port 3001

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file in the root directory:
   ```env
   VITE_API_URL=http://localhost:3001
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
npm run preview
```

## 🔐 Authentication

The dashboard uses JWT authentication with role-based access control:

### Demo Credentials

- **Admin**: `username: admin`, `password: admin123`
- **Staff**: `username: staff`, `password: staff123`

### User Roles

- **Admin**: Full access to all features
- **Staff**: Limited access to specific features

## 📱 User Interface

### Dashboard Layout

The application features a responsive sidebar layout with:

- **Sidebar Navigation**: Quick access to all sections
- **User Profile**: Shows current user info and logout option
- **Main Content**: Dynamic content area based on selected page
- **Mobile Responsive**: Collapsible sidebar for mobile devices

### Color Scheme

- **Primary**: Blue tones for main actions and highlights
- **Secondary**: Gray tones for text and secondary elements
- **Success**: Green for positive actions and status
- **Warning**: Yellow/orange for alerts and warnings
- **Error**: Red for errors and dangerous actions

## 🧩 Components

### Core Components

- **DashboardLayout**: Main layout wrapper with navigation
- **LoadingSpinner**: Reusable loading indicator
- **Authentication Forms**: Login form with validation

### Utility Components

- **Button variants**: Primary, secondary, success, danger
- **Form inputs**: Styled input fields with validation
- **Cards**: Content containers with consistent styling
- **Badges**: Status indicators and tags

## 🔧 API Integration

The dashboard communicates with the Student Assistance Server API:

### API Service

```typescript
// Example API usage
import apiService from './services/api';

// Login
const response = await apiService.login({ username, password });

// Get students
const students = await apiService.getStudents();

// Create receiver
const receiver = await apiService.createReceiver(receiverData);
```

### Error Handling

- Automatic token refresh
- Global error handling
- User-friendly error messages
- Offline support

## 🎨 Styling

### Tailwind CSS Classes

The application uses custom Tailwind classes for consistency:

```css
.btn              /* Base button styles */
.btn-primary      /* Primary button */
.btn-secondary    /* Secondary button */
.input            /* Form input styles */
.card             /* Card container */
.badge            /* Status badge */
```

### Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Flexible grid system
- Collapsible navigation

## 🔄 State Management

### React Query

Used for server state management:

```typescript
import { useQuery } from 'react-query';

const { data, isLoading, error } = useQuery(
  'students',
  () => apiService.getStudents()
);
```

### Local State

- React hooks for component state
- Context API for authentication
- Form state with React Hook Form

## 🚦 Routing

### Route Structure

```
/                           → Redirect to /dashboard
/login                      → Login page
/dashboard                  → Dashboard home
/dashboard/students         → Students management
/dashboard/receivers        → Receivers management (staff only)
/dashboard/transactions     → Transaction monitoring
/dashboard/expense-types    → Expense types (staff only)
```

### Protected Routes

Routes are protected based on authentication status and user roles:

```typescript
<ProtectedRoute requiredRole="staff">
  <ReceiversPage />
</ProtectedRoute>
```

## 🧪 Development

### Code Quality

- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Husky for pre-commit hooks

### Development Commands

```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
npm run lint        # Run ESLint
npm run type-check  # Run TypeScript checks
```

## 🎯 Features Roadmap

### Current Features ✅

- [x] Authentication with JWT
- [x] Responsive dashboard layout
- [x] Role-based access control
- [x] API integration setup
- [x] Basic page structure

### Upcoming Features 🚧

- [ ] Student CRUD operations
- [ ] Receiver management with expense types
- [ ] Transaction monitoring and categorization
- [ ] Expense type configuration
- [ ] Real-time transaction updates
- [ ] Data visualization with charts
- [ ] Export functionality
- [ ] Advanced filtering and search
- [ ] Notification system
- [ ] Dark mode support

## 🤝 Integration

### With Student Assistance Server

The dashboard integrates with the server API for:

- User authentication
- Student management
- Receiver management
- Transaction processing
- Expense type configuration

### With Blockchain

Future integration will include:

- Real-time transaction monitoring
- Wallet balance tracking
- Smart contract interactions

## 📄 License

This project is part of the Student Assistance System monorepo.

## 🔗 Related Packages

- [`student-assistance-server`](../student-assistance-server/README.md): Backend API server
- [`student-assistance-vault`](../student-assistance-vault/README.md): Blockchain vault contract

---

For more information about the complete system architecture, see the [main README](../../README.md). 