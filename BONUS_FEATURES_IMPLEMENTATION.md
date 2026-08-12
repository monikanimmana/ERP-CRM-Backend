# 🎁 BONUS FEATURES - IMPLEMENTATION GUIDE

Choose 1-4 bonus features to implement. Here's how to do each one.

---

## 🐳 BONUS 1: DOCKER SETUP (⏱️ 30 minutes)

### What is Docker?
Docker lets anyone run your entire app with one command, regardless of their OS.

### Step 1: Create Backend Dockerfile

**File:** `erp-crm-backend/Dockerfile`

```dockerfile
# Use Node.js 20 slim image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 4000

# Start app
CMD ["npm", "start"]
```

### Step 2: Create Backend .dockerignore

**File:** `erp-crm-backend/.dockerignore`

```
node_modules
npm-debug.log
.env
.env.local
.git
.gitignore
dist
dev.db
```

### Step 3: Create Frontend Dockerfile

**File:** `frontend/Dockerfile`

```dockerfile
# Build stage
FROM node:20-slim as builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Install serve to run React app
RUN npm install -g serve

# Copy built app from builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
```

### Step 4: Create Frontend .dockerignore

**File:** `frontend/.dockerignore`

```
node_modules
npm-debug.log
.env
.git
.gitignore
src
public
vite.config.ts
```

### Step 5: Create docker-compose.yml

**File:** `docker-compose.yml` (in root directory)

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: erp-crm-db
    environment:
      POSTGRES_USER: erp_user
      POSTGRES_PASSWORD: erp_password
      POSTGRES_DB: erp_crm_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U erp_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend Service
  backend:
    build: ./erp-crm-backend
    container_name: erp-crm-backend
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://erp_user:erp_password@postgres:5432/erp_crm_db
      JWT_SECRET: "dev-secret-key-min-32-characters-required"
      JWT_EXPIRES_IN: 7d
      NODE_ENV: development
      FRONTEND_URL: http://localhost:3000
      PORT: 4000
    ports:
      - "4000:4000"
    volumes:
      - ./erp-crm-backend:/app
      - /app/node_modules

  # Frontend Service
  frontend:
    build: ./frontend
    container_name: erp-crm-frontend
    depends_on:
      - backend
    environment:
      VITE_API_URL: http://localhost:4000
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  postgres_data:
```

### Step 6: Run Docker Locally

```bash
# Navigate to root directory
cd erp-crm-backend/..

# Build and start all services
docker-compose up --build

# First run: migrate database
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma db seed

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Step 7: Verify Docker Works

```bash
# Check services running
docker-compose ps

# Check backend logs
docker-compose logs backend

# Check frontend logs
docker-compose logs frontend

# Access app
# Frontend: http://localhost:3000
# Backend API: http://localhost:4000
```

### Step 8: Add Docker Instructions to README

```markdown
## Running with Docker

### Prerequisites
- Docker (https://www.docker.com/products/docker-desktop)
- Docker Compose

### Start Everything

\`\`\`bash
docker-compose up --build
\`\`\`

### First Time Setup
\`\`\`bash
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma db seed
\`\`\`

### Access
- Frontend: http://localhost:3000
- Backend: http://localhost:4000

### Stop Services
\`\`\`bash
docker-compose down
\`\`\`
```

---

## 📄 BONUS 2: PDF EXPORT (⏱️ 60 minutes)

### Install Dependencies

```bash
cd erp-crm-backend
npm install pdfkit
npm install @types/pdfkit --save-dev
```

### Step 1: Create PDF Service

**File:** `src/services/pdf.ts`

```typescript
import PDFDocument from 'pdfkit';
import { Response } from 'express';
import prisma from '../config/prisma';

export async function generateInvoicePDF(
  challanId: string,
  res: Response
): Promise<void> {
  // Fetch challan with all details
  const challan = await prisma.challan.findUnique({
    where: { id: challanId },
    include: {
      customer: true,
      items: {
        include: { product: true }
      }
    }
  });

  if (!challan) {
    throw new Error('Challan not found');
  }

  // Create PDF document
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50
  });

  // Pipe to response
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="invoice-${challan.challanNumber}.pdf"`
  );
  doc.pipe(res);

  // Header
  doc
    .fontSize(24)
    .font('Helvetica-Bold')
    .text('SALES INVOICE', { align: 'center' });
  
  doc
    .fontSize(10)
    .font('Helvetica')
    .text('ERP + CRM Operations Portal', { align: 'center' });
  
  doc.moveTo(50, 100).lineTo(550, 100).stroke();
  doc.moveDown();

  // Invoice Details
  doc
    .fontSize(10)
    .text(`Invoice Number: ${challan.challanNumber}`, 50, 120)
    .text(`Date: ${new Date().toLocaleDateString()}`)
    .text(`Status: ${challan.status}`);

  doc.moveDown();

  // Customer Details
  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('BILL TO:', 50);
  
  doc
    .fontSize(10)
    .font('Helvetica')
    .text(`Customer: ${challan.customer.name}`)
    .text(`Email: ${challan.customer.email}`)
    .text(`Mobile: ${challan.customer.mobile}`)
    .text(`Business: ${challan.customer.businessName}`)
    .text(`GST: ${challan.customer.gstNumber || 'N/A'}`);

  doc.moveDown();

  // Items Table Header
  const tableTop = doc.y;
  const itemX = 50;
  const qtyX = 350;
  const priceX = 430;
  const totalX = 500;

  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('Item', itemX, tableTop)
    .text('Qty', qtyX, tableTop)
    .text('Price', priceX, tableTop)
    .text('Total', totalX, tableTop);

  doc.moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke();

  // Items
  let y = tableTop + 30;
  let grandTotal = 0;

  for (const item of challan.items) {
    const lineTotal = item.quantity * item.unitPriceSnapshot;
    grandTotal += lineTotal;

    doc
      .fontSize(9)
      .font('Helvetica')
      .text(item.productNameSnapshot, itemX, y, { width: 250 })
      .text(item.quantity.toString(), qtyX, y)
      .text(`₹${item.unitPriceSnapshot.toFixed(2)}`, priceX, y)
      .text(`₹${lineTotal.toFixed(2)}`, totalX, y);

    y += 25;
  }

  // Total
  doc.moveTo(50, y).lineTo(550, y).stroke();
  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .text(`Grand Total: ₹${grandTotal.toFixed(2)}`, 400, y + 10);

  doc.moveDown(3);

  // Footer
  doc
    .fontSize(8)
    .font('Helvetica')
    .text('Thank you for your business!', { align: 'center' })
    .text('Generated by ERP + CRM Portal', { align: 'center' });

  // End document
  doc.end();
}
```

### Step 2: Add Route

**File:** `src/routes/challan.ts`

Add this to your challan routes:

```typescript
import { generateInvoicePDF } from '../services/pdf';

// Add this route
router.get('/:id/export-pdf', authenticate, authorize(['ADMIN', 'SALES', 'WAREHOUSE']), async (req, res, next) => {
  try {
    await generateInvoicePDF(req.params.id, res);
  } catch (err) {
    next(err);
  }
});
```

### Step 3: Add Frontend Download Button

**File:** `frontend/src/Dashboard.tsx`

Add to challan table row:

```tsx
// In the challans table, add action column
<td>
  <button 
    className="btn-sm btn-sm-view"
    onClick={() => downloadPDF(ch.id)}
  >
    📄 PDF
  </button>
</td>

// Add this function to Dashboard component
const downloadPDF = async (challanId: string) => {
  try {
    const response = await fetch(
      `http://localhost:4000/challans/${challanId}/export-pdf`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        }
      }
    );
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `challan-${challanId}.pdf`;
    link.click();
  } catch (error) {
    alert('Error downloading PDF: ' + error);
  }
};
```

### Step 4: Test PDF Export

```bash
# Make sure backend is running
npm run dev

# Login as ADMIN or SALES
# Navigate to Challans tab
# Click on any challan row
# Click "📄 PDF" button
# PDF should download
```

---

## 🔄 BONUS 3: GITHUB ACTIONS CI/CD (⏱️ 45 minutes)

### Step 1: Backend Deployment Workflow

**File:** `.github/workflows/backend-deploy.yml`

```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'erp-crm-backend/**'
      - '.github/workflows/backend-deploy.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Railway
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: |
          npm install -g @railway/cli
          railway link ${{ secrets.RAILWAY_PROJECT_ID }}
          railway up --detach
```

### Step 2: Frontend Deployment Workflow

**File:** `.github/workflows/frontend-deploy.yml`

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'
      - '.github/workflows/frontend-deploy.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
        run: |
          npm install -g vercel
          vercel --prod --token $VERCEL_TOKEN
```

### Step 3: Backend Tests Workflow

**File:** `.github/workflows/backend-tests.yml`

```yaml
name: Backend Tests

on:
  push:
    branches: [main, develop]
    paths:
      - 'erp-crm-backend/**'
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd erp-crm-backend
          npm ci
      
      - name: Run linter
        run: |
          cd erp-crm-backend
          npm run lint || true
      
      - name: Type check
        run: |
          cd erp-crm-backend
          npm run build
```

### Step 4: Frontend Tests Workflow

**File:** `.github/workflows/frontend-tests.yml`

```yaml
name: Frontend Tests

on:
  push:
    branches: [main, develop]
    paths:
      - 'frontend/**'
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Build
        run: |
          cd frontend
          npm run build
      
      - name: Type check
        run: |
          cd frontend
          npm run build
```

### Step 5: Setup Secrets in GitHub

1. Go to GitHub repository settings
2. Secrets and variables → Actions
3. Add these secrets:
   - `RAILWAY_TOKEN` (from Railway)
   - `RAILWAY_PROJECT_ID` (from Railway)
   - `VERCEL_TOKEN` (from Vercel)
   - `VERCEL_PROJECT_ID` (from Vercel)
   - `VERCEL_ORG_ID` (from Vercel)

### Step 6: Test Workflow

```bash
# Push code to main branch
git add .
git commit -m "Add GitHub Actions CI/CD"
git push origin main

# Go to GitHub repo
# Click "Actions" tab
# Watch workflows run
# See automatic deployment!
```

---

## ☁️ BONUS 4: AWS S3 IMAGE UPLOAD (⏱️ 90 minutes)

### Step 1: Install AWS SDK

```bash
cd erp-crm-backend
npm install aws-sdk
npm install multer --save
npm install @types/multer --save-dev
```

### Step 2: Add AWS Configuration

**File:** `src/config/aws.ts`

```typescript
import AWS from 'aws-sdk';

export const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME || 'erp-crm-products';

export async function uploadToS3(
  file: Express.Multer.File,
  folder: string
): Promise<string> {
  const key = `${folder}/${Date.now()}-${file.originalname}`;
  
  const params = {
    Bucket: AWS_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read'
  };

  const result = await s3.upload(params).promise();
  return result.Location; // Full URL to image
}

export async function deleteFromS3(imageKey: string): Promise<void> {
  const params = {
    Bucket: AWS_BUCKET_NAME,
    Key: imageKey
  };

  await s3.deleteObject(params).promise();
}
```

### Step 3: Update Database Schema

**File:** `prisma/schema.prisma`

```prisma
model Product {
  // ... existing fields
  imageUrl: String?     // Full URL to image
  imageKey: String?     // S3 key for deletion
}
```

Run migration:
```bash
npx prisma migrate dev --name add_product_image
```

### Step 4: Create Upload Endpoint

**File:** `src/routes/product.ts`

```typescript
import multer from 'multer';
import { uploadToS3, deleteFromS3 } from '../config/aws';

// Setup multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Add this route
router.post(
  '/:id/upload-image',
  authenticate,
  authorize(['ADMIN']),
  upload.single('image'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image provided' });
      }

      const product = await prisma.product.findUnique({
        where: { id: req.params.id }
      });

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Delete old image if exists
      if (product.imageKey) {
        await deleteFromS3(product.imageKey);
      }

      // Upload new image
      const imageUrl = await uploadToS3(req.file, 'products');
      const imageKey = req.file.originalname; // Store key for deletion

      const updated = await prisma.product.update({
        where: { id: req.params.id },
        data: { imageUrl, imageKey }
      });

      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// Delete image endpoint
router.delete(
  '/:id/image',
  authenticate,
  authorize(['ADMIN']),
  async (req, res, next) => {
    try {
      const product = await prisma.product.findUnique({
        where: { id: req.params.id }
      });

      if (!product || !product.imageKey) {
        return res.status(404).json({ message: 'Image not found' });
      }

      await deleteFromS3(product.imageKey);

      const updated = await prisma.product.update({
        where: { id: req.params.id },
        data: { imageUrl: null, imageKey: null }
      });

      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
);
```

### Step 5: Setup AWS S3 Bucket

1. Go to AWS Console
2. Create S3 bucket: `erp-crm-products`
3. Make it public (allow public reads)
4. CORS policy:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

### Step 6: Add AWS Environment Variables

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=erp-crm-products
```

### Step 7: Frontend Upload UI

**File:** `frontend/src/Dashboard.tsx`

Add to product form:

```tsx
const [productImage, setProductImage] = useState<File | null>(null);

// In form:
<div className="form-group">
  <label>Product Image</label>
  <input
    type="file"
    accept="image/*"
    onChange={(e) => setProductImage(e.target.files?.[0] || null)}
  />
</div>

// Upload button:
const uploadProductImage = async (productId: string) => {
  if (!productImage) return;

  const formData = new FormData();
  formData.append('image', productImage);

  try {
    await api.client.post(
      `/products/${productId}/upload-image`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    alert('Image uploaded successfully!');
    loadData();
  } catch (error) {
    alert('Error uploading image');
  }
};

// Display image in table:
{product.imageUrl && (
  <img 
    src={product.imageUrl} 
    alt={product.name}
    style={{ height: '50px', borderRadius: '4px' }}
  />
)}
```

### Step 8: Test S3 Upload

```bash
# Make sure backend is running
npm run dev

# Login as ADMIN
# Go to Products tab
# Edit/create a product
# Upload an image
# Image should appear in table
# Check S3 bucket in AWS console
```

---

## 📊 COMPLETION CHECKLIST

### Docker ✅
- [ ] Backend Dockerfile created
- [ ] Frontend Dockerfile created
- [ ] docker-compose.yml created
- [ ] Test: `docker-compose up --build`
- [ ] Containers run without errors
- [ ] Database migrations run
- [ ] Can login to app

### PDF Export ✅
- [ ] Install pdfkit
- [ ] Create pdf.ts service
- [ ] Add route for PDF export
- [ ] Frontend download button works
- [ ] PDF downloads with correct data
- [ ] PDF looks professional

### GitHub Actions ✅
- [ ] Create workflow files
- [ ] Add secrets to GitHub
- [ ] Push code to main
- [ ] Workflows trigger automatically
- [ ] Backend deploys to Railway
- [ ] Frontend deploys to Vercel
- [ ] Tests pass

### AWS S3 ✅
- [ ] Create S3 bucket
- [ ] Get AWS credentials
- [ ] Add aws.ts config
- [ ] Update Product model
- [ ] Create upload endpoint
- [ ] Frontend upload UI works
- [ ] Images display in table
- [ ] Delete images works

---

**Pick 1-2 bonus features and implement them!** 🚀
