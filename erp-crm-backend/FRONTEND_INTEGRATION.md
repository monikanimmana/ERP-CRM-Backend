# Frontend Integration Guide

## Overview

This guide helps you integrate the React frontend with this Node.js/TypeScript backend.

## Backend Setup

### 1. Start the Backend

```bash
cd erp-crm-backend

# Install dependencies (if not already done)
npm install

# Create database
createdb erp_crm_db

# Run migrations
npm run db:migrate

# Seed test data
npm run db:seed

# Start development server
npm run dev
```

**Backend URL:** `http://localhost:4000`

---

## Frontend Setup

### 1. Environment Variables

Create `.env.local` or `.env.development` in your React frontend project:

```env
REACT_APP_API_URL=http://localhost:4000
REACT_APP_JWT_STORAGE_KEY=jwt_token
```

Or if using Vite:

```env
VITE_API_URL=http://localhost:4000
VITE_JWT_STORAGE_KEY=jwt_token
```

### 2. API Client Setup

Create `src/api/client.ts`:

```typescript
import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
const JWT_KEY = 'jwt_token';

const client: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests
client.interceptors.request.use((config) => {
  const token = localStorage.getItem(JWT_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses
client.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 — redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem(JWT_KEY);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
```

### 3. Authentication Service

Create `src/api/auth.ts`:

```typescript
import client from './client';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export const authAPI = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const { data } = await client.post('/auth/login', credentials);
    localStorage.setItem('jwt_token', data.token);
    return data;
  },

  logout: () => {
    localStorage.removeItem('jwt_token');
  },

  getToken: () => localStorage.getItem('jwt_token'),
};
```

### 4. Customer Service

Create `src/api/customers.ts`:

```typescript
import client from './client';

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  businessName: string;
  gstNumber?: string;
  customerType: 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
  address: string;
  status: 'LEAD' | 'ACTIVE' | 'INACTIVE';
  followUpDate?: string;
  createdAt: string;
}

export interface CustomerListResponse {
  data: Customer[];
  page: number;
  limit: number;
  total: number;
}

export const customerAPI = {
  list: async (page = 1, limit = 20, filters?: Record<string, any>) => {
    const { data } = await client.get('/customers', {
      params: { page, limit, ...filters },
    });
    return data as CustomerListResponse;
  },

  get: async (id: string) => {
    const { data } = await client.get(`/customers/${id}`);
    return data.data as Customer;
  },

  create: async (customer: Partial<Customer>) => {
    const { data } = await client.post('/customers', customer);
    return data.data as Customer;
  },

  update: async (id: string, customer: Partial<Customer>) => {
    const { data } = await client.put(`/customers/${id}`, customer);
    return data.data as Customer;
  },

  addNote: async (id: string, note: string) => {
    const { data } = await client.post(`/customers/${id}/notes`, { note });
    return data.data;
  },
};
```

### 5. Product Service

Create `src/api/products.ts`:

```typescript
import client from './client';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  warehouseLocation: string;
  createdAt: string;
}

export const productAPI = {
  list: async (page = 1, limit = 20, filters?: Record<string, any>) => {
    const { data } = await client.get('/products', {
      params: { page, limit, ...filters },
    });
    return data;
  },

  get: async (id: string) => {
    const { data } = await client.get(`/products/${id}`);
    return data.data as Product;
  },

  create: async (product: Partial<Product>) => {
    const { data } = await client.post('/products', product);
    return data.data as Product;
  },

  update: async (id: string, product: Partial<Product>) => {
    const { data } = await client.put(`/products/${id}`, product);
    return data.data as Product;
  },

  getStockLog: async (id: string, page = 1, limit = 20) => {
    const { data } = await client.get(`/products/${id}/stock-log`, {
      params: { page, limit },
    });
    return data;
  },

  adjustStock: async (id: string, adjustment: {
    quantity: number;
    movementType: 'IN' | 'OUT';
    reason: string;
  }) => {
    const { data } = await client.post(`/products/${id}/stock-adjust`, adjustment);
    return data.data;
  },
};
```

### 6. Challan Service

Create `src/api/challans.ts`:

```typescript
import client from './client';

export interface ChallanItem {
  id: string;
  productId: string;
  productNameSnapshot: string;
  productSkuSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
}

export interface Challan {
  id: string;
  challanNumber: string;
  customerId: string;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  totalQuantity: number;
  items: ChallanItem[];
  createdAt: string;
}

export const challanAPI = {
  list: async (page = 1, limit = 20, filters?: Record<string, any>) => {
    const { data } = await client.get('/challans', {
      params: { page, limit, ...filters },
    });
    return data;
  },

  get: async (id: string) => {
    const { data } = await client.get(`/challans/${id}`);
    return data.data as Challan;
  },

  create: async (challan: {
    customerId: string;
    items: { productId: string; quantity: number }[];
    status: 'DRAFT' | 'CONFIRMED';
  }) => {
    const { data } = await client.post('/challans', challan);
    return data.data as Challan;
  },

  confirm: async (id: string) => {
    const { data } = await client.put(`/challans/${id}/confirm`, {});
    return data.data as Challan;
  },

  cancel: async (id: string) => {
    const { data } = await client.put(`/challans/${id}/cancel`, {});
    return data.data as Challan;
  },
};
```

### 7. Error Handling

Create `src/api/errors.ts`:

```typescript
import { AxiosError } from 'axios';

export interface APIError {
  error: string;
  message: string;
  details?: {
    fields?: Record<string, string>;
    details?: any[];
  };
  status: number;
}

export function parseAPIError(err: unknown): APIError {
  const axiosError = err as AxiosError;

  if (axiosError.response) {
    const data = axiosError.response.data as any;
    return {
      error: data.error || 'unknown_error',
      message: data.message || 'An error occurred',
      details: data.details,
      status: axiosError.response.status,
    };
  }

  return {
    error: 'network_error',
    message: 'Network error occurred',
    status: 0,
  };
}

// For form validation errors
export function getFieldErrors(apiError: APIError): Record<string, string> {
  return apiError.details?.fields || {};
}

// For insufficient stock errors
export function getStockErrors(apiError: APIError): Array<{
  productId: string;
  productName: string;
  requested: number;
  available: number;
}> {
  return apiError.details?.details || [];
}
```

### 8. React Hook Examples

Create `src/hooks/useAuth.ts`:

```typescript
import { useState, useCallback } from 'react';
import { authAPI } from '../api/auth';
import { parseAPIError } from '../api/errors';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.login({ email, password });
      return response;
    } catch (err) {
      const apiError = parseAPIError(err);
      setError(apiError.message);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authAPI.logout();
  }, []);

  return { login, logout, loading, error };
}
```

Create `src/hooks/useCustomers.ts`:

```typescript
import { useState, useCallback } from 'react';
import { customerAPI, Customer } from '../api/customers';
import { parseAPIError } from '../api/errors';

export function useCustomers() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = useCallback(async (page = 1, limit = 20, filters?: Record<string, any>) => {
    setLoading(true);
    setError(null);
    try {
      return await customerAPI.list(page, limit, filters);
    } catch (err) {
      const apiError = parseAPIError(err);
      setError(apiError.message);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (customer: Partial<Customer>) => {
    setLoading(true);
    setError(null);
    try {
      return await customerAPI.create(customer);
    } catch (err) {
      const apiError = parseAPIError(err);
      setError(apiError.message);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  return { list, create, loading, error };
}
```

### 9. Install Dependencies

In your React frontend, install axios:

```bash
npm install axios
```

Or if using React Query (recommended):

```bash
npm install @tanstack/react-query axios
```

---

## Common Flows

### Login Flow

```typescript
const { login } = useAuth();

const handleLogin = async (email: string, password: string) => {
  try {
    const user = await login(email, password);
    // Token is automatically stored in localStorage
    // Redirect to dashboard
    navigate('/dashboard');
  } catch (error) {
    // Show error toast
  }
};
```

### Create Challan Flow

```typescript
try {
  const challan = await challanAPI.create({
    customerId: selectedCustomer.id,
    items: [
      { productId: 'prod-123', quantity: 5 },
      { productId: 'prod-456', quantity: 10 },
    ],
    status: 'CONFIRMED', // Or 'DRAFT'
  });
  
  // Success
  showSuccessToast(`Challan ${challan.challanNumber} created`);
} catch (error) {
  const apiError = parseAPIError(error);
  
  if (apiError.error === 'insufficient_stock') {
    // Show per-item stock shortage
    const shortages = getStockErrors(apiError);
    shortages.forEach(item => {
      showError(`${item.productName}: Need ${item.requested}, have ${item.available}`);
    });
  } else {
    showErrorToast(apiError.message);
  }
}
```

### Validation Error Handling

```typescript
try {
  await customerAPI.create(formData);
} catch (error) {
  const apiError = parseAPIError(error);
  
  if (apiError.error === 'validation_error') {
    const fieldErrors = getFieldErrors(apiError);
    // Set form errors
    Object.entries(fieldErrors).forEach(([field, message]) => {
      setFieldError(field, message);
    });
  }
}
```

---

## CORS Configuration

If you see CORS errors, the backend CORS is already configured to allow:
- `http://localhost:3000` (React dev)
- `http://localhost:5173` (Vite dev)
- `http://127.0.0.1:3000`
- `http://127.0.0.1:5173`

For production, set `FRONTEND_URL` in backend `.env`.

---

## Testing with Postman

Use the included `api.http` file or import endpoints into Postman.

Test credentials:
- Email: `sales@erp.local`
- Password: `sales123`

---

## Troubleshooting

### CORS Error

**Problem:** "Access to XMLHttpRequest blocked by CORS"

**Solution:** 
1. Ensure backend is running on http://localhost:4000
2. Check that frontend is on http://localhost:3000 or :5173
3. Verify `api.ts` has correct baseURL

### 401 Unauthorized

**Problem:** "Invalid or expired token"

**Solution:**
1. Login again to get new token
2. Check token is in localStorage
3. Verify JWT_SECRET matches between frontend storage and backend

### 404 Not Found

**Problem:** Endpoint returns 404

**Solution:**
1. Verify endpoint path is correct
2. Check API_URL baseURL
3. Ensure backend is running (http://localhost:4000/health)

### Network Error

**Problem:** "Failed to fetch" or connection refused

**Solution:**
1. Start backend: `npm run dev`
2. Verify backend is on port 4000
3. Check firewall isn't blocking localhost

---

## Next Steps

1. Create login page
2. Create customer list with table + pagination
3. Create customer form (create/edit)
4. Create product list + inventory management
5. Create challan form with stock validation
6. Build dashboard with charts
7. Add role-based UI (show/hide based on user role)

All API responses are type-safe when using TypeScript!
