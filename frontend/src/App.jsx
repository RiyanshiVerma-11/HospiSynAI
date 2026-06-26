import React, { useState, useEffect } from 'react';
import {
  Activity,
  Users,
  CreditCard,
  PlusCircle,
  Search,
  Settings as SettingsIcon,
  LogOut,
  UserCheck,
  TrendingUp,
  FileText,
  Printer,
  Download,
  AlertTriangle,
  RotateCcw,
  Plus,
  Trash2,
  Calendar,
  Grid,
  History,
  FileSpreadsheet,
  CheckCircle,
  Lock,
  UserPlus
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar
} from 'recharts';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? "http://localhost:5000/api" 
    : "https://hospisyn-backend.onrender.com/api");

const STATIC_BASE = import.meta.env.VITE_STATIC_BASE_URL || 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? "http://localhost:5000" 
    : "https://hospisyn-backend.onrender.com");

function App() {
  // Auth state
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userRole, setUserRole] = useState(localStorage.getItem('role') || '');
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [name, setName] = useState(localStorage.getItem('name') || '');
  const [authError, setAuthError] = useState('');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dashboard Stats State
  const [metrics, setMetrics] = useState(null);

  // Search/Register State
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [newPatient, setNewPatient] = useState({
    name: '',
    age: '',
    gender: 'Male',
    mobile_number: '',
    address: ''
  });
  const [newVisit, setNewVisit] = useState({ reason: '' });
  const [newVisitDoctorId, setNewVisitDoctorId] = useState('');
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [newDoctor, setNewDoctor] = useState({ name: '', degree: '' });
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [newAdvancePayment, setNewAdvancePayment] = useState({
    amount_paid: '',
    payment_method: 'UPI',
    transaction_reference: ''
  });

  // Services Catalog
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({ category: 'Doctor Consultation', name: '', price: '' });
  const [editingService, setEditingService] = useState(null);

  // Billing State
  const [billItems, setBillItems] = useState([]); // { service_id, service_name, amount }
  const [availableServices, setAvailableServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');

  // Payment Recording State
  const [activeBillForPayment, setActiveBillForPayment] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount_paid: '',
    payment_method: 'UPI',
    transaction_reference: ''
  });

  // Refund State
  const [refundForm, setRefundForm] = useState({
    payment_id: '',
    amount_refunded: '',
    reason: ''
  });

  // Receipt Visualizer Modal State
  const [viewingPayment, setViewingPayment] = useState(null);
  const [systemSettings, setSystemSettings] = useState({});
  const [adminSettingsForm, setAdminSettingsForm] = useState({});

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);

  // User Management State
  const [staffUsers, setStaffUsers] = useState([]);
  const [newUserForm, setNewUserForm] = useState({ username: '', password: '', role: 'Receptionist', name: '' });

  // Toast / Status state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Fetch base headers
  const getHeaders = () => {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // ----------------------------------------------------
  // USE EFFECTS
  // ----------------------------------------------------
  useEffect(() => {
    if (token) {
      fetchSettings();
      fetchDashboardMetrics();
      fetchPatients();
      fetchServices();
      fetchDoctors();
      if (userRole === 'Admin') {
        fetchAuditLogs();
        fetchStaffUsers();
      }
    }
  }, [token]);

  useEffect(() => {
    // Reset viewable components depending on tab change
    if (activeTab === 'dashboard') fetchDashboardMetrics();
    if (activeTab === 'catalog') fetchServices();
    if (activeTab === 'audit_logs') fetchAuditLogs();
    if (activeTab === 'users') fetchStaffUsers();
    if (activeTab === 'settings') fetchDoctors();
  }, [activeTab]);

  // ----------------------------------------------------
  // API FETCHES
  // ----------------------------------------------------
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const formData = new URLSearchParams();
      formData.append('username', loginForm.username);
      formData.append('password', loginForm.password);

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const data = await res.json();
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('username', data.username);
      localStorage.setItem('name', data.name);

      setToken(data.access_token);
      setUserRole(data.role);
      setUsername(data.username);
      setName(data.name);

      // Route to correct tab
      if (data.role === 'Receptionist') {
        setActiveTab('search_register');
      } else if (data.role === 'Accountant') {
        setActiveTab('dashboard');
      } else {
        setActiveTab('dashboard');
      }
      showToast(`Welcome back, ${data.name}!`);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken('');
    setUserRole('');
    setUsername('');
    setName('');
    setActiveTab('dashboard');
  };

  const fetchDashboardMetrics = async () => {
    if (userRole === 'Receptionist') return; // Receptionist doesn't have access to financials
    try {
      const res = await fetch(`${API_BASE}/dashboard/metrics`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error("Error fetching dashboard metrics:", err);
    }
  };

  const fetchPatients = async (query = '') => {
    try {
      const url = query ? `${API_BASE}/patients?query=${encodeURIComponent(query)}` : `${API_BASE}/patients`;
      const res = await fetch(url, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
      }
    } catch (err) {
      console.error("Error searching patients:", err);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await fetch(`${API_BASE}/services`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setServices(data);
        setAvailableServices(data);
      }
    } catch (err) {
      console.error("Error fetching services:", err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/settings`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        const settingsMap = {};
        data.forEach(item => { settingsMap[item.key] = item.value; });
        setSystemSettings(settingsMap);
        setAdminSettingsForm(settingsMap);
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/audit-logs`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (err) {
      console.error("Error fetching audit logs:", err);
    }
  };

  const fetchStaffUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/users`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setStaffUsers(data);
      }
    } catch (err) {
      console.error("Error fetching staff users:", err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch(`${API_BASE}/doctors`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setDoctors(data);
      }
    } catch (err) {
      console.error("Error fetching doctors:", err);
    }
  };

  const fetchPatientBillingHistory = async (patientId) => {
    try {
      // Get all bills
      const resBills = await fetch(`${API_BASE}/bills?patient_id=${patientId}`, { headers: getHeaders() });
      if (resBills.ok) {
        const bills = await resBills.json();
        
        // Let's format patient billing history
        // Load details for each bill including its payments
        const fullHistory = [];
        for (let bill of bills) {
          const resPay = await fetch(`${API_BASE}/payments?bill_id=${bill.id}`, { headers: getHeaders() });
          const payments = resPay.ok ? await resPay.json() : [];
          fullHistory.push({ ...bill, payments });
        }
        setPatientHistory(fullHistory);
      }
    } catch (err) {
      console.error("Error fetching patient history:", err);
    }
  };

  // ----------------------------------------------------
  // SUBMISSIONS
  // ----------------------------------------------------
  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/patients`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newPatient)
      });
      if (!res.ok) throw new Error("Failed to register patient");
      const registered = await res.json();
      showToast(`Patient registered successfully: ${registered.name} (${registered.patient_id})`);
      setNewPatient({ name: '', age: '', gender: 'Male', mobile_number: '', address: '' });
      fetchPatients();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateVisit = async (e, patientId) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/visits`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          patient_id: patientId,
          reason: newVisit.reason,
          doctor_id: newVisitDoctorId ? parseInt(newVisitDoctorId) : null
        })
      });
      if (!res.ok) throw new Error("Failed to create visit");
      const visit = await res.json();
      showToast(`Visit generated successfully: ${visit.visit_id}`);
      setNewVisit({ reason: '' });
      setNewVisitDoctorId('');
      setShowVisitModal(false);
      handleSelectPatient(selectedPatient.id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRecordAdvance = async (e, visitId) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/payments?visit_id=${visitId}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          amount_paid: parseFloat(newAdvancePayment.amount_paid),
          payment_method: newAdvancePayment.payment_method,
          transaction_reference: newAdvancePayment.transaction_reference,
          payment_type: 'Advance'
        })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to record advance");
      }
      const payment = await res.json();
      showToast(`Advance payment recorded: ${payment.payment_id}`);
      setNewAdvancePayment({ amount_paid: '', payment_method: 'UPI', transaction_reference: '' });
      handleSelectPatient(selectedPatient.id);
      
      // Load receipt for previewing
      fetchReceiptDetails(payment.id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const fetchReceiptDetails = async (paymentId) => {
    try {
      const res = await fetch(`${API_BASE}/payments/${paymentId}/receipts`, { headers: getHeaders() });
      if (res.ok) {
        const receipts = await res.json();
        if (receipts.length > 0) {
          // Fetch full payment structure
          const resPay = await fetch(`${API_BASE}/payments`, { headers: getHeaders() });
          if (resPay.ok) {
            const list = await resPay.json();
            const fullPay = list.find(p => p.id === paymentId);
            setViewingPayment({ ...fullPay, receipt: receipts[0] });
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectPatient = async (patientId) => {
    const patient = patients.find(p => p.id === patientId);
    setSelectedPatient(patient);
    
    // Fetch visits
    const resVis = await fetch(`${API_BASE}/patients/${patientId}/visits`, { headers: getHeaders() });
    const visits = resVis.ok ? await resVis.json() : [];
    
    // Add visits list to selectedPatient
    setSelectedPatient(prev => ({ ...prev, visits }));
    fetchPatientBillingHistory(patientId);
  };

  const addBillItem = () => {
    if (!selectedServiceId) return;
    const service = services.find(s => s.id === parseInt(selectedServiceId));
    if (!service) return;

    const price = customItemPrice ? parseFloat(customItemPrice) : service.price;
    setBillItems([...billItems, { service_id: service.id, service_name: service.name, amount: price }]);
    setSelectedServiceId('');
    setCustomItemPrice('');
  };

  const removeBillItem = (index) => {
    setBillItems(billItems.filter((_, i) => i !== index));
  };

  const handleCreateBill = async (visitId) => {
    if (billItems.length === 0) {
      showToast("Please add at least one service item to the bill", "error");
      return;
    }
    try {
      const itemsIn = billItems.map(item => ({ service_id: item.service_id, amount: item.amount }));
      const res = await fetch(`${API_BASE}/bills`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ visit_id: visitId, items: itemsIn })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to create bill");
      }
      const bill = await res.json();
      showToast(`Bill generated: ${bill.bill_id}`);
      setBillItems([]);
      handleSelectPatient(selectedPatient.id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRecordBillPayment = async (e) => {
    e.preventDefault();
    if (!activeBillForPayment) return;
    try {
      const res = await fetch(`${API_BASE}/payments?bill_id=${activeBillForPayment.id}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          amount_paid: parseFloat(paymentForm.amount_paid),
          payment_method: paymentForm.payment_method,
          transaction_reference: paymentForm.transaction_reference,
          payment_type: 'Full' // Backend will map to Partial or Full based on balance
        })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to record payment");
      }
      const payment = await res.json();
      showToast(`Payment processed: ${payment.payment_id}`);
      setPaymentForm({ amount_paid: '', payment_method: 'UPI', transaction_reference: '' });
      setActiveBillForPayment(null);
      if (selectedPatient) handleSelectPatient(selectedPatient.id);
      fetchDashboardMetrics();
      
      // Auto-open Receipt Preview
      fetchReceiptDetails(payment.id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleIssueRefund = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/payments/${refundForm.payment_id}/refund`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          amount_refunded: parseFloat(refundForm.amount_refunded),
          reason: refundForm.reason
        })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to process refund");
      }
      const refund = await res.json();
      showToast(`Refund processed: ${refund.refund_id}`);
      setRefundForm({ payment_id: '', amount_refunded: '', reason: '' });
      if (selectedPatient) handleSelectPatient(selectedPatient.id);
      fetchDashboardMetrics();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(adminSettingsForm)
      });
      if (!res.ok) throw new Error("Failed to save settings");
      showToast("Hospital customization settings updated successfully!");
      fetchSettings();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/doctors`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newDoctor)
      });
      if (!res.ok) throw new Error("Failed to add doctor");
      showToast(`Doctor "${newDoctor.name}" added successfully.`);
      setNewDoctor({ name: '', degree: '' });
      fetchDoctors();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateDoctor = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/doctors/${editingDoctor.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          name: editingDoctor.name,
          degree: editingDoctor.degree
        })
      });
      if (!res.ok) throw new Error("Failed to update doctor");
      showToast(`Doctor "${editingDoctor.name}" updated successfully.`);
      setEditingDoctor(null);
      fetchDoctors();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteDoctor = async (id) => {
    if (!window.confirm("Are you sure you want to delete this doctor?")) return;
    try {
      const res = await fetch(`${API_BASE}/doctors/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error("Failed to delete doctor");
      showToast("Doctor deleted.");
      fetchDoctors();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/services`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ ...newService, price: parseFloat(newService.price) })
      });
      if (!res.ok) throw new Error("Failed to add service");
      showToast(`Service "${newService.name}" added to catalog.`);
      setNewService({ category: 'Doctor Consultation', name: '', price: '' });
      fetchServices();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/services/${editingService.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          category: editingService.category,
          name: editingService.name,
          price: parseFloat(editingService.price)
        })
      });
      if (!res.ok) throw new Error("Failed to update service");
      showToast(`Service "${editingService.name}" updated successfully.`);
      setEditingService(null);
      fetchServices();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;
    try {
      const res = await fetch(`${API_BASE}/services/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error("Failed to delete service");
      showToast("Service deleted.");
      fetchServices();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateStaffUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/auth/users`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newUserForm)
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to create user");
      }
      showToast(`Staff user "${newUserForm.username}" registered successfully.`);
      setNewUserForm({ username: '', password: '', role: 'Receptionist', name: '' });
      fetchStaffUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSoftDeleteBill = async (id) => {
    if (!window.confirm("Are you sure you want to cancel/delete this bill?")) return;
    try {
      const res = await fetch(`${API_BASE}/bills/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error("Failed to delete bill");
      showToast("Bill cancelled (soft deleted) successfully.");
      if (selectedPatient) handleSelectPatient(selectedPatient.id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSoftDeletePatient = async (id) => {
    if (!window.confirm("Are you sure you want to delete this patient profile?")) return;
    try {
      const res = await fetch(`${API_BASE}/patients/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error("Failed to delete patient");
      showToast("Patient profile soft deleted.");
      setSelectedPatient(null);
      fetchPatients();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Convert numbers to words in Javascript for UI display
  const wordsFromNumber = (num) => {
    if (num === 0) return "Zero";
    const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
                   "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    
    const convert = (n) => {
      if (n < 20) return units[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + units[n % 10] : "");
      return units[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + convert(n % 100) : "");
    };

    const convertLarge = (n) => {
      if (n === 0) return "";
      if (n < 1000) return convert(n);
      if (n < 100000) {
        return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + convertLarge(n % 1000) : "");
      }
      if (n < 10000000) {
        return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + convertLarge(n % 100000) : "");
      }
      return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + convertLarge(n % 10000000) : "");
    };

    const intPart = Math.floor(num);
    const fracPart = Math.round((num - intPart) * 100);
    
    let str = convertLarge(intPart) + " Rupees";
    if (fracPart > 0) {
      str += " and " + convert(fracPart) + " Paise";
    }
    return str + " Only";
  };

  // Render Login page if not authenticated
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Decorative ambient background elements */}
        <div className="absolute w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-3xl -top-40 -left-40"></div>
        <div className="absolute w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-3xl -bottom-40 -right-40"></div>

        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 p-8 rounded-3xl w-full max-w-md shadow-2xl relative z-10 transition-all duration-300">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20 mb-4">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white font-sans">HospiSyn</h1>
            <p className="text-slate-400 text-sm mt-1">Hospital Billing & Receipt Desk</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {authError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Username</label>
              <input
                type="text"
                className="w-full bg-slate-950/40 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                placeholder="receptionist / accountant / admin"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                className="w-full bg-slate-950/40 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                placeholder="••••••••"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-teal-500/15 hover:shadow-teal-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
            >
              <Lock className="w-4 h-4" />
              Sign In
            </button>
          </form>

          <div className="mt-8 text-center text-xs text-slate-500 space-y-1">
            <p>SDE-3 Production hospital environment billing interface</p>
            <p className="font-semibold text-teal-500/70">Secure Audited Transactions Active</p>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER APP CORE LAYOUT
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative">
      {/* Toast Alert */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-4 rounded-2xl shadow-xl flex items-center gap-3 border animate-in fade-in slide-in-from-top-4 duration-300 ${
          toast.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Mobile Top Bar */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
            <Activity className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-white font-bold text-base font-sans tracking-tight">HospiSyn</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white focus:outline-none"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between flex-shrink-0 transition-transform duration-300 transform md:translate-x-0 md:static md:h-auto md:w-64 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div>
          {/* Logo & Header */}
          <div className="p-6 flex items-center gap-3 border-b border-slate-800">
            <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg font-sans tracking-tight">HospiSyn</h2>
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{userRole} Panel</span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-1">
            {/* Dashboard available to Admin and Accountant */}
            {userRole !== 'Receptionist' && (
              <button
                onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/10'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <Grid className="w-4 h-4" />
                Dashboard
              </button>
            )}

            {/* Receptionist Tabs */}
            {['Admin', 'Receptionist', 'Accountant'].includes(userRole) && (
              <button
                onClick={() => { setActiveTab('search_register'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'search_register'
                    ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/10'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <Search className="w-4 h-4" />
                Patient Search & Desk
              </button>
            )}

            {/* Accountant Tabs */}
            {['Admin', 'Accountant'].includes(userRole) && (
              <button
                onClick={() => { setActiveTab('billing_history'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'billing_history'
                    ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/10'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Billing Queue
              </button>
            )}

            {/* Admin Tabs */}
            {userRole === 'Admin' && (
              <>
                <button
                  onClick={() => { setActiveTab('catalog'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === 'catalog'
                      ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/10'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Services Catalog
                </button>

                <button
                  onClick={() => { setActiveTab('users'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === 'users'
                      ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/10'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  Staff Accounts
                </button>

                <button
                  onClick={() => { setActiveTab('audit_logs'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === 'audit_logs'
                      ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/10'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  <History className="w-4 h-4" />
                  Audit Logs
                </button>

                <button
                  onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === 'settings'
                      ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/10'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  <SettingsIcon className="w-4 h-4" />
                  Hospital Settings
                </button>
              </>
            )}
          </nav>
        </div>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 font-bold text-sm">
                {name.charAt(0)}
              </div>
              <div className="truncate w-32">
                <p className="text-white text-xs font-bold leading-none">{name}</p>
                <span className="text-slate-500 text-[10px] leading-none">{userRole}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto h-full md:max-h-screen">
        {/* HEADER BAR */}
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 font-sans tracking-tight">
              {activeTab === 'dashboard' && 'Dashboard Overview'}
              {activeTab === 'search_register' && 'Patient Registration & Search'}
              {activeTab === 'billing_history' && 'Billing & Payment Operations'}
              {activeTab === 'catalog' && 'Service Catalog Management'}
              {activeTab === 'users' && 'Staff Accounts'}
              {activeTab === 'audit_logs' && 'System Audit Trail'}
              {activeTab === 'settings' && 'Hospital Branding Settings'}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {activeTab === 'dashboard' && 'Real-time collection reports and financial summaries'}
              {activeTab === 'search_register' && 'Search profiles, check visit histories, register details'}
              {activeTab === 'billing_history' && 'Process billings, adjust advance items, clear balances'}
              {activeTab === 'catalog' && 'Edit categories, names, and standardized pricing'}
              {activeTab === 'users' && 'Create roles for receptionist, accountant, and admins'}
              {activeTab === 'audit_logs' && 'Chronological sequence tracking of users actions'}
              {activeTab === 'settings' && 'Customizable branding attributes for receipt PDF rendering'}
            </p>
          </div>

          <div className="text-slate-400 text-xs font-semibold bg-white border border-slate-200 shadow-sm rounded-xl px-4 py-2.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Live Hospital Server Time: {new Date().toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
          </div>
        </header>

        {/* ----------------------------------------------------
            TAB 1: DASHBOARD
            ---------------------------------------------------- */}
        {activeTab === 'dashboard' && metrics && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Patients */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Patients Registered</span>
                  <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-slate-900">{metrics.total_patients}</div>
                <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                  <span className="font-semibold text-emerald-600">+{metrics.today_patients}</span> registered today
                </div>
              </div>

              {/* Total Revenue */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Revenue</span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-slate-900">₹{metrics.total_revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                  <span className="font-semibold text-emerald-600">₹{metrics.today_revenue.toLocaleString('en-IN')}</span> collection today
                </div>
              </div>

              {/* Outstanding Dues */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Outstanding Dues</span>
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-slate-950">₹{metrics.pending_dues.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                <div className="text-xs text-rose-500 mt-2 font-semibold">
                  Actionable dues collection queue active
                </div>
              </div>

              {/* Collection splits */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Today's Splits</span>
                  <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                    <CreditCard className="w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Cash Collection:</span>
                    <span className="font-bold text-slate-900">₹{metrics.cash_collection_today.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Online Collection:</span>
                    <span className="font-bold text-slate-900">₹{metrics.online_collection_today.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <span>Refunds Issued:</span>
                    <span className="font-bold text-rose-600">₹{metrics.refund_amount_today.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Visualizer Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Method distribution Pie */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm lg:col-span-1">
                <h3 className="font-bold text-slate-800 text-sm mb-4 uppercase tracking-wider text-slate-500">Payment Methods Share</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.keys(metrics.payment_method_breakdown).map(k => ({
                          name: k,
                          value: metrics.payment_method_breakdown[k]
                        })).filter(x => x.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {Object.keys(metrics.payment_method_breakdown).map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={['#0d9488', '#0284c7', '#4f46e5', '#f59e0b', '#ec4899'][idx % 5]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Transactions volume count Bar chart */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm lg:col-span-2">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider text-slate-500">Transactions Count per Method</h3>
                  <div className="flex gap-2">
                    <a
                      href={`${API_BASE}/dashboard/reports/csv`}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
                      title="Export transactions report to CSV format"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      CSV Report
                    </a>
                    <a
                      href={`${API_BASE}/dashboard/reports/excel`}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
                      title="Export transactions report to Excel format"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      Excel Report
                    </a>
                  </div>
                </div>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={Object.keys(metrics.payment_method_counts).map(k => ({
                        method: k,
                        Count: metrics.payment_method_counts[k]
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="method" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="Count" fill="#0f766e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Recent Transaction Log */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 text-sm mb-4 uppercase tracking-wider text-slate-500">Recent Transactions (Real-Time)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-150 text-slate-400 font-semibold text-xs">
                      <th className="py-3 px-4">Txn ID</th>
                      <th className="py-3 px-4">Patient</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Date/Time</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-center">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {metrics.recent_transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 text-slate-900 font-bold text-xs">{tx.payment_id}</td>
                        <td className="py-3 px-4">{tx.patient_name}</td>
                        <td className="py-3 px-4">
                          <span className="bg-slate-100 text-slate-800 text-xs px-2 py-0.5 rounded-md font-semibold">{tx.payment_method}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                            tx.payment_type === 'Advance' ? 'bg-sky-50 text-sky-700' :
                            tx.payment_type === 'Refund' ? 'bg-rose-50 text-rose-700' :
                            'bg-emerald-50 text-emerald-700'
                          }`}>{tx.payment_type}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-xs">{tx.payment_date}</td>
                        <td className={`py-3 px-4 text-right font-extrabold ${tx.amount < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                          {tx.amount < 0 ? '-' : ''}₹{Math.abs(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => fetchReceiptDetails(tx.id)}
                            className="text-teal-600 hover:text-teal-800 text-xs font-bold inline-flex items-center gap-1 bg-teal-50 hover:bg-teal-100/80 px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                    {metrics.recent_transactions.length === 0 && (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-slate-400">No transactions recorded yet today.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            TAB 2: PATIENT SEARCH & REGISTER DESK
            ---------------------------------------------------- */}
        {activeTab === 'search_register' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start animate-in fade-in duration-300">
            {/* Search and Registration block (Left 2 cols) */}
            <div className="xl:col-span-2 space-y-8">
              {/* Search Bar */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 text-lg mb-4">Patient Finder</h3>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-medium"
                      placeholder="Search ID, Name, Mobile, Invoice..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        fetchPatients(e.target.value);
                      }}
                    />
                  </div>
                  <button
                    onClick={() => fetchPatients(searchQuery)}
                    className="bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-sm transition-all"
                  >
                    Search
                  </button>
                </div>

                {/* Patients Search Results list */}
                <div className="mt-6 space-y-3 max-h-96 overflow-y-auto pr-1">
                  {patients.map((pat) => (
                    <div
                      key={pat.id}
                      onClick={() => handleSelectPatient(pat.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        selectedPatient?.id === pat.id
                          ? 'border-teal-500 bg-teal-50/20 shadow-sm'
                          : 'border-slate-100 hover:border-slate-250 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{pat.name}</span>
                          <span className="text-[10px] font-extrabold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">{pat.gender}</span>
                          <span className="text-slate-400 text-xs">{pat.age} Yrs</span>
                        </div>
                        <p className="text-slate-400 text-xs font-semibold">Mobile: {pat.mobile_number} | ID: {pat.patient_id}</p>
                      </div>
                      <div className="text-teal-600 font-bold text-xs flex items-center justify-center gap-1 bg-white border border-slate-100 px-2.5 py-1.5 rounded-lg shadow-sm self-start sm:self-auto">
                        View Profile &rarr;
                      </div>
                    </div>
                  ))}
                  {patients.length === 0 && (
                    <p className="text-center text-slate-400 text-sm py-4">No matching patient profiles found. Use the panel on the right to register.</p>
                  )}
                </div>
              </div>

              {/* Selected Patient Workspace */}
              {selectedPatient && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                  {/* Patient Quick Header Details */}
                  <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                    <div>
                      <span className="text-teal-600 font-bold text-xs uppercase tracking-wider font-sans">Patient Workspace</span>
                      <h2 className="text-2xl font-bold text-slate-900 mt-1">{selectedPatient.name}</h2>
                      <p className="text-slate-400 text-xs mt-1">
                        Age: <b>{selectedPatient.age}</b> | Gender: <b>{selectedPatient.gender}</b> | Mobile: <b>{selectedPatient.mobile_number}</b> | ID: <b>{selectedPatient.patient_id}</b>
                      </p>
                      {selectedPatient.address && (
                        <p className="text-slate-500 text-xs mt-1">Address: {selectedPatient.address}</p>
                      )}
                    </div>
                    {userRole === 'Admin' && (
                      <button
                        onClick={() => handleSoftDeletePatient(selectedPatient.id)}
                        className="text-rose-600 hover:text-rose-800 text-xs font-semibold bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Profile
                      </button>
                    )}
                  </div>

                  {/* Create Visit Panel */}
                  {['Admin', 'Receptionist'].includes(userRole) && (
                    <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Consultation Entry</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Record a new visit or pathology reference under an active doctor.</p>
                      </div>
                      <button
                        onClick={() => {
                          setNewVisit({ reason: '' });
                          setNewVisitDoctorId('');
                          setShowVisitModal(true);
                        }}
                        className="bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 justify-center whitespace-nowrap active:scale-[0.98]"
                      >
                        <PlusCircle className="w-4 h-4" />
                        Log Consultation / Visit
                      </button>
                    </div>
                  )}

                  {/* Patient Visit Log List */}
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-teal-600" />
                      Patient Visits & Invoices Grid
                    </h3>
                    <div className="space-y-4">
                      {selectedPatient.visits?.map((vis) => {
                        // Find matching bills for this visit
                        const visitBills = patientHistory.filter(b => b.visit_id === vis.id);
                        
                        // Calculate total advance recorded for this visit that is not yet linked to a bill
                        const isAdvanceAvailable = patientHistory.some(b => b.visit_id === vis.id && b.advance_applied > 0);
                        
                        return (
                          <div key={vis.id} className="border border-slate-150 rounded-xl p-4 space-y-4 hover:border-slate-200 bg-white transition-all shadow-sm">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                              <div>
                                <span className="text-slate-400 text-xs font-semibold">Visit ID: <b className="text-slate-800">{vis.visit_id}</b></span>
                                <p className="font-bold text-slate-900 text-sm mt-0.5">Reason: {vis.reason || 'Not Specified'}</p>
                                {vis.doctor && (
                                  <p className="text-xs text-teal-700 font-bold mt-0.5">Consulting Doctor: <span className="text-slate-800">{vis.doctor.name}</span></p>
                                )}
                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Date: {new Date(vis.visit_date).toLocaleString()}</p>
                              </div>
                              
                              {/* Advance Payment creation for receptionist */}
                              {['Admin', 'Receptionist'].includes(userRole) && visitBills.length === 0 && (
                                <div className="border border-teal-100 bg-teal-50/30 p-3 rounded-lg flex flex-col gap-2">
                                  <span className="text-[10px] text-teal-600 font-bold uppercase tracking-wider">Record Advance Deposit</span>
                                  <form onSubmit={(e) => handleRecordAdvance(e, vis.id)} className="flex items-center gap-2 flex-wrap">
                                    <input
                                      type="number"
                                      className="w-24 bg-white border border-slate-200 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-teal-500 font-bold text-slate-800"
                                      placeholder="₹ Amount"
                                      value={newAdvancePayment.amount_paid}
                                      onChange={(e) => setNewAdvancePayment({ ...newAdvancePayment, amount_paid: e.target.value })}
                                      required
                                    />
                                    <select
                                      className="bg-white border border-slate-200 rounded px-2.5 py-1 text-xs focus:outline-none font-semibold text-slate-600"
                                      value={newAdvancePayment.payment_method}
                                      onChange={(e) => setNewAdvancePayment({ ...newAdvancePayment, payment_method: e.target.value })}
                                    >
                                      <option value="UPI">UPI</option>
                                      <option value="Cash">Cash</option>
                                      <option value="Card">Card</option>
                                      <option value="Net Banking">Net Banking</option>
                                      <option value="Wallet">Wallet</option>
                                    </select>
                                    <input
                                      type="text"
                                      className="w-28 bg-white border border-slate-200 rounded px-2.5 py-1 text-xs focus:outline-none font-medium text-slate-800"
                                      placeholder="Ref No (Optional)"
                                      value={newAdvancePayment.transaction_reference}
                                      onChange={(e) => setNewAdvancePayment({ ...newAdvancePayment, transaction_reference: e.target.value })}
                                    />
                                    <button
                                      type="submit"
                                      className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-3 py-1 rounded"
                                    >
                                      Save Deposit
                                    </button>
                                  </form>
                                </div>
                              )}
                            </div>

                            {/* Bills table linked to this visit */}
                            <div className="space-y-2">
                              <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Invoices / Bills:</div>
                              {visitBills.map(bill => (
                                <div key={bill.id} className="border border-slate-100 rounded-lg p-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-slate-50/50">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-900 text-xs">{bill.bill_id}</span>
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        bill.payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                        bill.payment_status === 'Partial Paid' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                        'bg-rose-50 text-rose-700 border border-rose-100'
                                      }`}>{bill.payment_status}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-1 font-semibold">
                                      Total: ₹{bill.grand_total.toLocaleString()} | Adjusted Advance: ₹{bill.advance_applied.toLocaleString()} | Outstanding: <b className="text-slate-700 font-bold">₹{bill.balance_amount.toLocaleString()}</b>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {/* Link to record payment if Accountant/Admin and balance exists */}
                                    {['Admin', 'Accountant'].includes(userRole) && bill.balance_amount > 0 && (
                                      <button
                                        onClick={() => {
                                          setActiveBillForPayment(bill);
                                          setPaymentForm({
                                            amount_paid: bill.balance_amount.toString(),
                                            payment_method: 'UPI',
                                            transaction_reference: ''
                                          });
                                          setActiveTab('billing_history');
                                        }}
                                        className="bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-teal-100 transition-colors"
                                      >
                                        Record Payment
                                      </button>
                                    )}

                                    {/* Print/Download Receipts button if any payment exists */}
                                    {bill.payments?.map(pay => (
                                      <button
                                        key={pay.id}
                                        onClick={() => fetchReceiptDetails(pay.id)}
                                        className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-sm hover:bg-slate-50 transition-colors"
                                        title={`View receipt for transaction ${pay.payment_id}`}
                                      >
                                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                                        {pay.payment_id.slice(-5)}
                                      </button>
                                    ))}

                                    {/* Soft delete invoice */}
                                    {userRole === 'Admin' && (
                                      <button
                                        onClick={() => handleSoftDeleteBill(bill.id)}
                                        className="text-rose-600 hover:text-rose-800 p-1.5 rounded bg-rose-50 hover:bg-rose-100 transition-colors"
                                        title="Cancel invoice"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}

                              {/* Create bill button for receptionist */}
                              {['Admin', 'Receptionist'].includes(userRole) && visitBills.length === 0 && (
                                <div className="border border-dashed border-slate-250 p-4 rounded-lg bg-slate-50/20 text-center">
                                  <p className="text-slate-400 text-xs mb-3">No bills generated for this visit. Open billing builder below.</p>
                                  
                                  {/* BILL BUILDER COMPONENT */}
                                  <div className="text-left bg-white border border-slate-200/80 rounded-xl p-4 space-y-4">
                                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                      <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Multi-Item Bill Creator</h5>
                                      <span className="text-[10px] text-teal-600 font-bold bg-teal-50 px-2 py-0.5 rounded">Active Catalog Linked</span>
                                    </div>

                                    {/* Service item selector */}
                                    <div className="flex gap-2 flex-wrap items-end">
                                      <div className="flex-1 min-w-[200px]">
                                        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Select Service</label>
                                        <select
                                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                                          value={selectedServiceId}
                                          onChange={(e) => setSelectedServiceId(e.target.value)}
                                        >
                                          <option value="">-- Choose from Catalog --</option>
                                          {availableServices.map(s => (
                                            <option key={s.id} value={s.id}>{s.category} ➔ {s.name} (₹{s.price})</option>
                                          ))}
                                        </select>
                                      </div>

                                      <div className="w-28">
                                        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Price Override</label>
                                        <input
                                          type="number"
                                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-750 focus:outline-none focus:border-teal-500"
                                          placeholder="Price (₹)"
                                          value={customItemPrice}
                                          onChange={(e) => setCustomItemPrice(e.target.value)}
                                        />
                                      </div>

                                      <button
                                        type="button"
                                        onClick={addBillItem}
                                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all h-8 flex items-center gap-1 shadow-sm"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                        Add
                                      </button>
                                    </div>

                                    {/* Active items list for this bill */}
                                    {billItems.length > 0 && (
                                      <div className="space-y-2 pt-2 border-t border-slate-100">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Bill Line Items</span>
                                        <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden bg-slate-50/30">
                                          {billItems.map((item, index) => (
                                            <div key={index} className="flex justify-between items-center py-2 px-3 text-xs">
                                              <div>
                                                <span className="font-semibold text-slate-800">{item.service_name}</span>
                                              </div>
                                              <div className="flex items-center gap-3">
                                                <span className="font-extrabold text-slate-900">₹{item.amount.toLocaleString()}</span>
                                                <button
                                                  onClick={() => removeBillItem(index)}
                                                  className="text-rose-600 hover:text-rose-800 transition-colors p-1"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>

                                        {/* Total Summary */}
                                        <div className="flex justify-between items-center pt-2 px-1">
                                          <div>
                                            <span className="text-xs text-slate-500">Subtotal:</span>
                                            <span className="font-extrabold text-slate-900 ml-2">₹{billItems.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</span>
                                          </div>
                                          <button
                                            onClick={() => handleCreateBill(vis.id)}
                                            className="bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm transition-all"
                                          >
                                            Generate Invoice
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {selectedPatient.visits?.length === 0 && (
                        <p className="text-center text-slate-400 text-xs py-4">No logged visits or consultations for this patient yet. Use the Log Visit panel above.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Register Patient Profile form (Right col) */}
            {['Admin', 'Receptionist'].includes(userRole) && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-teal-600" />
                  New Registration
                </h3>
                <form onSubmit={handleRegisterPatient} className="space-y-4">
                  <div>
                    <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Patient Full Name</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all font-medium"
                      placeholder="e.g. Rahul Sharma"
                      value={newPatient.name}
                      onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Age</label>
                      <input
                        type="number"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all font-medium"
                        placeholder="Age in Yrs"
                        value={newPatient.age}
                        onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Gender</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-teal-500 transition-all font-semibold text-slate-600"
                        value={newPatient.gender}
                        onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Mobile Number</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all font-medium"
                      placeholder="10-digit Phone"
                      value={newPatient.mobile_number}
                      onChange={(e) => setNewPatient({ ...newPatient, mobile_number: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Residential Address</label>
                    <textarea
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all font-medium h-20 resize-none"
                      placeholder="Street, City, pincode"
                      value={newPatient.address}
                      onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Save Patient Profile
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------
            TAB 3: BILLING & PAYMENT OPERATIONS (QUEUE)
            ---------------------------------------------------- */}
        {activeTab === 'billing_history' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start animate-in fade-in duration-300">
            {/* Left 2 Cols: Unpaid Bills Queue & Processing History */}
            <div className="xl:col-span-2 space-y-8">
              {/* Payment Processing Workspace */}
              {activeBillForPayment ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 animate-in slide-in-from-top-4 duration-300">
                  <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                    <div>
                      <span className="text-amber-600 font-bold text-xs uppercase tracking-wider font-sans">Payment Collection Workspace</span>
                      <h2 className="text-xl font-bold text-slate-900 mt-1">Invoice: {activeBillForPayment.bill_id}</h2>
                      <p className="text-slate-400 text-xs mt-1">
                        Patient Visit: <b>{activeBillForPayment.visit_id}</b> | Total Billed: <b>₹{activeBillForPayment.grand_total.toLocaleString()}</b>
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveBillForPayment(null)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-semibold bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Cancel Workspace
                    </button>
                  </div>

                  {/* Payment Details Form */}
                  <form onSubmit={handleRecordBillPayment} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Amount to Collect (₹)</label>
                        <input
                          type="number"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-teal-500 font-extrabold text-slate-950"
                          max={activeBillForPayment.balance_amount}
                          min="1"
                          value={paymentForm.amount_paid}
                          onChange={(e) => setPaymentForm({ ...paymentForm, amount_paid: e.target.value })}
                          required
                        />
                        <p className="text-[10px] text-slate-400 mt-1 font-semibold">Remaining balance due: ₹{activeBillForPayment.balance_amount.toLocaleString()}</p>
                      </div>

                      <div>
                        <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Payment Method</label>
                        <select
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-teal-500 font-semibold text-slate-600"
                          value={paymentForm.payment_method}
                          onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                        >
                          <option value="UPI">UPI</option>
                          <option value="Cash">Cash</option>
                          <option value="Card">Card</option>
                          <option value="Net Banking">Net Banking</option>
                          <option value="Wallet">Wallet</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Transaction Reference (UPI/Card Txn ID)</label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 font-medium"
                          placeholder="Reference string"
                          value={paymentForm.transaction_reference}
                          onChange={(e) => setPaymentForm({ ...paymentForm, transaction_reference: e.target.value })}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Process Payment (Generate Receipt & PDF)
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center">
                  <CreditCard className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm font-semibold">Select a Patient in Patient Desk tab to create bills, register visits, or select active balance queue invoices to process payments.</p>
                </div>
              )}

              {/* Complete Pending Dues Invoice Queue */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider text-slate-500">Unpaid / Partial Invoices Queue</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-150 text-slate-400 font-semibold text-xs">
                        <th className="py-3 px-4">Bill ID</th>
                        <th className="py-3 px-4">Patient Name</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Total</th>
                        <th className="py-3 px-4 text-right">Balance Due</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {patients.flatMap(pat => 
                        // Map patient visits bills which are not fully paid
                        (pat.history || []).filter(b => b.payment_status !== 'Paid').map(bill => (
                          <tr key={bill.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4 text-slate-900 font-bold text-xs">{bill.bill_id}</td>
                            <td className="py-3 px-4">{pat.name}</td>
                            <td className="py-3 px-4 text-slate-500 text-xs">{new Date(bill.created_at).toLocaleDateString()}</td>
                            <td className="py-3 px-4">
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                bill.payment_status === 'Partial Paid' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                'bg-rose-50 text-rose-700 border border-rose-100'
                              }`}>{bill.payment_status}</span>
                            </td>
                            <td className="py-3 px-4 text-right font-semibold">₹{bill.grand_total.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right font-extrabold text-rose-600">₹{bill.balance_amount.toLocaleString()}</td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => {
                                  setActiveBillForPayment(bill);
                                  setPaymentForm({
                                    amount_paid: bill.balance_amount.toString(),
                                    payment_method: 'UPI',
                                    transaction_reference: ''
                                  });
                                }}
                                className="bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-teal-100 transition-colors"
                              >
                                Pay
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                      {patients.flatMap(p => p.history || []).filter(b => b.payment_status !== 'Paid').length === 0 && (
                        <tr>
                          <td colSpan="7" className="py-8 text-center text-slate-400">All generated patient invoices are cleared and paid!</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Col: Issuing Refunds Panel */}
            <div className="space-y-8">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-rose-600" />
                  Refund Desk
                </h3>
                <form onSubmit={handleIssueRefund} className="space-y-4">
                  <div>
                    <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Source Transaction ID (PAY-xxx)</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all font-medium"
                      placeholder="PAY-YYYYMMDD-XXXXX"
                      value={refundForm.payment_id}
                      onChange={(e) => setRefundForm({ ...refundForm, payment_id: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Refund Amount (₹)</label>
                    <input
                      type="number"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all font-bold text-slate-900"
                      placeholder="Amount to return"
                      value={refundForm.amount_refunded}
                      onChange={(e) => setRefundForm({ ...refundForm, amount_refunded: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Reason for Refund</label>
                    <textarea
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all font-medium h-20 resize-none"
                      placeholder="e.g. Laboratory Test CBC Cancelled by Doctor"
                      value={refundForm.reason}
                      onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                      required
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Issue Refund Receipt
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            TAB 4: SERVICES CATALOG CATALOG (ADMIN ONLY)
            ---------------------------------------------------- */}
        {activeTab === 'catalog' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-in fade-in duration-300">
            {/* Services catalog list (Left 2 cols) */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider text-slate-500">Service Standards & Price Table</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-150 text-slate-400 font-semibold text-xs">
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Service Item Name</th>
                      <th className="py-3 px-4 text-right">Standard Price</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {services.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4">
                          <span className="bg-teal-50 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border border-teal-100">{s.category}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-900">{s.name}</td>
                        <td className="py-3 px-4 text-right font-extrabold text-slate-950">₹{s.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 text-center space-x-2">
                          <button
                            onClick={() => setEditingService(s)}
                            className="text-teal-650 hover:text-teal-800 text-xs font-bold bg-teal-50 px-2 py-1 rounded"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteService(s.id)}
                            className="text-rose-600 hover:text-rose-800 text-xs font-bold bg-rose-50 px-2 py-1 rounded"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Service Form container (Right col) */}
            <div className="space-y-8">
              {/* Editing Service */}
              {editingService ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-bold text-slate-900 text-lg mb-4">Edit Service Standards</h3>
                  <form onSubmit={handleUpdateService} className="space-y-4">
                    <div>
                      <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Category</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-teal-500 font-semibold text-slate-650"
                        value={editingService.category}
                        onChange={(e) => setEditingService({ ...editingService, category: e.target.value })}
                      >
                        <option value="Doctor Consultation">Doctor Consultation</option>
                        <option value="OPD Charges">OPD Charges</option>
                        <option value="IPD Charges">IPD Charges</option>
                        <option value="ICU Charges">ICU Charges</option>
                        <option value="Laboratory Tests">Laboratory Tests</option>
                        <option value="Radiology/X-Ray/MRI">Radiology/X-Ray/MRI</option>
                        <option value="Pharmacy/Medicines">Pharmacy/Medicines</option>
                        <option value="Other Hospital Services">Other Hospital Services</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Service Name</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all font-medium"
                        value={editingService.name}
                        onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Standard Pricing (₹)</label>
                      <input
                        type="number"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-teal-500 font-bold text-slate-900"
                        value={editingService.price}
                        onChange={(e) => setEditingService({ ...editingService, price: e.target.value })}
                        required
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-bold py-2.5 rounded-xl shadow-sm transition-all"
                      >
                        Save Updates
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingService(null)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold py-2.5 px-4 rounded-xl transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* New Service Form */
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-teal-600" />
                    Add Standard Service
                  </h3>
                  <form onSubmit={handleAddService} className="space-y-4">
                    <div>
                      <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Category</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-teal-500 font-semibold text-slate-650"
                        value={newService.category}
                        onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                      >
                        <option value="Doctor Consultation">Doctor Consultation</option>
                        <option value="OPD Charges">OPD Charges</option>
                        <option value="IPD Charges">IPD Charges</option>
                        <option value="ICU Charges">ICU Charges</option>
                        <option value="Laboratory Tests">Laboratory Tests</option>
                        <option value="Radiology/X-Ray/MRI">Radiology/X-Ray/MRI</option>
                        <option value="Pharmacy/Medicines">Pharmacy/Medicines</option>
                        <option value="Other Hospital Services">Other Hospital Services</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Service Name</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all font-medium"
                        placeholder="e.g. Ultrasound Abdomen PA View"
                        value={newService.name}
                        onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Standard Price (₹)</label>
                      <input
                        type="number"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 font-bold text-slate-900"
                        placeholder="e.g. 1500"
                        value={newService.price}
                        onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Add to Catalog List
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            TAB 5: STAFF ACCOUNTS (ADMIN ONLY)
            ---------------------------------------------------- */}
        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-in fade-in duration-300">
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider text-slate-500">Active Hospital User List</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-150 text-slate-400 font-semibold text-xs">
                      <th className="py-3 px-4">Username</th>
                      <th className="py-3 px-4">Full Name</th>
                      <th className="py-3 px-4">Role Access</th>
                      <th className="py-3 px-4">Created Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {staffUsers.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-bold text-slate-900">{u.username}</td>
                        <td className="py-3 px-4">{u.name}</td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            u.role === 'Admin' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                            u.role === 'Accountant' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            'bg-sky-50 text-sky-700 border border-sky-100'
                          }`}>{u.role}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-600" />
                Register Staff Account
              </h3>
              <form onSubmit={handleCreateStaffUser} className="space-y-4">
                <div>
                  <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Username</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all font-medium"
                    placeholder="e.g. ramesh_desk"
                    value={newUserForm.username}
                    onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Password</label>
                  <input
                    type="password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all font-medium"
                    placeholder="••••••••"
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Staff Role Permission</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-teal-500 font-semibold text-slate-650"
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  >
                    <option value="Receptionist">Receptionist (Front-Desk Desk)</option>
                    <option value="Accountant">Accountant (Payments & Receipts)</option>
                    <option value="Admin">System Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Staff Full Name</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition-all font-medium"
                    placeholder="e.g. Ramesh Kumar"
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Save User Account
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            TAB 6: SYSTEM AUDIT LOGS (ADMIN ONLY)
            ---------------------------------------------------- */}
        {activeTab === 'audit_logs' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-in fade-in duration-300">
            <h3 className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider text-slate-500">Security & Operational Logs Audit Table</h3>
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-150 text-slate-400 font-semibold text-xs sticky top-0 bg-white z-10">
                    <th className="py-3 px-4">Log ID</th>
                    <th className="py-3 px-4">Staff User</th>
                    <th className="py-3 px-4">Action Token</th>
                    <th className="py-3 px-4">Entity Table</th>
                    <th className="py-3 px-4">Entity ID</th>
                    <th className="py-3 px-4">Execution Timestamp</th>
                    <th className="py-3 px-4">Operation Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 text-slate-400 font-bold text-xs">{log.id}</td>
                      <td className="py-3 px-4 text-slate-950 font-bold">{log.user_name}</td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-800 text-xs px-2.5 py-0.5 rounded-md font-bold text-xs">{log.action}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-xs">{log.target_table}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-xs">{log.target_id}</td>
                      <td className="py-3 px-4 text-slate-450 text-xs">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="py-3 px-4 text-slate-600 font-normal max-w-xs truncate" title={log.details}>{log.details}</td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400">No actions recorded in audit trail.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            TAB 7: BRANDING & CUSTOM TEMPLATE SETTINGS (ADMIN ONLY)
            ---------------------------------------------------- */}
        {activeTab === 'settings' && (
          <div className="space-y-8 max-w-4xl animate-in fade-in duration-300">
            {/* Receipt Branding configurations */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 text-lg mb-4">Receipt Template Customization Panel</h3>
              <p className="text-slate-500 text-xs mb-6">Modify receipt layout attributes dynamically. Modifying these settings will immediately alter the logo text, header columns, doctor details, and payment lines printed on patient PDF receipts without modifying code.</p>
              
              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Hospital / Clinic Name</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-teal-500 font-bold"
                      value={adminSettingsForm.hospital_name || ''}
                      onChange={(e) => setAdminSettingsForm({ ...adminSettingsForm, hospital_name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Logo Text / Sub-tagline</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-teal-500 font-medium"
                      value={adminSettingsForm.logo_text || ''}
                      onChange={(e) => setAdminSettingsForm({ ...adminSettingsForm, logo_text: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Doctor Name (Left Header Block)</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-teal-500 font-bold"
                      value={adminSettingsForm.doctor_name || ''}
                      onChange={(e) => setAdminSettingsForm({ ...adminSettingsForm, doctor_name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Doctor Qualifications (Multiline Text)</label>
                    <textarea
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:bg-white focus:border-teal-500 font-medium h-24 resize-none"
                      value={adminSettingsForm.doctor_degree || ''}
                      onChange={(e) => setAdminSettingsForm({ ...adminSettingsForm, doctor_degree: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Address details (Right Header Block)</label>
                    <textarea
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:bg-white focus:border-teal-500 font-medium h-24 resize-none"
                      value={adminSettingsForm.collection_centre || ''}
                      onChange={(e) => setAdminSettingsForm({ ...adminSettingsForm, collection_centre: e.target.value })}
                    />
                  </div>

                  <div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">Hospital Tel / Contact Number</label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:bg-white focus:border-teal-500 font-semibold"
                          value={adminSettingsForm.contact_number || ''}
                          onChange={(e) => setAdminSettingsForm({ ...adminSettingsForm, contact_number: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">GST Registration Number</label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:bg-white focus:border-teal-500 font-mono"
                          value={adminSettingsForm.gst_number || ''}
                          onChange={(e) => setAdminSettingsForm({ ...adminSettingsForm, gst_number: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-teal-500 hover:bg-teal-600 text-white font-bold px-6 py-3 rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Apply Branding Configurations
                </button>
              </form>
            </div>

            {/* Manage Doctors Panel */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 text-lg mb-2">Hospital Doctors Directory</h3>
              <p className="text-slate-500 text-xs mb-6">Add, view, edit or remove consulting doctors active in the hospital. These doctors will be available in the visit pop-up selection when registering patient entries.</p>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left column: Doctors List */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="overflow-x-auto border border-slate-105 rounded-xl">
                    <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider">
                        <tr>
                          <th className="px-4 py-3">Doctor Name</th>
                          <th className="px-4 py-3">Qualifications / Degree</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-700">
                        {doctors.length === 0 ? (
                          <tr>
                            <td colSpan="3" className="px-4 py-8 text-center text-slate-400 italic">No doctors configured. Please add one using the form on the right.</td>
                          </tr>
                        ) : (
                          doctors.map(doc => (
                            <tr key={doc.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 font-bold text-slate-950">{doc.name}</td>
                              <td className="px-4 py-3 whitespace-pre-line text-slate-605">{doc.degree}</td>
                              <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                                <button
                                  onClick={() => setEditingDoctor(doc)}
                                  className="text-teal-650 hover:text-teal-850 font-bold bg-teal-50 px-2.5 py-1 rounded transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteDoctor(doc.id)}
                                  className="text-rose-600 hover:text-rose-800 font-bold bg-rose-50 px-2.5 py-1 rounded transition-colors"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right column: Form */}
                <div>
                  {editingDoctor ? (
                    <div className="border border-slate-200 rounded-xl p-4 space-y-4">
                      <h4 className="font-bold text-slate-900 text-sm">Edit Doctor Details</h4>
                      <form onSubmit={handleUpdateDoctor} className="space-y-4">
                        <div>
                          <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Doctor Name</label>
                          <input
                            type="text"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:bg-white focus:border-teal-500 font-bold"
                            value={editingDoctor.name}
                            onChange={(e) => setEditingDoctor({ ...editingDoctor, name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Qualifications / Degree (Multiline)</label>
                          <textarea
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:bg-white focus:border-teal-500 font-medium h-24 resize-none"
                            value={editingDoctor.degree}
                            onChange={(e) => setEditingDoctor({ ...editingDoctor, degree: e.target.value })}
                            required
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs py-2 rounded shadow transition-all"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingDoctor(null)}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold text-xs py-2 rounded transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl p-4 space-y-4">
                      <h4 className="font-bold text-slate-900 text-sm">Add New Doctor</h4>
                      <form onSubmit={handleAddDoctor} className="space-y-4">
                        <div>
                          <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Doctor Name</label>
                          <input
                            type="text"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:bg-white focus:border-teal-500 font-bold"
                            placeholder="e.g. Dr. Rajesh Kumar"
                            value={newDoctor.name}
                            onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Qualifications / Degree</label>
                          <textarea
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:bg-white focus:border-teal-500 font-medium h-24 resize-none"
                            placeholder="e.g. MBBS, MD (General Medicine)&#10;Consultant Cardiologist"
                            value={newDoctor.degree}
                            onChange={(e) => setNewDoctor({ ...newDoctor, degree: e.target.value })}
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs py-2 rounded shadow transition-all"
                        >
                          Add Doctor
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ----------------------------------------------------
          RECEIPT VISUALIZER MODAL
          (Strictly mimicking Vedam Diagnostics paper layout)
          ---------------------------------------------------- */}
      {viewingPayment && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 w-full max-w-3xl rounded-3xl shadow-2xl p-6 relative flex flex-col gap-6 animate-in zoom-in-95 duration-300">
            {/* Modal Control header (hidden in print) */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-150 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                <h4 className="font-bold text-slate-900 text-sm">Receipt Preview Window</h4>
              </div>
              <div className="flex gap-2">
                <a
                  href={`${STATIC_BASE}${viewingPayment.receipt?.pdf_path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Save PDF
                </a>
                <button
                  onClick={() => window.print()}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Receipt
                </button>
                <button
                  onClick={() => setViewingPayment(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-650 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            {/* THE PRINTABLE AREA (Strict replica of the target layout) */}
            <div className="overflow-x-auto -mx-6 px-6">
              <div id="printable-receipt-modal" className="min-w-[650px] bg-white p-4 font-sans text-xs text-slate-700 leading-relaxed border border-slate-100 shadow-inner rounded-2xl print:border-none print:shadow-none print:p-0 print:min-w-0">
                
                {/* Receipt Header Grid */}
                <div className="grid grid-cols-3 gap-4 pb-3 border-b border-teal-500/20 items-start">
                  
                  {/* Doctor Metadata Block */}
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 leading-none">
                      {viewingPayment.visit?.doctor?.name || viewingPayment.bill?.visit?.doctor?.name || systemSettings.doctor_name || 'Dr. Shweta Grover'}
                    </h4>
                    <div className="text-[8px] text-slate-500 mt-1 leading-normal whitespace-pre-line">
                      {viewingPayment.visit?.doctor?.degree || viewingPayment.bill?.visit?.doctor?.degree || systemSettings.doctor_degree || 'MBBS, MD (Pathology), PhD'}
                    </div>
                  </div>

                  {/* Logo & Document Title Label */}
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="flex items-center gap-1 text-teal-650 font-extrabold text-base leading-none">
                      <span>🏥</span>
                      <span>{systemSettings.hospital_name || 'Vedam Diagnostics'}</span>
                    </div>
                    <span className="text-[7px] text-slate-400 mt-0.5 tracking-wide">{systemSettings.logo_text || 'Sincere Care...'}</span>
                    <div className="border border-slate-900 text-slate-900 px-3 py-1 font-bold text-xs rounded uppercase mt-2 font-mono">
                      Receipt
                    </div>
                  </div>

                  {/* Hospital Address/Contacts Column */}
                  <div className="text-right text-[8px] text-slate-500 leading-normal whitespace-pre-line">
                    {systemSettings.collection_centre || '4 Harilok Saket Meerut'}
                    {systemSettings.gst_number && `\nGSTIN: ${systemSettings.gst_number}`}
                    {systemSettings.contact_number && `\nTel: ${systemSettings.contact_number}`}
                  </div>
                </div>

                {/* Date, Title, and ID row */}
                <div className="flex justify-between items-center py-2.5 border-b border-teal-600/30 font-bold text-[10px] text-slate-900">
                  <div>Dated: <span className="font-medium text-slate-700">{new Date(viewingPayment.payment_date).toLocaleString()}</span></div>
                  <div className="text-teal-600 uppercase tracking-widest text-xs">
                    {viewingPayment.payment_type === 'Advance' ? 'Advance Payment Receipt' :
                     viewingPayment.payment_type === 'Refund' ? 'Refund Receipt' :
                     'Payment Settlement slip'}
                  </div>
                  <div>No: <span className="font-mono text-slate-950 font-bold">{viewingPayment.receipt?.receipt_id || viewingPayment.payment_id}</span></div>
                </div>

                {/* Main Receipt Body fields */}
                <div className="space-y-4 py-4 text-xs font-semibold">
                  
                  {/* Received thanks field */}
                  <div className="flex border-b border-dashed border-slate-250 pb-2">
                    <span className="w-44 text-slate-500 uppercase tracking-wider text-[10px] font-bold">Received with thanks from :</span>
                    <span className="flex-1 text-slate-900 font-extrabold text-sm pl-2">
                      {viewingPayment.bill?.visit?.patient?.name || viewingPayment.visit?.patient?.name || 'N/A'}&nbsp;
                      <span className="text-xs font-medium text-slate-500">
                        ({viewingPayment.bill?.visit?.patient?.gender || viewingPayment.visit?.patient?.gender},&nbsp;
                        {viewingPayment.bill?.visit?.patient?.age || viewingPayment.visit?.patient?.age} Yrs)
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono ml-3 font-semibold">
                        [ID: {viewingPayment.bill?.visit?.patient?.patient_id || viewingPayment.visit?.patient?.patient_id || 'N/A'}]
                      </span>
                    </span>
                  </div>

                  {/* Sum words field */}
                  <div className="flex border-b border-dashed border-slate-250 pb-2">
                    <span className="w-44 text-slate-500 uppercase tracking-wider text-[10px] font-bold">A sum of Rs. :</span>
                    <span className="flex-1 pl-2 text-slate-900 italic font-bold">
                      {wordsFromNumber(Math.abs(viewingPayment.amount_paid))}
                    </span>
                  </div>

                  {/* Payment representation field */}
                  <div className="flex border-b border-dashed border-slate-250 pb-2">
                    <span className="w-44 text-slate-500 uppercase tracking-wider text-[10px] font-bold">As :</span>
                    <span className="flex-1 pl-2 text-slate-800 font-medium">
                      <span className="font-extrabold text-slate-950">{viewingPayment.payment_method}</span>
                      {viewingPayment.transaction_reference && ` (Ref Ref: ${viewingPayment.transaction_reference})`}
                      {viewingPayment.bill && ` for clear invoice ${viewingPayment.bill.bill_id}`}
                      {viewingPayment.bill?.items && ` containing: ${viewingPayment.bill.items.map(i => `${i.service_name} (₹${i.amount})`).join(', ')}`}
                      {viewingPayment.visit && ` as Advance Deposit for consult: ${viewingPayment.visit.visit_id}`}
                    </span>
                  </div>
                </div>

                {/* Bottom Row amount details & Signature */}
                <div className="flex justify-between items-end mt-4 pt-3">
                  {/* Bottom Left Cash Box */}
                  <div className="border-2 border-teal-500 bg-teal-50/20 px-6 py-2.5 rounded-xl font-mono text-center">
                    <span className="text-[9px] text-teal-600 font-bold uppercase block tracking-wider mb-0.5">Total Amount</span>
                    <span className="text-lg font-black text-teal-700">₹{Math.abs(viewingPayment.amount_paid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>

                  {/* Dues Audit Trail display */}
                  {viewingPayment.bill && (
                    <div className="text-[10px] text-rose-600 font-extrabold bg-rose-50 px-3 py-2 rounded-lg border border-rose-100 max-w-sm">
                      Dues details: Invoice Total: ₹{viewingPayment.bill.grand_total.toLocaleString()} | Total Paid: ₹{(viewingPayment.bill.grand_total - viewingPayment.bill.balance_amount).toLocaleString()} | Dues Remaining: ₹{viewingPayment.bill.balance_amount.toLocaleString()}
                    </div>
                  )}

                  {/* Signature Block */}
                  <div className="text-right pr-4 pb-1">
                    <div className="w-36 border-t border-slate-400 mt-8 mb-1"></div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider font-extrabold block">Authorized Signature</span>
                    <span className="text-[8px] text-slate-400">{systemSettings.hospital_name || 'Vedam Diagnostics'}</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          VISIT LOG POP-UP MODAL (DOCTOR SELECTION)
          ---------------------------------------------------- */}
      {showVisitModal && selectedPatient && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-250">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-100 mb-6">
              <div>
                <span className="text-teal-600 font-bold text-xs uppercase tracking-wider font-sans">New Consultation Entry</span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">Log Visit for {selectedPatient.name}</h3>
                <p className="text-slate-400 text-xs mt-1">Patient ID: <span className="font-semibold text-slate-700">{selectedPatient.patient_id}</span></p>
              </div>
              <button
                onClick={() => setShowVisitModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 bg-slate-50 hover:bg-slate-100 rounded-full"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={(e) => handleCreateVisit(e, selectedPatient.id)} className="space-y-6">
              <div>
                <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Reason for Visit / Reference</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 font-medium transition-all"
                  placeholder="e.g. Regular Pathology Test / Cardiology consultation"
                  value={newVisit.reason}
                  onChange={(e) => setNewVisit({ ...newVisit, reason: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Consulting Doctor</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white focus:border-teal-500 font-bold text-slate-800 transition-all cursor-pointer"
                  value={newVisitDoctorId}
                  onChange={(e) => setNewVisitDoctorId(e.target.value)}
                  required
                >
                  <option value="">-- Select Consulting Doctor --</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} ({doc.degree.split('\n')[0]})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                  The selected doctor's name and credentials will be printed on the generated receipt. If no doctor is selected, the receipt will use the default hospital details.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  Confirm & Log Visit
                </button>
                <button
                  type="button"
                  onClick={() => setShowVisitModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold py-3.5 rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
