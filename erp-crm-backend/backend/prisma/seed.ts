import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data (careful in production!)
  await prisma.challanItem.deleteMany();
  await prisma.challan.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customerNote.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  // ─── Create users (one per role) ─────────────────────────────────────────

  const adminPassword = await bcrypt.hash("admin123", 10);
  const salesPassword = await bcrypt.hash("sales123", 10);
  const warehousePassword = await bcrypt.hash("warehouse123", 10);
  const accountsPassword = await bcrypt.hash("accounts123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@erp.local",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  const sales = await prisma.user.create({
    data: {
      name: "Sales Manager",
      email: "sales@erp.local",
      passwordHash: salesPassword,
      role: "SALES",
    },
  });

  const warehouse = await prisma.user.create({
    data: {
      name: "Warehouse Manager",
      email: "warehouse@erp.local",
      passwordHash: warehousePassword,
      role: "WAREHOUSE",
    },
  });

  const accounts = await prisma.user.create({
    data: {
      name: "Accounts Officer",
      email: "accounts@erp.local",
      passwordHash: accountsPassword,
      role: "ACCOUNTS",
    },
  });

  console.log("✓ Created 4 users (ADMIN, SALES, WAREHOUSE, ACCOUNTS)");

  // ─── Create 20 customers ────────────────────────────────────────────────────

  const customers: any[] = [];

  const custNames = [
    { name: "ABC Retail Store", business: "ABC Retail Store Pvt Ltd", mobile: "9876543210", email: "abc@retail.com", address: "123 Main Street, Mumbai", gst: "27AABCU1234H1Z0", type: "RETAIL", status: "ACTIVE" },
    { name: "XYZ Wholesale Traders", business: "XYZ Wholesale Traders", mobile: "9123456789", email: "xyz@wholesale.com", address: "456 Trade Avenue, Delhi", gst: "27AABCD5678H2Z0", type: "WHOLESALE", status: "ACTIVE" },
    { name: "PQR Distribution Hub", business: "PQR Distribution Hub", mobile: "9999888877", email: "pqr@distro.com", address: "789 Warehouse Lane, Bangalore", gst: "27AABCE9876H3Z0", type: "DISTRIBUTOR", status: "LEAD" },
    { name: "Sharma Electronics", business: "Sharma Electronics Pvt Ltd", mobile: "9988776655", email: "sharma@electronics.com", address: "Sector 5, Noida, UP", gst: "27AABCU5555H1Z0", type: "RETAIL", status: "ACTIVE" },
    { name: "Patel Industries", business: "Patel Industries", mobile: "9876654321", email: "patel@industries.com", address: "123 Industrial Park, Ahmedabad", gst: "27AABCD6666H2Z0", type: "WHOLESALE", status: "ACTIVE" },
    { name: "Kumar Supplies", business: "Kumar Supplies Co", mobile: "9555444333", email: "kumar@supplies.com", address: "Trade Center, Pune", gst: "27AABCE7777H3Z0", type: "DISTRIBUTOR", status: "ACTIVE" },
    { name: "New Market Store", business: "New Market Store", mobile: "9777888999", email: "newmarket@store.com", address: "New Market Complex, Kolkata", gst: "27AABCU8888H1Z0", type: "RETAIL", status: "LEAD" },
    { name: "Global Trade Enterprises", business: "Global Trade Enterprises", mobile: "9666555444", email: "global@trade.com", address: "456 Business Hub, Hyderabad", gst: "27AABCD7777H2Z0", type: "WHOLESALE", status: "ACTIVE" },
    { name: "Innovation Tech Solutions", business: "Innovation Tech Solutions", mobile: "9555444333", email: "innovation@tech.com", address: "Tech Park, Bangalore", gst: "27AABCE8888H3Z0", type: "DISTRIBUTOR", status: "ACTIVE" },
    { name: "Premium Retail Network", business: "Premium Retail Network", mobile: "9444333222", email: "premium@retail.com", address: "Retail Plaza, Pune", gst: "27AABCU9999H1Z0", type: "RETAIL", status: "LEAD" },
    { name: "Metro Supply Chain", business: "Metro Supply Chain", mobile: "9333222111", email: "metro@supply.com", address: "Supply Hub, Chennai", gst: "27AABCD1111H2Z0", type: "WHOLESALE", status: "ACTIVE" },
    { name: "Elite Distribution Services", business: "Elite Distribution Services", mobile: "9222111000", email: "elite@distro.com", address: "Distribution Center, Gurgaon", gst: "27AABCE2222H3Z0", type: "DISTRIBUTOR", status: "ACTIVE" },
    { name: "Smart Retail Solutions", business: "Smart Retail Solutions", mobile: "8999888777", email: "smart@retail.com", address: "Retail District, Jaipur", gst: "27AABCU3333H1Z0", type: "RETAIL", status: "ACTIVE" },
    { name: "Express Wholesale Hub", business: "Express Wholesale Hub", mobile: "8888777666", email: "express@wholesale.com", address: "Wholesale Market, Lucknow", gst: "27AABCD4444H2Z0", type: "WHOLESALE", status: "LEAD" },
    { name: "Dynamic Distribution Network", business: "Dynamic Distribution Network", mobile: "8777666555", email: "dynamic@distro.com", address: "Distribution Center, Indore", gst: "27AABCE5555H3Z0", type: "DISTRIBUTOR", status: "ACTIVE" },
    { name: "Nexus Retail Group", business: "Nexus Retail Group", mobile: "8666555444", email: "nexus@retail.com", address: "Retail Hub, Chandigarh", gst: "27AABCU6666H1Z0", type: "RETAIL", status: "ACTIVE" },
    { name: "Apex Trading Solutions", business: "Apex Trading Solutions", mobile: "8555444333", email: "apex@trading.com", address: "Trading Floor, Nagpur", gst: "27AABCD7777H2Z0", type: "WHOLESALE", status: "ACTIVE" },
    { name: "ProLink Distribution", business: "ProLink Distribution", mobile: "8444333222", email: "prolink@distro.com", address: "Distribution Hub, Bhopal", gst: "27AABCE8888H3Z0", type: "DISTRIBUTOR", status: "LEAD" },
    { name: "Quantum Retail Services", business: "Quantum Retail Services", mobile: "8333222111", email: "quantum@retail.com", address: "Retail Center, Visakhapatnam", gst: "27AABCU9999H1Z0", type: "RETAIL", status: "ACTIVE" },
    { name: "Vertex Supply Chain", business: "Vertex Supply Chain", mobile: "8222111000", email: "vertex@supply.com", address: "Supply Center, Kochi", gst: "27AABCD1111H2Z0", type: "WHOLESALE", status: "ACTIVE" },
  ];

  for (const custData of custNames) {
    const customer = await prisma.customer.create({
      data: {
        name: custData.name,
        mobile: custData.mobile,
        email: custData.email,
        businessName: custData.business,
        gstNumber: custData.gst,
        customerType: custData.type,
        address: custData.address,
        status: custData.status,
        followUpDate: custData.status === "LEAD" ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined,
      },
    });
    customers.push(customer);
  }

  // Keep old references for backward compatibility
  const cust1 = customers[0];
  const cust2 = customers[1];
  const cust3 = customers[2];
  const cust4 = customers[3];
  const cust5 = customers[4];
  const cust6 = customers[5];
  const cust7 = customers[6];

  console.log("✓ Created 20 customers");

  // ─── Add 10+ customer notes ──────────────────────────────────────────────────

  const notes = [
    { customerId: 0, note: "Prefers bulk orders on Mondays" },
    { customerId: 1, note: "Always negotiates on price" },
    { customerId: 2, note: "Requires GST invoices only" },
    { customerId: 3, note: "Monthly orders, usually same products" },
    { customerId: 4, note: "Frequent 24-hour delivery requests" },
    { customerId: 5, note: "Premium customer - priority handling" },
    { customerId: 6, note: "New customer - need follow-up" },
    { customerId: 7, note: "Wholesale only - no retail items" },
    { customerId: 8, note: "Quality-conscious, inspects all items" },
    { customerId: 9, note: "Seasonal orders - peaks in Q2" },
    { customerId: 10, note: "Payment usually 30 days NET" },
    { customerId: 11, note: "Prefers online ordering and tracking" },
  ];

  for (const noteData of notes) {
    await prisma.customerNote.create({
      data: {
        customerId: customers[noteData.customerId].id,
        note: noteData.note,
        createdBy: sales.id,
      },
    });
  }

  console.log("✓ Added 12 customer notes");

  // ─── Create 20 products ────────────────────────────────────────────────────

  const products: any[] = [];

  const productData = [
    { name: "Industrial Bearing Type A", sku: "SKU-001", category: "Bearings", price: 1500.0, stock: 50, alert: 20, location: "Rack A1" },
    { name: "Motor Oil Premium Grade", sku: "SKU-002", category: "Lubricants", price: 450.0, stock: 5, alert: 10, location: "Rack B2" },
    { name: "Steel Fasteners Assorted", sku: "SKU-003", category: "Hardware", price: 350.0, stock: 100, alert: 25, location: "Rack C3" },
    { name: "Hydraulic Pump Unit", sku: "SKU-004", category: "Pumps", price: 8500.0, stock: 12, alert: 5, location: "Rack D4" },
    { name: "Rubber Seals Kit", sku: "SKU-005", category: "Seals", price: 275.0, stock: 150, alert: 30, location: "Rack E5" },
    { name: "Electrical Cable (100m)", sku: "SKU-006", category: "Electrical", price: 2200.0, stock: 35, alert: 15, location: "Rack F6" },
    { name: "Paint Protective Coating", sku: "SKU-007", category: "Coatings", price: 1100.0, stock: 40, alert: 20, location: "Rack G7" },
    { name: "Stainless Steel Washers", sku: "SKU-008", category: "Hardware", price: 125.0, stock: 500, alert: 100, location: "Rack H8" },
    { name: "Pneumatic Valve Set", sku: "SKU-009", category: "Valves", price: 2850.0, stock: 25, alert: 10, location: "Rack I9" },
    { name: "Thermal Insulation Tape", sku: "SKU-010", category: "Insulation", price: 185.0, stock: 200, alert: 50, location: "Rack J10" },
    { name: "Brass Connector Fittings", sku: "SKU-011", category: "Fittings", price: 95.0, stock: 400, alert: 80, location: "Rack K11" },
    { name: "Industrial Air Filter", sku: "SKU-012", category: "Filters", price: 680.0, stock: 60, alert: 15, location: "Rack L12" },
    { name: "Carbon Steel Pipes (10m)", sku: "SKU-013", category: "Pipes", price: 3200.0, stock: 18, alert: 8, location: "Rack M13" },
    { name: "Chrome Plated Springs", sku: "SKU-014", category: "Springs", price: 225.0, stock: 250, alert: 60, location: "Rack N14" },
    { name: "Silicone Sealant Cartridge", sku: "SKU-015", category: "Sealants", price: 165.0, stock: 180, alert: 40, location: "Rack O15" },
    { name: "Copper Wire Coil (1kg)", sku: "SKU-016", category: "Electrical", price: 850.0, stock: 45, alert: 12, location: "Rack P16" },
    { name: "Stainless Steel Hinges", sku: "SKU-017", category: "Hardware", price: 285.0, stock: 120, alert: 35, location: "Rack Q17" },
    { name: "Industrial Grease (5kg)", sku: "SKU-018", category: "Lubricants", price: 1250.0, stock: 28, alert: 10, location: "Rack R18" },
    { name: "Nylon Bushings Assorted", sku: "SKU-019", category: "Bushings", price: 145.0, stock: 350, alert: 70, location: "Rack S19" },
    { name: "Cast Iron Flanges", sku: "SKU-020", category: "Fittings", price: 425.0, stock: 55, alert: 20, location: "Rack T20" },
  ];

  for (const pData of productData) {
    const product = await prisma.product.create({
      data: {
        name: pData.name,
        sku: pData.sku,
        category: pData.category,
        unitPrice: pData.price,
        currentStock: pData.stock,
        minStockAlert: pData.alert,
        warehouseLocation: pData.location,
      },
    });
    products.push(product);
  }

  // Keep old references for backward compatibility
  const prod1 = products[0];
  const prod2 = products[1];
  const prod3 = products[2];
  const prod4 = products[3];
  const prod5 = products[4];
  const prod6 = products[5];
  const prod7 = products[6];
  const prod8 = products[7];

  console.log("✓ Created 20 products (several below minimum stock alert)");

  // ─── Create sample stock movements ──────────────────────────────────────

  await prisma.stockMovement.create({
    data: {
      productId: prod1.id,
      quantityChanged: 50,
      movementType: "IN",
      reason: "Initial warehouse receipt",
      createdBy: warehouse.id,
    },
  });

  console.log("✓ Created sample stock movements");

  // ─── Create 20+ sample challans ────────────────────────────────────────────

  const challanConfigs = [
    { custIdx: 0, status: "DRAFT", items: [{ prodIdx: 0, qty: 2 }] },
    { custIdx: 1, status: "CONFIRMED", items: [{ prodIdx: 2, qty: 5 }] },
    { custIdx: 2, status: "CONFIRMED", items: [{ prodIdx: 4, qty: 10 }, { prodIdx: 7, qty: 5 }] },
    { custIdx: 3, status: "CONFIRMED", items: [{ prodIdx: 0, qty: 8 }, { prodIdx: 3, qty: 2 }, { prodIdx: 5, qty: 15 }] },
    { custIdx: 4, status: "CONFIRMED", items: [{ prodIdx: 1, qty: 20 }] },
    { custIdx: 5, status: "DRAFT", items: [{ prodIdx: 6, qty: 3 }, { prodIdx: 8, qty: 5 }] },
    { custIdx: 6, status: "CONFIRMED", items: [{ prodIdx: 9, qty: 12 }] },
    { custIdx: 7, status: "CONFIRMED", items: [{ prodIdx: 10, qty: 25 }, { prodIdx: 11, qty: 8 }] },
    { custIdx: 8, status: "CONFIRMED", items: [{ prodIdx: 12, qty: 2 }, { prodIdx: 13, qty: 15 }] },
    { custIdx: 9, status: "DRAFT", items: [{ prodIdx: 14, qty: 30 }] },
    { custIdx: 10, status: "CONFIRMED", items: [{ prodIdx: 15, qty: 5 }, { prodIdx: 16, qty: 10 }, { prodIdx: 17, qty: 3 }] },
    { custIdx: 11, status: "CONFIRMED", items: [{ prodIdx: 18, qty: 50 }] },
    { custIdx: 12, status: "CONFIRMED", items: [{ prodIdx: 19, qty: 12 }, { prodIdx: 0, qty: 3 }] },
    { custIdx: 13, status: "DRAFT", items: [{ prodIdx: 2, qty: 7 }] },
    { custIdx: 14, status: "CONFIRMED", items: [{ prodIdx: 4, qty: 18 }, { prodIdx: 9, qty: 6 }] },
    { custIdx: 15, status: "CONFIRMED", items: [{ prodIdx: 6, qty: 4 }] },
    { custIdx: 16, status: "CONFIRMED", items: [{ prodIdx: 11, qty: 14 }, { prodIdx: 14, qty: 22 }] },
    { custIdx: 17, status: "CONFIRMED", items: [{ prodIdx: 3, qty: 1 }, { prodIdx: 5, qty: 9 }] },
    { custIdx: 18, status: "DRAFT", items: [{ prodIdx: 8, qty: 11 }, { prodIdx: 16, qty: 8 }] },
    { custIdx: 19, status: "CONFIRMED", items: [{ prodIdx: 10, qty: 33 }] },
    { custIdx: 0, status: "CONFIRMED", items: [{ prodIdx: 7, qty: 6 }, { prodIdx: 12, qty: 4 }] },
    { custIdx: 1, status: "CONFIRMED", items: [{ prodIdx: 13, qty: 19 }] },
  ];

  let challanCounter = 1;

  for (const config of challanConfigs) {
    const challanNumber = `CH-2026-${String(challanCounter).padStart(4, "0")}`;
    
    const totalQuantity = config.items.reduce((sum, item) => sum + item.qty, 0);

    const challan = await prisma.challan.create({
      data: {
        challanNumber,
        customerId: customers[config.custIdx].id,
        status: config.status,
        totalQuantity,
        createdBy: sales.id,
        items: {
          create: config.items.map((item) => ({
            productId: products[item.prodIdx].id,
            productNameSnapshot: products[item.prodIdx].name,
            productSkuSnapshot: products[item.prodIdx].sku,
            unitPriceSnapshot: products[item.prodIdx].unitPrice,
            quantity: item.qty,
          })),
        },
      },
    });

    // If CONFIRMED, create stock movements and update inventory
    if (config.status === "CONFIRMED") {
      for (const item of config.items) {
        await prisma.stockMovement.create({
          data: {
            productId: products[item.prodIdx].id,
            quantityChanged: item.qty,
            movementType: "OUT",
            reason: `Challan ${challanNumber}`,
            createdBy: sales.id,
          },
        });

        // Update product stock
        await prisma.product.update({
          where: { id: products[item.prodIdx].id },
          data: { currentStock: { decrement: item.qty } },
        });
      }
    }

    challanCounter++;
  }

  console.log("✓ Created 22 sample challans (with stock movements for confirmed ones)");

  console.log("\n✅ Seeding complete!");
  console.log("\n--- Test Credentials ---");
  console.log("ADMIN:     admin@erp.local / admin123");
  console.log("SALES:     sales@erp.local / sales123");
  console.log("WAREHOUSE: warehouse@erp.local / warehouse123");
  console.log("ACCOUNTS:  accounts@erp.local / accounts123");
  console.log("------------------------\n");
}

main()
  .catch((e) => {
    console.error("🚨 Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
