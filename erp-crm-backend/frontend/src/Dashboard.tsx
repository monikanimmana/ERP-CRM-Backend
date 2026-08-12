import React, { useState, useEffect } from 'react';
import { api } from './api';

interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  businessName: string;
  customerType: string;
  status: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  unitPrice: number;
  currentStock: number;
  category: string;
  minStockAlert: number;
}

interface Challan {
  id: string;
  challanNumber: string;
  customer?: any;
  totalQuantity: number;
  status: string;
}

function Dashboard() {
  const [activeTab, setActiveTab] = useState('customers');
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [challans, setChallans] = useState<Challan[]>([]);

  // User state
  const [user, setUser] = useState<{id: string; name: string; email: string; role: string}>({
    id: '',
    name: 'User',
    email: 'user@erp.local',
    role: 'USER'
  });

  // Modal states
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddChallan, setShowAddChallan] = useState(false);

  // Form states
  const [customerForm, setCustomerForm] = useState({
    name: '',
    mobile: '',
    email: '',
    businessName: '',
    customerType: 'RETAIL',
    address: '',
    status: 'LEAD'
  });

  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    category: '',
    unitPrice: 0,
    currentStock: 0,
    minStockAlert: 10,
    warehouseLocation: ''
  });

  const [challanForm, setChallanForm] = useState({
    customerId: '',
    items: [{ productId: '', quantity: 1 }],
    status: 'DRAFT' as 'DRAFT' | 'CONFIRMED'
  });

  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Load user data from localStorage
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'customers') {
        const res = await api.getCustomers(1, 100);
        setCustomers(res.data.data || []);
      } else if (activeTab === 'products') {
        const res = await api.getProducts(1, 100);
        setProducts(res.data.data || []);
      } else if (activeTab === 'challans') {
        const res = await api.getChallans(1, 100);
        setChallans(res.data.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const handleAddCustomer = async () => {
    if (!customerForm.name || !customerForm.mobile) {
      alert('Please fill all required fields');
      return;
    }
    try {
      await api.client.post('/customers', customerForm);
      setShowAddCustomer(false);
      setCustomerForm({
        name: '',
        mobile: '',
        email: '',
        businessName: '',
        customerType: 'RETAIL',
        address: '',
        status: 'LEAD'
      });
      setSuccessMessage('Customer added successfully! ✅');
      setTimeout(() => setSuccessMessage(''), 3000);
      loadData();
    } catch (error: any) {
      alert('Error adding customer: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const handleAddProduct = async () => {
    if (!productForm.name || !productForm.sku) {
      alert('Please fill all required fields');
      return;
    }
    try {
      await api.client.post('/products', productForm);
      setShowAddProduct(false);
      setProductForm({
        name: '',
        sku: '',
        category: '',
        unitPrice: 0,
        currentStock: 0,
        minStockAlert: 10,
        warehouseLocation: ''
      });
      setSuccessMessage('Product added successfully! ✅');
      setTimeout(() => setSuccessMessage(''), 3000);
      loadData();
    } catch (error: any) {
      alert('Error adding product: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const handleAddChallan = async () => {
    if (!challanForm.customerId) {
      alert('Please select a customer');
      return;
    }
    if (!challanForm.items[0].productId || challanForm.items[0].quantity <= 0) {
      alert('Please add at least one item with valid quantity');
      return;
    }
    try {
      await api.client.post('/challans', challanForm);
      setShowAddChallan(false);
      setChallanForm({
        customerId: '',
        items: [{ productId: '', quantity: 1 }],
        status: 'DRAFT'
      });
      setSuccessMessage('Challan created successfully! ✅');
      setTimeout(() => setSuccessMessage(''), 3000);
      loadData();
    } catch (error: any) {
      alert('Error creating challan: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    window.location.href = '/login';
  };

  const getStatusBadge = (status: string) => {
    const badgeClass = status === 'ACTIVE' ? 'badge-success' : 
                       status === 'LEAD' ? 'badge-warning' : 
                       status === 'CONFIRMED' ? 'badge-success' :
                       status === 'DRAFT' ? 'badge-info' : 'badge-danger';
    return <span className={`badge ${badgeClass}`}>{status}</span>;
  };

  return (
    <div className="dashboard-container">
      {/* NAVBAR */}
      <div className="navbar">
        <div className="navbar-left">
          <h1>🏢 Mini ERP + CRM Portal</h1>
          <div className="user-info">
            <strong>{user.name}</strong> ({user.role}) • {user.email}
          </div>
        </div>
        <div className="navbar-right">
          {successMessage && <span className="alert-success">{successMessage}</span>}
          <button className="logout-btn" onClick={handleLogout}>🚪 Logout</button>
        </div>
      </div>

      {/* TABS */}
      <div className="tabs-header">
        <button
          className={`tab ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          👥 Customers
        </button>
        <button
          className={`tab ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          📦 Products
        </button>
        <button
          className={`tab ${activeTab === 'challans' ? 'active' : ''}`}
          onClick={() => setActiveTab('challans')}
        >
          📄 Challans
        </button>
      </div>

      {/* CONTENT */}
      <div className="content">
        {/* CUSTOMERS TAB */}
        {activeTab === 'customers' && (
          <>
            <div className="content-header">
              <h2>👥 Manage Customers</h2>
              {(user.role === 'ADMIN' || user.role === 'SALES') && (
                <button className="btn-add" onClick={() => setShowAddCustomer(true)}>
                  ➕ Add New Customer
                </button>
              )}
              {(user.role === 'WAREHOUSE' || user.role === 'ACCOUNTS') && (
                <div className="role-notice">👁️ View Only</div>
              )}
            </div>
            {loading ? (
              <div className="loading"></div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Mobile</th>
                    <th>Email</th>
                    <th>Business</th>
                    <th>Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 ? (
                    <tr><td colSpan={6} style={{textAlign: 'center', color: '#999'}}>No customers found</td></tr>
                  ) : (
                    customers.map((c) => (
                      <tr key={c.id}>
                        <td><strong>{c.name}</strong></td>
                        <td>{c.mobile}</td>
                        <td>{c.email || '-'}</td>
                        <td>{c.businessName}</td>
                        <td><span className="badge badge-info">{c.customerType}</span></td>
                        <td>{getStatusBadge(c.status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <>
            <div className="content-header">
              <h2>📦 Inventory Management</h2>
              {user.role === 'ADMIN' && (
                <button className="btn-add" onClick={() => setShowAddProduct(true)}>
                  ➕ Add New Product
                </button>
              )}
              {(user.role === 'WAREHOUSE' || user.role === 'SALES' || user.role === 'ACCOUNTS') && (
                <div className="role-notice">👁️ View Only</div>
              )}
            </div>
            {loading ? (
              <div className="loading"></div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>SKU</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Min Alert</th>
                    <th>Category</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr><td colSpan={7} style={{textAlign: 'center', color: '#999'}}>No products found</td></tr>
                  ) : (
                    products.map((p) => (
                      <tr key={p.id}>
                        <td><strong>{p.name}</strong></td>
                        <td><code>{p.sku}</code></td>
                        <td>₹{p.unitPrice.toLocaleString()}</td>
                        <td><strong>{p.currentStock}</strong></td>
                        <td>{p.minStockAlert}</td>
                        <td>{p.category}</td>
                        <td>
                          {p.currentStock < p.minStockAlert ? (
                            <span className="badge badge-warning">⚠️ LOW STOCK</span>
                          ) : (
                            <span className="badge badge-success">✅ OK</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </>
        )}

        {/* CHALLANS TAB */}
        {activeTab === 'challans' && (
          <>
            <div className="content-header">
              <h2>📄 Sales Challans</h2>
              {(user.role === 'ADMIN' || user.role === 'SALES') && (
                <button className="btn-add" onClick={() => setShowAddChallan(true)}>
                  ➕ Create Challan
                </button>
              )}
              {(user.role === 'WAREHOUSE' || user.role === 'ACCOUNTS') && (
                <div className="role-notice">
                  {user.role === 'ACCOUNTS' ? '👁️ View Only' : '✔️ Can Confirm & Adjust Stock'}
                </div>
              )}
            </div>
            {loading ? (
              <div className="loading"></div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Challan #</th>
                    <th>Customer</th>
                    <th>Items Count</th>
                    <th>Total Qty</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {challans.length === 0 ? (
                    <tr><td colSpan={6} style={{textAlign: 'center', color: '#999'}}>No challans found</td></tr>
                  ) : (
                    challans.map((ch) => (
                      <tr key={ch.id}>
                        <td><strong>{ch.challanNumber}</strong></td>
                        <td>{ch.customer?.name || '-'}</td>
                        <td>{ch.totalQuantity}</td>
                        <td><strong>{ch.totalQuantity}</strong></td>
                        <td>{getStatusBadge(ch.status)}</td>
                        <td>2026-08-11</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>

      {/* ADD CUSTOMER MODAL */}
      <div className={`modal ${showAddCustomer ? 'open' : ''}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h2>➕ Add New Customer</h2>
            <button className="modal-close" onClick={() => setShowAddCustomer(false)}>✕</button>
          </div>

          <div className="form-group">
            <label>Customer Name *</label>
            <input
              type="text"
              placeholder="e.g., ABC Retail Store"
              value={customerForm.name}
              onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Mobile Number *</label>
            <input
              type="tel"
              placeholder="e.g., 9876543210"
              value={customerForm.mobile}
              onChange={(e) => setCustomerForm({...customerForm, mobile: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="e.g., customer@example.com"
              value={customerForm.email}
              onChange={(e) => setCustomerForm({...customerForm, email: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Business Name</label>
            <input
              type="text"
              placeholder="e.g., ABC Retail Pvt Ltd"
              value={customerForm.businessName}
              onChange={(e) => setCustomerForm({...customerForm, businessName: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Customer Type</label>
            <select
              value={customerForm.customerType}
              onChange={(e) => setCustomerForm({...customerForm, customerType: e.target.value})}
            >
              <option value="RETAIL">Retail</option>
              <option value="WHOLESALE">Wholesale</option>
              <option value="DISTRIBUTOR">Distributor</option>
            </select>
          </div>

          <div className="form-group">
            <label>Address</label>
            <textarea
              placeholder="Enter customer address"
              value={customerForm.address}
              onChange={(e) => setCustomerForm({...customerForm, address: e.target.value})}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              value={customerForm.status}
              onChange={(e) => setCustomerForm({...customerForm, status: e.target.value})}
            >
              <option value="LEAD">Lead</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="modal-footer">
            <button className="btn-secondary" onClick={() => setShowAddCustomer(false)}>Cancel</button>
            <button className="btn-success" onClick={handleAddCustomer}>Save Customer</button>
          </div>
        </div>
      </div>

      {/* ADD PRODUCT MODAL */}
      <div className={`modal ${showAddProduct ? 'open' : ''}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h2>➕ Add New Product</h2>
            <button className="modal-close" onClick={() => setShowAddProduct(false)}>✕</button>
          </div>

          <div className="form-group">
            <label>Product Name *</label>
            <input
              type="text"
              placeholder="e.g., Industrial Bearing"
              value={productForm.name}
              onChange={(e) => setProductForm({...productForm, name: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>SKU/Code *</label>
            <input
              type="text"
              placeholder="e.g., SKU-001"
              value={productForm.sku}
              onChange={(e) => setProductForm({...productForm, sku: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <input
              type="text"
              placeholder="e.g., Bearings"
              value={productForm.category}
              onChange={(e) => setProductForm({...productForm, category: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Unit Price (₹)</label>
            <input
              type="number"
              placeholder="e.g., 1500"
              value={productForm.unitPrice}
              onChange={(e) => setProductForm({...productForm, unitPrice: parseFloat(e.target.value)})}
            />
          </div>

          <div className="form-group">
            <label>Current Stock</label>
            <input
              type="number"
              placeholder="e.g., 50"
              value={productForm.currentStock}
              onChange={(e) => setProductForm({...productForm, currentStock: parseInt(e.target.value)})}
            />
          </div>

          <div className="form-group">
            <label>Minimum Stock Alert</label>
            <input
              type="number"
              placeholder="e.g., 10"
              value={productForm.minStockAlert}
              onChange={(e) => setProductForm({...productForm, minStockAlert: parseInt(e.target.value)})}
            />
          </div>

          <div className="form-group">
            <label>Warehouse Location</label>
            <input
              type="text"
              placeholder="e.g., Rack A1"
              value={productForm.warehouseLocation}
              onChange={(e) => setProductForm({...productForm, warehouseLocation: e.target.value})}
            />
          </div>

          <div className="modal-footer">
            <button className="btn-secondary" onClick={() => setShowAddProduct(false)}>Cancel</button>
            <button className="btn-success" onClick={handleAddProduct}>Save Product</button>
          </div>
        </div>
      </div>

      {/* ADD CHALLAN MODAL */}
      <div className={`modal ${showAddChallan ? 'open' : ''}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h2>➕ Create New Challan</h2>
            <button className="modal-close" onClick={() => setShowAddChallan(false)}>✕</button>
          </div>

          <div className="form-group">
            <label>Customer *</label>
            <select
              value={challanForm.customerId}
              onChange={(e) => setChallanForm({...challanForm, customerId: e.target.value})}
            >
              <option value="">Select a customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.businessName})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              value={challanForm.status}
              onChange={(e) => setChallanForm({...challanForm, status: e.target.value as 'DRAFT' | 'CONFIRMED'})}
            >
              <option value="DRAFT">Draft</option>
              <option value="CONFIRMED">Confirmed</option>
            </select>
          </div>

          <div className="form-group">
            <label>Items</label>
            {challanForm.items.map((item, idx) => (
              <div key={idx} style={{marginBottom: '10px', display: 'flex', gap: '10px'}}>
                <select
                  value={item.productId}
                  onChange={(e) => {
                    const newItems = [...challanForm.items];
                    newItems[idx].productId = e.target.value;
                    setChallanForm({...challanForm, items: newItems});
                  }}
                  style={{flex: 1}}
                >
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.currentStock})</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => {
                    const newItems = [...challanForm.items];
                    newItems[idx].quantity = parseInt(e.target.value) || 1;
                    setChallanForm({...challanForm, items: newItems});
                  }}
                  placeholder="Qty"
                  style={{width: '80px'}}
                />
              </div>
            ))}
            <button 
              type="button"
              onClick={() => setChallanForm({...challanForm, items: [...challanForm.items, {productId: '', quantity: 1}]})}
              style={{marginTop: '10px'}}
            >
              ➕ Add Item
            </button>
          </div>

          <div className="modal-footer">
            <button className="btn-secondary" onClick={() => setShowAddChallan(false)}>Cancel</button>
            <button className="btn-success" onClick={handleAddChallan}>Create Challan</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
