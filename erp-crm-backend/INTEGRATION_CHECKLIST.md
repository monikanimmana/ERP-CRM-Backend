# Frontend-Backend Integration Checklist

## Phase 1: Setup ✅

- [ ] Backend running on `http://localhost:4000`
  ```bash
  npm run dev
  ```
  
- [ ] Database created and seeded
  ```bash
  npm run db:migrate
  npm run db:seed
  ```

- [ ] Frontend created/cloned (React or Next.js)
  ```bash
  npx create-react-app frontend
  # or
  npm create vite@latest frontend -- --template react-ts
  ```

- [ ] Frontend environment configured (`.env.local`)
  ```env
  REACT_APP_API_URL=http://localhost:4000
  ```

## Phase 2: API Integration ✅

### Authentication

- [ ] Create API client with axios
  - [ ] Set baseURL to backend
  - [ ] Add JWT interceptor
  - [ ] Handle 401 redirects

- [ ] Implement login endpoint
  - [ ] POST `/auth/login` with email/password
  - [ ] Store JWT in localStorage
  - [ ] Store user info in state/context

- [ ] Create ProtectedRoute component
  - [ ] Check JWT exists
  - [ ] Redirect to login if missing

### API Services

- [ ] Create `api/auth.ts`
- [ ] Create `api/customers.ts`
- [ ] Create `api/products.ts`
- [ ] Create `api/challans.ts`
- [ ] Create `api/errors.ts` (error parsing)

### React Hooks

- [ ] Create `hooks/useAuth.ts`
- [ ] Create `hooks/useCustomers.ts`
- [ ] Create `hooks/useProducts.ts`
- [ ] Create `hooks/useChallans.ts`

## Phase 3: Pages & Components ✅

### Authentication Pages

- [ ] `/login` — Login form
  - [ ] Email input
  - [ ] Password input
  - [ ] Error display
  - [ ] Submit button
  - [ ] Redirect to dashboard on success

- [ ] `/dashboard` — Protected page
  - [ ] User profile display
  - [ ] Navigation to modules
  - [ ] Logout button

### Customer Module

- [ ] `/customers` — Customer list
  - [ ] Table with pagination
  - [ ] Search by name/mobile/business
  - [ ] Filter by status/type
  - [ ] "Create" button
  - [ ] Edit/delete actions

- [ ] `/customers/create` — Create form
  - [ ] Name input
  - [ ] Mobile input
  - [ ] Email input
  - [ ] Business name input
  - [ ] GST number input
  - [ ] Address input
  - [ ] Customer type select
  - [ ] Status select
  - [ ] Submit button
  - [ ] Error display

- [ ] `/customers/:id` — Customer detail
  - [ ] Display all fields
  - [ ] Show notes section
  - [ ] Add note form
  - [ ] Notes list
  - [ ] Edit button

### Product Module

- [ ] `/products` — Product list
  - [ ] Table with pagination
  - [ ] Search by name/SKU
  - [ ] Filter by category
  - [ ] Low-stock indicator (red if < minStockAlert)
  - [ ] "Create" button
  - [ ] Edit/delete actions

- [ ] `/products/create` — Create form
  - [ ] Name input
  - [ ] SKU input (unique)
  - [ ] Category input
  - [ ] Unit price input
  - [ ] Current stock input
  - [ ] Min stock alert input
  - [ ] Warehouse location input
  - [ ] Submit button

- [ ] `/products/:id` — Product detail
  - [ ] Display all fields
  - [ ] Stock log table (paginated)
  - [ ] Stock adjust form (IN/OUT)
  - [ ] Edit button

### Challan Module

- [ ] `/challans` — Challan list
  - [ ] Table with pagination
  - [ ] Filter by status (DRAFT, CONFIRMED, CANCELLED)
  - [ ] Filter by customer
  - [ ] Date range filter
  - [ ] "Create" button
  - [ ] View/confirm/cancel actions

- [ ] `/challans/create` — Create form
  - [ ] Customer select (searchable)
  - [ ] Product table (add line items)
    - [ ] Product select
    - [ ] Quantity input
    - [ ] Auto-fill: product name, SKU, unit price
    - [ ] Delete row button
  - [ ] Add item button
  - [ ] Status radio (DRAFT / CONFIRMED)
  - [ ] Total quantity display
  - [ ] Submit button
  - [ ] Error handling (insufficient stock)

- [ ] `/challans/:id` — Challan detail
  - [ ] Display challan header (number, status, customer)
  - [ ] Items table (name, SKU, price, quantity)
  - [ ] Confirm button (if DRAFT)
  - [ ] Cancel button (if not CANCELLED)
  - [ ] Stock shortage errors (if confirm fails)

## Phase 4: Features ✅

### Pagination

- [ ] Implement page/limit query params
- [ ] Display total count
- [ ] Calculate total pages
- [ ] Previous/next buttons
- [ ] Jump to page input

### Search & Filter

- [ ] Customer search (name/mobile/business)
- [ ] Customer filter (status/type)
- [ ] Product search (name/SKU)
- [ ] Product filter (category)
- [ ] Challan filter (status/customer/date)

### Error Handling

- [ ] Display validation errors per field
- [ ] Show stock shortage details
- [ ] Toast notifications (success/error)
- [ ] Network error handling
- [ ] Auto-logout on 401

### Loading States

- [ ] Show skeleton/spinner while fetching
- [ ] Disable buttons while submitting
- [ ] Show loading indicator in tables

### Permissions

- [ ] Hide create/edit buttons based on role
- [ ] Restrict navigation based on role
- [ ] Show role-based UI elements

## Phase 5: Testing ✅

### Manual Testing

- [ ] Login with test credentials
  - Email: `sales@erp.local`
  - Password: `sales123`

- [ ] Test customer CRUD
  - [ ] Create customer
  - [ ] View customer list
  - [ ] Edit customer
  - [ ] Delete customer (if implemented)

- [ ] Test product CRUD
  - [ ] Create product
  - [ ] View product list
  - [ ] Edit product
  - [ ] Adjust stock (IN/OUT)

- [ ] Test challan workflow
  - [ ] Create DRAFT challan
  - [ ] Create CONFIRMED challan
  - [ ] Confirm DRAFT challan
  - [ ] Cancel challan
  - [ ] Test stock deduction
  - [ ] Test insufficient stock error

- [ ] Test pagination
  - [ ] Navigate pages
  - [ ] Change limit
  - [ ] Search/filter

- [ ] Test error scenarios
  - [ ] Invalid login
  - [ ] Validation errors
  - [ ] Insufficient stock
  - [ ] Network error

### Browser Testing

- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### Responsive Design

- [ ] Desktop (1920px)
- [ ] Tablet (768px)
- [ ] Mobile (375px)

## Phase 6: Deployment ✅

### Backend Deployment

- [ ] Build: `npm run build`
- [ ] Set production `.env`
  - [ ] Update DATABASE_URL (production DB)
  - [ ] Set JWT_SECRET (strong, random)
  - [ ] Set NODE_ENV=production
  - [ ] Set FRONTEND_URL (production frontend)
  - [ ] Update PORT if needed

- [ ] Deploy to:
  - [ ] Heroku
  - [ ] AWS (EC2, Lambda)
  - [ ] GCP (Cloud Run)
  - [ ] DigitalOcean
  - [ ] Vercel (backend)
  - [ ] Railway

### Frontend Deployment

- [ ] Build: `npm run build`
- [ ] Update API_URL to production backend
- [ ] Deploy to:
  - [ ] Vercel (recommended for React)
  - [ ] Netlify
  - [ ] GitHub Pages
  - [ ] AWS S3 + CloudFront
  - [ ] GCP Cloud Storage

### Post-Deployment

- [ ] Test all endpoints on production
- [ ] Monitor logs and errors
- [ ] Set up SSL certificates (HTTPS)
- [ ] Configure domain names
- [ ] Set up email (for notifications)
- [ ] Set up monitoring/alerts

## Quick Commands Reference

```bash
# Backend
npm run dev              # Start dev server
npm run build           # Build for production
npm run db:migrate      # Apply migrations
npm run db:seed         # Seed test data
npm start               # Run production build

# Frontend
npm start               # React dev server
npm run dev             # Vite dev server
npm run build           # Production build
npm run preview         # Preview production build
```

## Common Ports

- Backend: `http://localhost:4000`
- React Dev: `http://localhost:3000`
- Vite Dev: `http://localhost:5173`
- PostgreSQL: `localhost:5432`

## Debugging Tips

1. **Check CORS errors:**
   - Verify frontend URL is in backend CORS allowlist
   - Check browser console for exact error
   - Use `https://` if in production

2. **Check Auth issues:**
   - Verify JWT in localStorage: `localStorage.getItem('jwt_token')`
   - Check JWT has correct claims: `console.log(jwtDecode(token))`
   - Ensure JWT secret matches

3. **Check Database:**
   - Verify DB connection: `npm run db:migrate`
   - Check tables exist: `psql -d erp_crm_db`
   - Check seed ran: `SELECT COUNT(*) FROM users;`

4. **Network Issues:**
   - Backend health: `curl http://localhost:4000/health`
   - Check backend logs
   - Use DevTools Network tab to inspect requests

## Support

- Backend docs: See `README.md` in backend repo
- API examples: See `api.http` in backend repo
- Integration guide: See `FRONTEND_INTEGRATION.md` in backend repo

---

**Status:** Use this checklist to track progress. Check off items as you complete them.

Last Updated: 2026-08-10
