import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, FileText, Calendar, User, Search, Loader, X, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import logo from '../../assets/logo.png';
import ConfirmationModal from '../../components/ConfirmationModal';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    tenantId: '',
    amount: '',
    description: '',
    dueDate: ''
  });

  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Confirmation Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [invoiceToPay, setInvoiceToPay] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invoicesRes, tenantsRes] = await Promise.all([
        api.get('/invoices'),
        api.get('/tenants')
      ]);
      setInvoices(invoicesRes.data);
      setTenants(tenantsRes.data.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.tenantId || !formData.amount || !formData.dueDate) {
      return toast.error("Please fill all required fields");
    }

    try {
      setSubmitting(true);
      await api.post('/invoices', formData);
      toast.success("Invoice created successfully");
      setShowModal(false);
      setFormData({ tenantId: '', amount: '', description: '', dueDate: '' });
      fetchData(); // Refresh list
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to create invoice");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Invoices</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage and track tenant payments</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
        >
          <Plus size={20} /> Create Invoice
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader className="animate-spin text-indigo-600" size={32} />
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-12 text-center transition-colors duration-200">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No invoices yet</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">Create your first invoice to start tracking payments.</p>
          <button
            onClick={() => setShowModal(true)}
            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline"
          >
            Create Manual Invoice
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200 text-sm">Invoice #</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200 text-sm">Tenant</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200 text-sm">Date</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200 text-sm">Amount</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200 text-sm">Status</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200 text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoices.map((parsedInvoice) => (
                  <tr key={parsedInvoice._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      {parsedInvoice.invoiceNumber}
                      <div className="text-xs text-slate-500 font-normal mt-0.5">{parsedInvoice.items[0]?.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300">
                          <User size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{parsedInvoice.tenant?.name || 'Unknown'}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{parsedInvoice.tenant?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">
                      {format(new Date(parsedInvoice.dueDate), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      LKR {parsedInvoice.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${parsedInvoice.status === 'paid' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                          parsedInvoice.status === 'overdue' ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400' :
                            'bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400'}`}>
                        {parsedInvoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedInvoice(parsedInvoice)}
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create New Invoice</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Select Tenant</label>
                <select
                  value={formData.tenantId}
                  onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  required
                >
                  <option value="">Select a tenant...</option>
                  {tenants.map(t => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.roomId ? `Room ${t.roomId}` : 'No Room'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount (LKR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <DollarSign size={16} />
                  </span>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full pl-9 p-2.5 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="0.00"
                    required
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="e.g. Monthly Rent - March"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  required
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {submitting ? <Loader size={18} className="animate-spin" /> : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 print-only border border-slate-200 dark:border-slate-800">
            {/* Header with Primary Color and Logo */}
            <div className="bg-indigo-600 p-6 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="bg-white p-1.5 rounded-lg">
                  <img src={logo} alt="BodimGo" className="h-8 w-auto" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">BodimGo Invoice</h3>
                  <p className="text-indigo-100 text-xs text-opacity-80">#{selectedInvoice.invoiceNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-white/70 hover:text-white hover:bg-white/10 p-1 rounded transition-colors print-hidden"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {/* Date & Status Row */}
              <div className="flex justify-between items-center mb-6 text-sm">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Date Issued</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{format(new Date(selectedInvoice.createdAt), 'MMM dd, yyyy')}</p>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                      ${selectedInvoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                      selectedInvoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'}`}>
                    {selectedInvoice.status}
                  </div>
                </div>
              </div>

              {/* Bill To / From Section */}
              <div className="flex justify-between mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Billed To</p>
                  <h5 className="font-bold text-slate-900 dark:text-white text-lg">{selectedInvoice.tenant?.name || 'Unknown Tenant'}</h5>
                  <div className="text-slate-500 dark:text-slate-400 text-sm mt-1 space-y-0.5">
                    <p>{selectedInvoice.tenant?.phone}</p>
                    {selectedInvoice.tenant?.roomId && <p className="font-medium text-slate-700 dark:text-slate-300">Room {selectedInvoice.tenant.roomId}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pay To</p>
                  <h5 className="font-bold text-slate-900 dark:text-white text-lg">Property Provider</h5>
                  <div className="text-slate-500 dark:text-slate-400 text-sm mt-1 space-y-0.5">
                    <p>BodimGo Platform</p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-6">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="py-2 text-left font-medium text-slate-500 dark:text-slate-400">Description</th>
                      <th className="py-2 text-right font-medium text-slate-500 dark:text-slate-400">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {selectedInvoice.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-3 text-slate-700 dark:text-slate-300">{item.description}</td>
                        <td className="py-3 text-right font-medium text-slate-900 dark:text-white">LKR {item.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-slate-100 dark:border-slate-800">
                    <tr>
                      <td className="py-3 font-bold text-slate-900 dark:text-white">Total</td>
                      <td className="py-3 text-right font-bold text-indigo-600 dark:text-indigo-400 text-base">LKR {selectedInvoice.totalAmount.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Footer Actions */}
              <div className="flex gap-3 mt-2 print-hidden">
                <button
                  onClick={() => window.print()}
                  className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <FileText size={16} /> Print
                </button>

                {selectedInvoice.status !== 'paid' && (
                  <button
                    onClick={() => {
                      setInvoiceToPay(selectedInvoice);
                      setIsPayModalOpen(true);
                    }}
                    className="flex-1 bg-green-600 text-white hover:bg-green-700 py-2.5 rounded-lg font-medium text-sm transition-colors"
                  >
                    Record Payment
                  </button>
                )}

                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 py-2.5 rounded-lg font-medium text-sm transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isPayModalOpen}
        title="Mark Invoice as Paid"
        message="Are you sure you want to mark this invoice as PAID? This action cannot be undone."
        confirmText="Confirm Payment"
        cancelText="Cancel"
        isDanger={false}
        onConfirm={async () => {
          if (!invoiceToPay) return;
          try {
            await api.put(`/invoices/${invoiceToPay._id}/pay`);
            toast.success('Invoice marked as paid');
            setIsPayModalOpen(false);
            setInvoiceToPay(null);
            setSelectedInvoice(null);
            fetchData();
          } catch (error) {
            console.error(error);
            toast.error('Failed to update status');
            setIsPayModalOpen(false);
          }
        }}
        onCancel={() => {
          setIsPayModalOpen(false);
          setInvoiceToPay(null);
        }}
      />
    </div>
  );
}
