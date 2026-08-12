# 🏢 ERP + CRM Frontend

A modern, professional **React + Vite + TypeScript** frontend for a comprehensive Enterprise Resource Planning (ERP) and Customer Relationship Management (CRM) system. Features role-based dashboards, professional UI, and complete customer, product, and sales management interfaces.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running Locally](#running-locally)
- [Build & Deployment](#build--deployment)
- [Project Structure](#project-structure)
- [Features by Role](#features-by-role)
- [UI Components](#ui-components)
- [Styling](#styling)
- [API Integration](#api-integration)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## 🎯 Overview

This frontend provides a polished, user-friendly interface for managing:

- **Authentication** - Secure login for 4 different roles
- **Customer Management** - CRM dashboard for customer data
- **Product Inventory** - Manage products and stock levels
- **Sales Challans** - Create and manage sales orders
- **Role-Based Dashboards** - Different UI per user role
- **Professional Design** - Modern, responsive interface

### Key Highlights

✅ **Role-Aware Interface** - Different UI for ADMIN, SALES, WAREHOUSE, ACCOUNTS  
✅ **Professional Design** - Color-coded badges, smooth animations  
✅ **Responsive Layout** - Works on desktop, tablet, mobile  
✅ **Real-time Updates** - Seamless API integration  
✅ **Error Handling** - User-friendly error messages  
✅ **Secure Authentication** - JWT token management  

---

## ✨ Features

### Authentication
- Email/password login
- JWT token storage
- Protected routes
- Auto logout on token expiry
- Quick login buttons (test credentials)

### Dashboard Features

#### 👥 Customers Tab
- View all customers
- Create new customers
- Edit customer details
- Add follow-up notes
- Status tracking (Lead, Active, Inactive)
- Customer type display (Retail, Wholesale, Distributor)
- Search and filter

#### 📦 Products Tab
- Browse product catalog
- View stock levels
- Stock status indicators (OK, LOW STOCK)
- Create products (ADMIN only)
- Edit product details
- Stock movement history

#### 📄 Challans Tab
- View all sales challans
- Create new challan
- Select customer and products
- Add multiple items
- Draft and confirm workflow
- Status tracking (DRAFT, CONFIRMED, CANCELLED)
- Download invoice (if PDF export enabled)

### Role-Based Features

| Feature | ADMIN | SALES | WAREHOUSE | ACCOUNTS |
|---------|-------|-------|-----------|----------|
| View Customers | ✅ | ✅ | 👁️ | 👁️ |
| Create Customer | ✅ | ✅ | ❌ | ❌ |
| View Products | ✅ | 👁️ | 👁️ | 👁️ |
| Create Product | ✅ | ❌ | ❌ | ❌ |
| View Challans | ✅ | ✅ | ✅ | ✅ |
| Create Challan | ✅ | ✅ | ❌ | ❌ |
| Confirm Challan | ✅ | ❌ | ✅ | ❌ |

(👁️ = View Only, ✅ = Full Access, ❌ = No Access)

### UI Components

- Professional navbar with user info
- Tab navigation
- Data tables with sorting
- Modal dialogs for forms
- Status badges (color-coded)
- Loading indicators
- Success/error messages
- Responsive design

---

## 🛠️ Tech Stack

### Core
- **Frontend Framework:** React 18.x
- **Build Tool:** Vite 5.x
- **Language:** TypeScript 5.x
- **Package Manager:** npm

### Styling & UI
- **CSS:** Custom professional CSS with CSS variables
- **Responsiveness:** Mobile-first design
- **Animations:** Smooth transitions and hover effects

### API & State Management
- **HTTP Client:** Axios
- **State Management:** React Hooks (useState, useEffect)
- **Routing:** React Router v6

### Development
- **Development Server:** Vite dev server
- **Hot Module Reload:** Yes
- **Code Quality:** TypeScript strict mode

### Deployment
- **Hosting:** Vercel
- **Build Output:** Static files (HTML, CSS, JS)
- **SSL/TLS:** Automatic HTTPS

---

## 📦 Prerequisites

### Required
- **Node.js** 20.x or higher ([Download](https://nodejs.org/))
- **npm** 10.x or higher (comes with Node.js)

### Recommended
- **Backend API** running at `http://localhost:4000` (for local development)
- **Git** (for version control)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/monikanimmana/ERP-CRM-Frontend.git
cd ERP-CRM-Frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create a `.env` file in the root directory:

```env
# Backend API URL for development
VITE_API_URL=http://localhost:4000
```

For production (Vercel):
```env
VITE_API_URL=https://your-backend-api.railway.app
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:4000` |

### Build Configuration

Located in `vite.config.ts`:
- React plugin enabled
- Port 3000 for dev server
- Optimized build output

---

## 🏃 Running Locally

### Development Mode (with Hot Reload)

```bash
npm run dev
```

Server will start at: `http://localhost:3000`

Press `h` and `Enter` in terminal for help.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint (if configured) |

---

## 🔨 Build & Deployment

### Local Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

This creates an optimized build in the `dist/` directory.

### Deploy to Vercel

#### Option 1: Automatic (Recommended)
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Add New Project"
4. Import your GitHub repository
5. Configure:
   - **Framework:** React
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Environment Variables:** Add `VITE_API_URL`
6. Click "Deploy"

#### Option 2: Manual with Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Deployment Settings

**Build Command:**
```bash
npm run build
```

**Output Directory:**
```
dist
```

**Environment Variables:**
```
VITE_API_URL=https://your-backend-api.railway.app
```

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── main.tsx                 # Entry point
│   ├── index.css                # Global styles
│   ├── styles.css               # Professional theme styles
│   ├── App.tsx                  # Main app component
│   ├── App.css                  # App styles
│   ├── App.test.tsx             # App tests
│   ├── LoginPage.tsx            # Login component
│   ├── Dashboard.tsx            # Main dashboard
│   ├── api.ts                   # API client (Axios)
│   ├── router.tsx               # Route configuration
│   ├── routeTree.gen.ts         # Generated routes
│   ├── server.ts                # Dev server config
│   └── start.ts                 # App startup
├── public/
│   └── favicon.ico              # Favicon
├── node_modules/                # Dependencies (generated)
├── dist/                        # Production build (generated)
├── .env                         # Environment variables (local)
├── .gitignore                   # Git ignore file
├── .dockerignore               # Docker ignore file
├── Dockerfile                   # Docker configuration
├── .prettierrc                  # Prettier config
├── .prettierignore             # Prettier ignore
├── tsconfig.json               # TypeScript config
├── vite.config.ts              # Vite configuration
├── package.json                # Project dependencies
├── package-lock.json           # Dependency lock file
├── components.json             # Component config
├── eslint.config.js            # ESLint configuration
├── bunfig.toml                 # Bun config (if using Bun)
├── bun.lock                    # Bun lock file (if using Bun)
├── README.md                   # This file
└── START_HERE.md               # Quick start guide
```

---

## 🎨 Features by Role

### ADMIN Role
```
Login → Full Dashboard
├── Customers Tab
│   ├── View all customers
│   ├── ➕ Add new customer
│   ├── Edit customer
│   └── Add notes
├── Products Tab
│   ├── View all products
│   └── ➕ Add new product
└── Challans Tab
    ├── View all challans
    ├── ➕ Create challan
    └── Confirm challan
```

### SALES Role
```
Login → Sales Dashboard
├── Customers Tab
│   ├── View all customers
│   ├── ➕ Add new customer
│   └── Add notes
├── Products Tab
│   └── View only (👁️)
└── Challans Tab
    ├── View own challans
    └── ➕ Create challan (draft)
```

### WAREHOUSE Role
```
Login → Warehouse Dashboard
├── Customers Tab
│   └── View only (👁️)
├── Products Tab
│   └── View only (👁️)
└── Challans Tab
    ├── View all challans
    └── ✔️ Confirm challan (triggers stock deduction)
```

### ACCOUNTS Role
```
Login → Finance Dashboard
├── Customers Tab
│   └── View only (👁️)
├── Products Tab
│   └── View only (👁️)
└── Challans Tab
    └── View only (👁️) - for billing/invoicing
```

---

## 🎨 UI Components

### Login Page
- Email and password inputs
- Remember me option
- Quick login buttons (test credentials)
- Professional design
- Error display

### Navigation Bar
- Company logo/title
- Current user info (Name, Role, Email)
- Logout button
- Success message display

### Dashboard Tabs
- Customers management
- Products inventory
- Challans/Sales orders

### Data Tables
- Sortable columns
- Pagination
- Status badges
- Action buttons
- Row highlighting

### Modal Forms
- Create/Edit customer
- Create/Edit product
- Create challan
- Validation feedback

### Status Badges
- **Active** - Green ✅
- **Lead** - Yellow ⚠️
- **Inactive** - Red ❌
- **OK Stock** - Green ✅
- **LOW STOCK** - Yellow ⚠️
- **Draft Challan** - Blue
- **Confirmed Challan** - Green

---

## 🎨 Styling

### Professional Design System

Located in `src/styles.css`

#### Color Palette
```css
--primary: #2563eb       /* Blue - Primary actions */
--success: #10b981       /* Green - Success states */
--warning: #f59e0b       /* Amber - Warnings */
--danger: #ef4444        /* Red - Errors */
--info: #0ea5e9          /* Cyan - Info */
```

#### Features
- CSS variables for theming
- Responsive grid system
- Professional typography
- Smooth animations
- Hover effects
- Mobile-first design

### Responsive Breakpoints

```css
Desktop:   1024px+
Tablet:    768px - 1023px
Mobile:    < 768px
```

---

## 🔌 API Integration

### API Client (`src/api.ts`)

Uses Axios for HTTP requests with:
- Automatic JWT token injection
- Base URL configuration
- Error handling
- Response interceptors

### Example API Call

```typescript
// Login
const response = await api.login(email, password);

// Get customers
const customers = await api.getCustomers(page, limit);

// Create customer
const newCustomer = await api.client.post('/customers', data);
```

### Authentication

JWT tokens are:
- Stored in `localStorage`
- Automatically sent in request headers
- Validated on protected routes
- Auto-cleared on 401 response

---

## 🧪 Test Credentials

Use these to test different roles:

```
ADMIN:
  Email: admin@erp.local
  Password: admin123
  
SALES:
  Email: sales@erp.local
  Password: sales123
  
WAREHOUSE:
  Email: warehouse@erp.local
  Password: warehouse123
  
ACCOUNTS:
  Email: accounts@erp.local
  Password: accounts123
```

---

## 🐛 Troubleshooting

### Port 3000 Already in Use

```bash
# Change port in vite.config.ts
server: {
  port: 3001
}

# Or kill the process
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### API Connection Error

```bash
# Check VITE_API_URL in .env
VITE_API_URL=http://localhost:4000

# Make sure backend is running
# Backend should be at: http://localhost:4000

# Check CORS settings on backend
```

### Build Fails

```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json dist
npm install
npm run build
```

### TypeScript Errors

```bash
# Check tsconfig.json
# Update TypeScript
npm install --save-dev typescript@latest

# Rebuild
npm run build
```

### Component Not Rendering

```bash
# Check browser console for errors
# Verify component imports
# Check routing configuration
# Verify API connection
```

---

## 🌐 Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 📊 Performance Optimizations

- ✅ Code splitting via Vite
- ✅ Asset optimization
- ✅ Lazy loading routes
- ✅ CSS minification
- ✅ JavaScript compression
- ✅ Image optimization

### Build Output

```
dist/
├── index.html          # ~5 KB
├── assets/
│   ├── index-*.js     # ~150 KB (minified)
│   └── index-*.css    # ~50 KB (minified)
└── favicon.ico        # ~1 KB
```

---

## 🔐 Security Features

- ✅ JWT token-based authentication
- ✅ Secure token storage
- ✅ HTTPS in production
- ✅ Protected routes
- ✅ Input validation
- ✅ XSS protection (React default)
- ✅ CORS validation

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

This project is part of a case study assignment. Unauthorized commercial use is prohibited.

---

## 📞 Support

For issues or questions:
1. Check this README
2. Review browser console for errors
3. Check backend API logs
4. Open a GitHub issue
5. Contact the development team

---

## 🎯 Next Steps

- ✅ [Frontend README](#) - You are here
- → [Backend README](../erp-crm-backend/README.md)
- → [API Documentation](../erp-crm-backend/POSTMAN_COLLECTION.json)
- → [Deployment Guide](../DEPLOYMENT_SETUP.md)
- → [Architecture Documentation](../ARCHITECTURE.md)

---

## 🚀 Quick Reference

### Start Development
```bash
npm install
npm run dev
```

### Build for Production
```bash
npm run build
npm run preview
```

### Deploy to Vercel
- Push to GitHub
- Connect to Vercel
- Set environment variables
- Deploy

### Test Credentials
```
admin@erp.local / admin123
sales@erp.local / sales123
warehouse@erp.local / warehouse123
accounts@erp.local / accounts123
```

---

**Made with ❤️ for professional ERP + CRM systems**

Last Updated: August 2026
