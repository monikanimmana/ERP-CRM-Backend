# How to Connect Your React Frontend to This Backend

## Quick Start (10 minutes)

### Step 1: Start the Backend

```bash
cd erp-crm-backend
npm run dev
```

✅ Backend running at `http://localhost:4000`

### Step 2: Configure Frontend

In your React project, create `.env.local`:

```env
REACT_APP_API_URL=http://localhost:4000
```

Or if using **Vite**:

```env
VITE_API_URL=http://localhost:4000
```

### Step 3: Create API Client

Install axios in frontend:

```bash
npm install axios
```

Create `src/api/client.ts`:

```typescript
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const client = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Add JWT to all requests
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — redirect to login
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('jwt_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
```

### Step 4: Login

Create `src/pages/LoginPage.tsx`:

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export function LoginPage() {
  const [email, setEmail] = useState('sales@erp.local');
  const [password, setPassword] = useState('sales123');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:4000/auth/login', {
        email,
        password,
      });
      
      localStorage.setItem('jwt_token', response.data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input 
        type="email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
        placeholder="Email"
      />
      <input 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
        placeholder="Password"
      />
      <button type="submit">Login</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}
```

**Test Credentials:**
```
Email:    sales@erp.local
Password: sales123
```

### Step 5: Create API Services

For **customers**, create `src/api/customers.ts`:

```typescript
import client from './client';

export const customerAPI = {
  list: (page = 1, limit = 20, filters?: any) =>
    client.get('/customers', { params: { page, limit, ...filters } }),
  
  get: (id: string) =>
    client.get(`/customers/${id}`),
  
  create: (customer: any) =>
    client.post('/customers', customer),
  
  update: (id: string, customer: any) =>
    client.put(`/customers/${id}`, customer),
};
```

For **products**:

```typescript
import client from './client';

export const productAPI = {
  list: (page = 1, limit = 20, filters?: any) =>
    client.get('/products', { params: { page, limit, ...filters } }),
  
  get: (id: string) =>
    client.get(`/products/${id}`),
  
  create: (product: any) =>
    client.post('/products', product),
  
  adjustStock: (id: string, adjustment: any) =>
    client.post(`/products/${id}/stock-adjust`, adjustment),
};
```

For **challans**:

```typescript
import client from './client';

export const challanAPI = {
  list: (page = 1, limit = 20, filters?: any) =>
    client.get('/challans', { params: { page, limit, ...filters } }),
  
  get: (id: string) =>
    client.get(`/challans/${id}`),
  
  create: (challan: any) =>
    client.post('/challans', challan),
  
  confirm: (id: string) =>
    client.put(`/challans/${id}/confirm`, {}),
  
  cancel: (id: string) =>
    client.put(`/challans/${id}/cancel`, {}),
};
```

### Step 6: Fetch Data

Create `src/pages/CustomersPage.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { customerAPI } from '../api/customers';

export function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const response = await customerAPI.list(page, 20);
        setCustomers(response.data.data);
      } catch (error) {
        console.error('Failed to load customers', error);
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, [page]);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h1>Customers</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Mobile</th>
            <th>Type</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c: any) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.mobile}</td>
              <td>{c.customerType}</td>
              <td>{c.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## Response Format Reference

All endpoints return:

### Success (Single Item)
```json
{
  "data": { /* resource */ }
}
```

### Success (List)
```json
{
  "data": [ /* items */ ],
  "page": 1,
  "limit": 20,
  "total": 543
}
```

### Error
```json
{
  "error": "error_code",
  "message": "Human-readable message",
  "details": { /* optional */ }
}
```

## All Endpoints

### Auth (No JWT needed)
```
POST   /auth/login          → { token, user }
POST   /auth/register       → { user }
```

### Customers
```
POST   /customers           → Create
GET    /customers           → List (paginated)
GET    /customers/:id       → Get one
PUT    /customers/:id       → Update
POST   /customers/:id/notes → Add note
```

### Products
```
POST   /products            → Create
GET    /products            → List (paginated)
GET    /products/:id        → Get one
PUT    /products/:id        → Update
GET    /products/:id/stock-log        → History
POST   /products/:id/stock-adjust     → Adjust stock
```

### Challans
```
POST   /challans            → Create (DRAFT or CONFIRMED)
GET    /challans            → List (paginated)
GET    /challans/:id        → Get one
PUT    /challans/:id/confirm         → Confirm & deduct stock
PUT    /challans/:id/cancel          → Cancel & restore stock
```

## Error Handling

### Validation Error

```json
{
  "error": "validation_error",
  "message": "Validation failed",
  "details": {
    "fields": {
      "email": "Invalid email address",
      "password": "Password must be at least 6 characters"
    }
  }
}
```

Map to form fields:

```typescript
try {
  await customerAPI.create(formData);
} catch (error: any) {
  if (error.response?.data?.details?.fields) {
    const fieldErrors = error.response.data.details.fields;
    Object.entries(fieldErrors).forEach(([field, message]: [string, any]) => {
      setFieldError(field, message);
    });
  }
}
```

### Insufficient Stock Error

```json
{
  "error": "insufficient_stock",
  "message": "One or more products have insufficient stock",
  "details": {
    "details": [
      {
        "productId": "prod-123",
        "productName": "Motor Oil",
        "requested": 20,
        "available": 5
      }
    ]
  }
}
```

Show per-item errors:

```typescript
try {
  await challanAPI.confirm(challanId);
} catch (error: any) {
  const shortages = error.response?.data?.details?.details || [];
  shortages.forEach((item: any) => {
    alert(`${item.productName}: Need ${item.requested}, have ${item.available}`);
  });
}
```

## Test Credentials

4 test users already created:

| Role      | Email                    | Password      |
|-----------|--------------------------|---------------|
| ADMIN     | admin@erp.local          | admin123      |
| SALES     | sales@erp.local          | sales123      |
| WAREHOUSE | warehouse@erp.local      | warehouse123  |
| ACCOUNTS  | accounts@erp.local       | accounts123   |

## Debugging

### Check Backend Health
```bash
curl http://localhost:4000/health
```

### Check JWT
```typescript
console.log(localStorage.getItem('jwt_token'));
```

### Check Network Requests
Open DevTools → Network tab → look for API requests

### Decode JWT
```typescript
function decodeJWT(token: string) {
  const parts = token.split('.');
  const decoded = JSON.parse(atob(parts[1]));
  console.log(decoded);
}
```

## CORS Allowed Origins

Backend accepts requests from:
- `http://localhost:3000` (React)
- `http://localhost:5173` (Vite)
- `http://127.0.0.1:3000`
- `http://127.0.0.1:5173`
- Environment variable `FRONTEND_URL` (production)

## Full Integration Guide

See detailed guide: **[FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md)**

See checklist: **[INTEGRATION_CHECKLIST.md](INTEGRATION_CHECKLIST.md)**

---

## Summary

1. ✅ Backend running: `npm run dev` on port 4000
2. ✅ Frontend env: `REACT_APP_API_URL=http://localhost:4000`
3. ✅ API client: Use axios with JWT interceptor
4. ✅ Login: POST to `/auth/login`, store token in localStorage
5. ✅ Requests: Token auto-attached to all API calls
6. ✅ Error handling: Map validation errors to form fields
7. ✅ Test: Use provided test credentials

**Done!** Your frontend is now connected to the backend. 🚀
