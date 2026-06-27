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
  UserPlus,
  Wifi,
  RefreshCw,
  Database,
  Server,
  Check,
  Copy
} from 'lucide-react';
import DashboardTab from './components/DashboardTab';
import PatientSearchTab from './components/PatientSearchTab';
import BillingTab from './components/BillingTab';

import CatalogTab from './components/CatalogTab';
import UsersTab from './components/UsersTab';
import AuditLogsTab from './components/AuditLogsTab';
import SettingsTab from './components/SettingsTab';

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
  const [token, setToken] = useState(sessionStorage.getItem('token') || '');
  const [userRole, setUserRole] = useState(sessionStorage.getItem('role') || '');
  const [username, setUsername] = useState(sessionStorage.getItem('username') || '');
  const [name, setName] = useState(sessionStorage.getItem('name') || '');
  const [authError, setAuthError] = useState('');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dashboard Stats State
  const [metrics, setMetrics] = useState(null);
  const [metricsError, setMetricsError] = useState(null);

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
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [aiRecommendationsLoading, setAiRecommendationsLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');
  const [aiRecommenderVisitId, setAiRecommenderVisitId] = useState(null);


  // Payment Recording State
  const [activeBillForPayment, setActiveBillForPayment] = useState(null);
  const [unpaidBills, setUnpaidBills] = useState([]);
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
  const [syncQueue, setSyncQueue] = useState([]);

  const triggerSyncSimulation = (type, details) => {
    const syncId = Date.now();
    const newSync = {
      id: syncId,
      type,
      details,
      step: 1,
      title: type === 'deposit' ? 'Receptionist Advance Deposit' : 'Accountant Invoice Payment',
    };
    
    setSyncQueue(prev => [...prev, newSync]);
    
    // Transition to Step 2: DB block writing
    setTimeout(() => {
      setSyncQueue(prev => prev.map(item => item.id === syncId ? { ...item, step: 2 } : item));
    }, 1200);
    
    // Transition to Step 3: Successfully Synced
    setTimeout(() => {
      setSyncQueue(prev => prev.map(item => item.id === syncId ? { ...item, step: 3 } : item));
    }, 2800);
    
    // Auto dismiss sync block
    setTimeout(() => {
      setSyncQueue(prev => prev.filter(item => item.id !== syncId));
    }, 6500);
  };

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

  const getErrorMessage = (errorData, defaultMsg) => {
    if (!errorData) return defaultMsg;
    if (typeof errorData.detail === 'string') return errorData.detail;
    if (Array.isArray(errorData.detail)) {
      return errorData.detail.map(err => err.msg || JSON.stringify(err)).join(', ');
    }
    if (errorData.detail && typeof errorData.detail === 'object') {
      return errorData.detail.message || JSON.stringify(errorData.detail);
    }
    return errorData.message || defaultMsg;
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
      fetchUnpaidBills();
      if (userRole === 'Admin') {
        fetchAuditLogs();
        fetchStaffUsers();
      }
    }
  }, [token]);

  useEffect(() => {
    // Reset viewable components depending on tab change
    if (activeTab === 'dashboard') {
      setMetricsError(null); // clear previous error before fresh fetch
      fetchDashboardMetrics();
    }
    if (activeTab === 'catalog') fetchServices();
    if (activeTab === 'audit_logs') fetchAuditLogs();
    if (activeTab === 'users') fetchStaffUsers();
    if (activeTab === 'settings') fetchDoctors();
    if (activeTab === 'billing_history') fetchUnpaidBills();
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
      sessionStorage.setItem('token', data.access_token);
      sessionStorage.setItem('role', data.role);
      sessionStorage.setItem('username', data.username);
      sessionStorage.setItem('name', data.name);

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
    sessionStorage.clear();
    setToken('');
    setUserRole('');
    setUsername('');
    setName('');
    setActiveTab('dashboard');
  };

  const fetchDashboardMetrics = async () => {
    // Read directly from sessionStorage to avoid stale closure issues
    const currentRole = sessionStorage.getItem('role') || userRole;
    if (currentRole === 'Receptionist') return; // Receptionist doesn't have access to financials
    try {
      setMetricsError(null);
      const res = await fetch(`${API_BASE}/dashboard/metrics`, { headers: getHeaders() });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      } else {
        // API returned an error — set error state so dashboard shows error instead of spinner
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.detail || `Server error (${res.status})`;
        console.error("Dashboard metrics error:", errMsg);
        setMetricsError(errMsg);
      }
    } catch (err) {
      console.error("Error fetching dashboard metrics:", err);
      setMetricsError('Unable to connect to server. Check your network or backend status.');
    }
  };

  const fetchPatients = async (query = '') => {
    try {
      const url = query ? `${API_BASE}/patients?query=${encodeURIComponent(query)}` : `${API_BASE}/patients`;
      const res = await fetch(url, { headers: getHeaders() });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
      }
    } catch (err) {
      console.error("Error searching patients:", err);
    }
  };

  const fetchUnpaidBills = async () => {
    try {
      const res = await fetch(`${API_BASE}/bills`, { headers: getHeaders() });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        const unpaid = data.filter(b => b.payment_status !== 'Paid');
        setUnpaidBills(unpaid);
      }
    } catch (err) {
      console.error("Error fetching unpaid bills:", err);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await fetch(`${API_BASE}/services`, { headers: getHeaders() });
      if (res.status === 401) {
        handleLogout();
        return;
      }
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
      if (res.status === 401) {
        handleLogout();
        return;
      }
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
        throw new Error(getErrorMessage(errorData, "Failed to record advance"));
      }
      const payment = await res.json();
      showToast(`Advance payment recorded: ${payment.payment_id}`);
      triggerSyncSimulation('deposit', {
        amount: parseFloat(payment.amount_paid),
        method: payment.payment_method,
        reference: payment.payment_id,
        user: userRole || 'Receptionist',
      });
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

  const fetchAiRecommendations = async (visitId, symptoms) => {
    if (!symptoms || !symptoms.trim()) {
      showToast("Visit symptoms/reason is required to generate suggestions.", "warning");
      return;
    }
    setAiRecommendationsLoading(true);
    setAiExplanation('');
    setAiRecommendations([]);
    setAiRecommenderVisitId(visitId);
    try {
      const res = await fetch(`${API_BASE}/services/recommend`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          symptoms: symptoms
        })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(getErrorMessage(errorData, "Failed to fetch AI suggestions"));
      }
      const data = await res.json();
      setAiRecommendations(data.recommendations || []);
      setAiExplanation(data.explanation || '');
      showToast("AI Recommendations loaded!");
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setAiRecommendationsLoading(false);
    }
  };

  const addRecommendedItem = (item) => {
    if (billItems.some(bi => bi.service_id === item.service_id)) {
      showToast(`${item.service_name} is already in the bill.`, "warning");
      return;
    }
    setBillItems([...billItems, { service_id: item.service_id, service_name: item.service_name, amount: item.price }]);
    showToast(`Added ${item.service_name}`);
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
        throw new Error(getErrorMessage(errorData, "Failed to create bill"));
      }
      const bill = await res.json();
      showToast(`Bill generated: ${bill.bill_id}`);
      setBillItems([]);
      setAiRecommendations([]);
      setAiExplanation('');
      setAiRecommenderVisitId(null);
      handleSelectPatient(selectedPatient.id);
      fetchUnpaidBills();
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
        throw new Error(getErrorMessage(errorData, "Failed to record payment"));
      }
      const payment = await res.json();
      showToast(`Payment processed: ${payment.payment_id}`);
      triggerSyncSimulation('payment', {
        amount: parseFloat(payment.amount_paid),
        method: payment.payment_method,
        reference: payment.payment_id,
        user: userRole || 'Accountant',
      });
      setPaymentForm({ amount_paid: '', payment_method: 'UPI', transaction_reference: '' });
      setActiveBillForPayment(null);
      if (selectedPatient) handleSelectPatient(selectedPatient.id);
      fetchDashboardMetrics();
      fetchUnpaidBills();
      
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
        throw new Error(getErrorMessage(errorData, "Failed to process refund"));
      }
      const refund = await res.json();
      showToast(`Refund processed: ${refund.refund_id}`);
      setRefundForm({ payment_id: '', amount_refunded: '', reason: '' });
      if (selectedPatient) handleSelectPatient(selectedPatient.id);
      fetchDashboardMetrics();
      fetchUnpaidBills();
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
        throw new Error(getErrorMessage(errorData, "Failed to create user"));
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
      fetchUnpaidBills();
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
    const quickLogin = (u, p) => setLoginForm({ username: u, password: p });

    return (
      <div className="min-h-screen bg-[#060c18] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute w-[600px] h-[600px] rounded-full orb-float-1 pointer-events-none" style={{background:'radial-gradient(circle, rgba(20,184,166,0.18) 0%, transparent 70%)', top:'-15%', left:'-10%'}} />
        <div className="absolute w-[500px] h-[500px] rounded-full orb-float-2 pointer-events-none" style={{background:'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)', bottom:'-10%', right:'-5%'}} />
        <div className="absolute w-[350px] h-[350px] rounded-full orb-float-3 pointer-events-none" style={{background:'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)', top:'40%', right:'20%'}} />

        {/* Subtle grid overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{backgroundImage:'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize:'48px 48px'}} />

        <div className="relative z-10 w-full max-w-md animate-slide-up">
          {/* Main glass card */}
          <div className="glass-card p-8 rounded-3xl" style={{border:'1px solid rgba(20,184,166,0.18)'}}>
            {/* Logo */}
            <div className="flex flex-col items-center mb-7">
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center animate-pulse-teal" style={{background:'linear-gradient(135deg, #14b8a6, #34d399)'}}>
                  <Activity className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#060c18] animate-pulse" />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white">HospiSyn<span className="gradient-text-teal">AI</span></h1>
              <p className="text-slate-400 text-xs mt-1 text-center">Hospital Billing · Receipts · AI Clinical Assistant</p>
            </div>

            {/* Quick demo login buttons */}
            <div className="mb-6">
              <p className="text-slate-500 text-[10px] uppercase tracking-widest text-center mb-3">⚡ Quick Demo Login</p>
              <div className="grid grid-cols-3 gap-2">
                {[['Receptionist','recep123','bg-teal-500/10 border-teal-500/20 text-teal-300 hover:bg-teal-500/20'],
                  ['Accountant','acct123','bg-violet-500/10 border-violet-500/20 text-violet-300 hover:bg-violet-500/20'],
                  ['Admin','admin123','bg-amber-500/10 border-amber-500/20 text-amber-300 hover:bg-amber-500/20']
                ].map(([role, pass, cls]) => (
                  <button key={role} type="button"
                    onClick={() => quickLogin(role.toLowerCase(), pass)}
                    className={`border rounded-xl py-2 px-1 text-[10px] font-bold uppercase tracking-wider transition-all ${cls}`}>
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {authError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Username</label>
                <input type="text"
                  className="w-full rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all text-sm font-medium"
                  style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)'}}
                  placeholder="receptionist / accountant / admin"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  required />
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Password</label>
                <input type="password"
                  className="w-full rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all text-sm font-medium"
                  style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)'}}
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required />
              </div>

              <button type="submit"
                className="w-full font-bold py-3.5 rounded-xl text-white text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                style={{background:'linear-gradient(135deg, #14b8a6, #0d9488)', boxShadow:'0 4px 20px rgba(20,184,166,0.3)'}}>
                <Lock className="w-4 h-4" />
                Secure Sign In
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-2 text-slate-600 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Encrypted · Audited · RBAC Protected</span>
            </div>
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
      {/* Toast Alert - Rich version with progress bar */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 min-w-[300px] max-w-sm rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up ${
          toast.type === 'success' ? 'bg-slate-900 border border-emerald-500/20'
          : toast.type === 'warning' ? 'bg-slate-900 border border-amber-500/20'
          : 'bg-slate-900 border border-rose-500/20'
        }`}>
          <div className="flex items-start gap-3 p-4">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
              toast.type === 'success' ? 'bg-emerald-500/15' : toast.type === 'warning' ? 'bg-amber-500/15' : 'bg-rose-500/15'
            }`}>
              {toast.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> :
               toast.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-400" /> :
               <AlertTriangle className="w-4 h-4 text-rose-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${
                toast.type === 'success' ? 'text-emerald-400' : toast.type === 'warning' ? 'text-amber-400' : 'text-rose-400'
              }`}>{toast.type === 'success' ? 'Success' : toast.type === 'warning' ? 'Notice' : 'Error'}</p>
              <p className="text-white text-sm font-medium leading-snug">{toast.message}</p>
            </div>
          </div>
          <div className={`toast-progress ${
            toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'warning' ? 'bg-amber-500' : 'bg-rose-500'
          }`} />
        </div>
      )}

      {/* Real-time Ledger Sync Notifications Grid */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {syncQueue.map((sync) => (
          <div
            key={sync.id}
            className="pointer-events-auto bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-xl p-4 flex flex-col gap-2.5 translate-y-0 opacity-100 transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in duration-300"
          >
            {/* Header: Title and Status Icon */}
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Wifi className={`w-3.5 h-3.5 ${sync.step === 3 ? 'text-emerald-500' : 'text-teal-500 animate-pulse'}`} />
                {sync.title}
              </span>
              <span className="text-[10px] text-slate-500 font-extrabold bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wide">
                Role: {sync.details.user}
              </span>
            </div>

            {/* Sync Progress Indicator bar */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  sync.step === 1 ? 'w-1/3 bg-amber-500 animate-pulse' :
                  sync.step === 2 ? 'w-2/3 bg-teal-500 animate-pulse' :
                  'w-full bg-emerald-500'
                }`}
              ></div>
            </div>

            {/* Details & Live Updates */}
            <div className="flex items-start gap-3 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50">
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-extrabold text-slate-800">₹{sync.details.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  <span className="text-[10px] text-slate-400 font-mono">Ref: {sync.details.reference.slice(-6)}</span>
                </div>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Method: {sync.details.method}</p>
              </div>
            </div>

            {/* Dynamic Step Message */}
            <div className="flex items-center gap-2 text-xs font-bold">
              {sync.step === 1 && (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                  <span className="text-amber-700">Broadcasting transaction ledger packet...</span>
                </>
              )}
              {sync.step === 2 && (
                <>
                  <Database className="w-3.5 h-3.5 text-teal-500 animate-pulse" />
                  <span className="text-teal-700">Securing block & writing changes to database...</span>
                </>
              )}
              {sync.step === 3 && (
                <>
                  <div className="w-4 h-4 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                  </div>
                  <span className="text-emerald-700">Synced! Central Ledger database updated.</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Top Bar */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
            <Activity className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-white font-bold text-base font-sans tracking-tight">HospiSynAI</span>
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

      {/* Sidebar Navigation — Premium Version */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col justify-between flex-shrink-0 transition-transform duration-300 transform md:translate-x-0 md:static md:h-auto md:w-64 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`} style={{background:'#080d1a', borderRight:'1px solid rgba(255,255,255,0.06)'}}>
        <div>
          {/* Logo & Header */}
          <div className="p-6 flex items-center gap-3" style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center animate-pulse-teal flex-shrink-0" style={{background:'linear-gradient(135deg,#14b8a6,#34d399)'}}>
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-black text-base tracking-tight">HospiSyn<span className="gradient-text-teal">AI</span></h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  userRole === 'Admin' ? 'bg-amber-500/15 text-amber-400'
                  : userRole === 'Accountant' ? 'bg-violet-500/15 text-violet-400'
                  : 'bg-teal-500/15 text-teal-400'
                }`}>{userRole}</span>
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="p-3 space-y-1">
            {/* Dashboard — Admin & Accountant */}
            {userRole !== 'Receptionist' && (
              <button
                onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                  activeTab === 'dashboard'
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                style={activeTab === 'dashboard' ? {background:'linear-gradient(90deg, rgba(20,184,166,0.2), rgba(20,184,166,0.05))', borderLeft:'3px solid #14b8a6', paddingLeft:'9px'} : {}}
              >
                <Grid className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${activeTab === 'dashboard' ? 'text-teal-400' : ''}`} />
                Dashboard
                {activeTab === 'dashboard' && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400" />}
              </button>
            )}

            {/* Patient Desk */}
            {['Admin', 'Receptionist', 'Accountant'].includes(userRole) && (
              <button
                onClick={() => { setActiveTab('search_register'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                  activeTab === 'search_register'
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                style={activeTab === 'search_register' ? {background:'linear-gradient(90deg, rgba(20,184,166,0.2), rgba(20,184,166,0.05))', borderLeft:'3px solid #14b8a6', paddingLeft:'9px'} : {}}
              >
                <Search className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${activeTab === 'search_register' ? 'text-teal-400' : ''}`} />
                Patient Search & Desk
                {/* AI badge */}
                <span className="ml-auto flex items-center gap-1 bg-violet-500/15 text-violet-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  <span className="w-1 h-1 rounded-full bg-violet-400 animate-pulse" />AI
                </span>
              </button>
            )}

            {/* Billing Queue */}
            {['Admin', 'Accountant'].includes(userRole) && (
              <button
                onClick={() => { setActiveTab('billing_history'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                  activeTab === 'billing_history'
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                style={activeTab === 'billing_history' ? {background:'linear-gradient(90deg, rgba(20,184,166,0.2), rgba(20,184,166,0.05))', borderLeft:'3px solid #14b8a6', paddingLeft:'9px'} : {}}
              >
                <CreditCard className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${activeTab === 'billing_history' ? 'text-teal-400' : ''}`} />
                Billing Queue
                {activeTab === 'billing_history' && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400" />}
              </button>
            )}

            {/* Admin only */}
            {userRole === 'Admin' && (
              <>
                <div className="pt-3 pb-1 px-3">
                  <p className="text-slate-600 text-[9px] font-bold uppercase tracking-widest">Administration</p>
                </div>
                {[['catalog','Services Catalog', FileText],
                  ['users','Staff Accounts', UserPlus],
                  ['audit_logs','Audit Logs', History],
                  ['settings','Hospital Settings', SettingsIcon]
                ].map(([tab, label, Icon]) => (
                  <button key={tab}
                    onClick={() => { setActiveTab(tab); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                      activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                    }`}
                    style={activeTab === tab ? {background:'linear-gradient(90deg, rgba(20,184,166,0.2), rgba(20,184,166,0.05))', borderLeft:'3px solid #14b8a6', paddingLeft:'9px'} : {}}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${activeTab === tab ? 'text-teal-400' : ''}`} />
                    {label}
                    {activeTab === tab && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400" />}
                  </button>
                ))}
              </>
            )}
          </nav>
        </div>

        {/* User Footer Profile */}
        <div className="p-4" style={{borderTop:'1px solid rgba(255,255,255,0.06)'}}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-teal-300 font-black text-sm" style={{background:'rgba(20,184,166,0.12)'}}>
                {name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-bold leading-none truncate">{name}</p>
                <span className="text-slate-500 text-[10px] leading-none block mt-0.5 truncate">{userRole}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-full md:max-h-screen" style={{background:'#f0f4f8'}}>
        {/* HEADER BAR */}
        <header className="sticky top-0 z-30 px-6 md:px-10 py-4 flex items-center justify-between gap-4 backdrop-blur-md"
          style={{background:'rgba(240,244,248,0.85)', borderBottom:'1px solid rgba(0,0,0,0.06)'}}>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
              {activeTab === 'dashboard' && 'Dashboard Overview'}
              {activeTab === 'search_register' && 'Patient Desk'}
              {activeTab === 'billing_history' && 'Billing Operations'}
              {activeTab === 'catalog' && 'Services Catalog'}
              {activeTab === 'users' && 'Staff Accounts'}
              {activeTab === 'audit_logs' && 'Audit Trail'}
              {activeTab === 'settings' && 'Hospital Settings'}
            </h1>
            <p className="text-slate-400 text-xs font-medium mt-0.5">
              {activeTab === 'dashboard' && 'Real-time financial summary • AI-powered insights'}
              {activeTab === 'search_register' && 'Search, register patients, log visits, AI clinical assistant'}
              {activeTab === 'billing_history' && 'Process bills, clear balances, manage advances'}
              {activeTab === 'catalog' && 'Edit service names, categories, and pricing'}
              {activeTab === 'users' && 'Create and manage staff roles and credentials'}
              {activeTab === 'audit_logs' && 'Chronological record of all system actions'}
              {activeTab === 'settings' && 'Hospital branding for receipt PDF rendering'}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Live badge */}
            <div className="hidden sm:flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-500 text-[11px] font-bold">
                {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </header>

        {/* Page content padding */}
        <div className="p-6 md:p-8">

        {/* ----------------------------------------------------
            TAB 1: DASHBOARD
            ---------------------------------------------------- */}
        {activeTab === 'dashboard' && (
          <DashboardTab
            metrics={metrics}
            metricsError={metricsError}
            API_BASE={API_BASE}
            fetchReceiptDetails={fetchReceiptDetails}
          />
        )}


        {/* ----------------------------------------------------
            TAB 2: PATIENT SEARCH & REGISTER DESK
            ---------------------------------------------------- */}
        {activeTab === 'search_register' && (
          <PatientSearchTab
            API_BASE={API_BASE}
            getHeaders={getHeaders}
            showToast={showToast}
            adminSettingsForm={adminSettingsForm}
            userRole={userRole}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            patients={patients}
            selectedPatient={selectedPatient}
            patientHistory={patientHistory}
            newPatient={newPatient}
            setNewPatient={setNewPatient}
            newAdvancePayment={newAdvancePayment}
            setNewAdvancePayment={setNewAdvancePayment}
            billItems={billItems}
            setBillItems={setBillItems}
            availableServices={availableServices}
            selectedServiceId={selectedServiceId}
            setSelectedServiceId={setSelectedServiceId}
            customItemPrice={customItemPrice}
            setCustomItemPrice={setCustomItemPrice}
            aiRecommendations={aiRecommendations}
            setAiRecommendations={setAiRecommendations}
            aiRecommendationsLoading={aiRecommendationsLoading}
            setAiRecommendationsLoading={setAiRecommendationsLoading}
            aiExplanation={aiExplanation}
            setAiExplanation={setAiExplanation}
            aiRecommenderVisitId={aiRecommenderVisitId}
            setAiRecommenderVisitId={setAiRecommenderVisitId}
            fetchPatients={fetchPatients}
            handleSelectPatient={handleSelectPatient}
            handleSoftDeletePatient={handleSoftDeletePatient}
            setNewVisit={setNewVisit}
            setNewVisitDoctorId={setNewVisitDoctorId}
            setShowVisitModal={setShowVisitModal}
            handleRecordAdvance={handleRecordAdvance}
            handleSoftDeleteBill={handleSoftDeleteBill}
            setActiveBillForPayment={setActiveBillForPayment}
            setPaymentForm={setPaymentForm}
            setActiveTab={setActiveTab}
            fetchReceiptDetails={fetchReceiptDetails}
            fetchAiRecommendations={fetchAiRecommendations}
            addRecommendedItem={addRecommendedItem}
            addBillItem={addBillItem}
            removeBillItem={removeBillItem}
            handleRegisterPatient={handleRegisterPatient}
            handleCreateBill={handleCreateBill}
          />
        )}

        {/* ----------------------------------------------------
            TAB 3: BILLING & PAYMENT OPERATIONS (QUEUE)
            ---------------------------------------------------- */}
        {activeTab === 'billing_history' && (
          <BillingTab
            userRole={userRole}
            activeBillForPayment={activeBillForPayment}
            setActiveBillForPayment={setActiveBillForPayment}
            paymentForm={paymentForm}
            setPaymentForm={setPaymentForm}
            unpaidBills={unpaidBills}
            refundForm={refundForm}
            setRefundForm={setRefundForm}
            handleRecordBillPayment={handleRecordBillPayment}
            handleIssueRefund={handleIssueRefund}
          />
        )}

        {/* ----------------------------------------------------
            TAB 4: SERVICES CATALOG CATALOG (ADMIN ONLY)
            ---------------------------------------------------- */}
        {activeTab === 'catalog' && (
          <CatalogTab
            services={services}
            editingService={editingService}
            setEditingService={setEditingService}
            newService={newService}
            setNewService={setNewService}
            handleDeleteService={handleDeleteService}
            handleUpdateService={handleUpdateService}
            handleAddService={handleAddService}
          />
        )}

        {/* ----------------------------------------------------
            TAB 5: STAFF ACCOUNTS (ADMIN ONLY)
            ---------------------------------------------------- */}
        {activeTab === 'users' && (
          <UsersTab
            staffUsers={staffUsers}
            newUserForm={newUserForm}
            setNewUserForm={setNewUserForm}
            handleCreateStaffUser={handleCreateStaffUser}
          />
        )}

        {/* ----------------------------------------------------
            TAB 6: SYSTEM AUDIT LOGS (ADMIN ONLY)
            ---------------------------------------------------- */}
        {activeTab === 'audit_logs' && (
          <AuditLogsTab auditLogs={auditLogs} />
        )}

        {/* ----------------------------------------------------
            TAB 7: BRANDING & CUSTOM TEMPLATE SETTINGS (ADMIN ONLY)
            ---------------------------------------------------- */}
        {activeTab === 'settings' && (
          <SettingsTab
            adminSettingsForm={adminSettingsForm}
            setAdminSettingsForm={setAdminSettingsForm}
            doctors={doctors}
            editingDoctor={editingDoctor}
            setEditingDoctor={setEditingDoctor}
            newDoctor={newDoctor}
            setNewDoctor={setNewDoctor}
            handleSaveSettings={handleSaveSettings}
            handleDeleteDoctor={handleDeleteDoctor}
            handleUpdateDoctor={handleUpdateDoctor}
            handleAddDoctor={handleAddDoctor}
          />
        )}
        </div>
      </main>

      {/* ----------------------------------------------------
          RECEIPT VISUALIZER MODAL
          (Strictly mimicking Vedam Diagnostics paper layout)
          ---------------------------------------------------- */}
      {viewingPayment && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 w-full max-w-3xl rounded-3xl shadow-2xl p-6 relative flex flex-col gap-6 animate-in zoom-in-95 duration-300">
            {/* Modal Control header (hidden in print) */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 print:hidden">
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
                    <div className="flex items-center gap-1 text-teal-600 font-extrabold text-base leading-none">
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
                  <div className="text-right">
                    <div>Receipt No: <span className="font-mono text-slate-950 font-bold">{viewingPayment.receipt?.receipt_id || 'N/A'}</span></div>
                    {viewingPayment.payment_id && (
                      <div className="text-[9px] text-slate-500 font-normal mt-0.5 flex items-center justify-end gap-1">
                        <span>Payment ID:</span>
                        <span className="font-mono text-slate-800 font-bold select-all">{viewingPayment.payment_id}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(viewingPayment.payment_id);
                          }}
                          className="text-slate-400 hover:text-slate-600 p-0.5 rounded hover:bg-slate-150 transition-colors"
                          title="Copy Payment ID"
                        >
                          <Copy className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Main Receipt Body fields */}
                <div className="space-y-4 py-4 text-xs font-semibold">
                  
                  {/* Received thanks field */}
                  <div className="flex border-b border-dashed border-slate-300 pb-2">
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
                  <div className="flex border-b border-dashed border-slate-300 pb-2">
                    <span className="w-44 text-slate-500 uppercase tracking-wider text-[10px] font-bold">A sum of Rs. :</span>
                    <span className="flex-1 pl-2 text-slate-900 italic font-bold">
                      {wordsFromNumber(Math.abs(viewingPayment.amount_paid))}
                    </span>
                  </div>

                  {/* Payment representation field */}
                  <div className="flex border-b border-dashed border-slate-300 pb-2">
                    <span className="w-44 text-slate-500 uppercase tracking-wider text-[10px] font-bold">As :</span>
                    <span className="flex-1 pl-2 text-slate-800 font-medium truncate">
                      <span className="font-extrabold text-slate-950">{viewingPayment.payment_method}</span>
                      {viewingPayment.transaction_reference && ` (Ref: ${viewingPayment.transaction_reference})`}
                      {viewingPayment.bill && ` for invoice ${viewingPayment.bill.bill_id}`}
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
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
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
