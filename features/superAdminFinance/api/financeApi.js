import api from '@/lib/api';

/**
 * Superadmin Finance API Service Layer
 * Interacts with /api/super-admin/finance endpoints.
 */

export const financeApi = {
  /**
   * Fetches lightweight sidebar counter badges.
   */
  async getNavCounts(includeTest = false) {
    const res = await api.get('/super-admin/finance/nav-counts', {
      params: { includeTest }
    });
    return res.data?.data;
  },

  /**
   * Fetches Accounting Overview stat cards and chart datasets.
   */
  async getOverview(params = {}) {
    const res = await api.get('/super-admin/finance/overview', { params });
    return res.data?.data;
  },

  /**
   * Fetches paginated Payments History with filters and sorting.
   */
  async getPayments(params = {}) {
    const res = await api.get('/super-admin/finance/payments', { params });
    return res.data?.data;
  },

  /**
   * Fetches single payment detail and duplicate analysis.
   */
  async getPaymentById(id) {
    const res = await api.get(`/super-admin/finance/payments/${id}`);
    return res.data?.data;
  },

  /**
   * Approves a payment proof.
   */
  async approvePayment(id, payload = {}) {
    const res = await api.post(`/super-admin/finance/payments/${id}/approve`, payload);
    return res.data;
  },

  /**
   * Rejects a payment proof.
   */
  async rejectPayment(id, payload = {}) {
    const res = await api.post(`/super-admin/finance/payments/${id}/reject`, payload);
    return res.data;
  },

  /**
   * Fetches per-college billing setups and summaries.
   */
  async getColleges(params = {}) {
    const res = await api.get('/super-admin/finance/colleges', { params });
    return res.data?.data;
  },

  /**
   * Fetches college billing detail, ledger, usage, and accountants.
   */
  async getCollegeById(id) {
    const res = await api.get(`/super-admin/finance/colleges/${id}`);
    return res.data?.data;
  },

  /**
   * Requests a plan change for a college.
   */
  async changePlan(id, payload) {
    const res = await api.post(`/super-admin/finance/colleges/${id}/change-plan`, payload);
    return res.data;
  },

  /**
   * Fetches accountants list with college coverage metrics.
   */
  async getAccountants(params = {}) {
    const res = await api.get('/super-admin/finance/accountants', { params });
    return res.data?.data;
  },

  /**
   * Downloads payments export as CSV.
   */
  async downloadExportCsv(params = {}) {
    const res = await api.get('/super-admin/finance/payments/export', {
      params,
      responseType: 'blob'
    });
    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
};

export default financeApi;

