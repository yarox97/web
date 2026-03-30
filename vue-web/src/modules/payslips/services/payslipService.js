// src/modules/payslips/services/payslipService.js
import api from '@/services/api';

export default {
  getMyPayslips(page = 1, pageSize = 5) {
    return api.get(`/api/payslips/my?page=${page}&pageSize=${pageSize}`);
  },
  
  getContractPayslips(contractId, page = 1, pageSize = 5) {
    return api.get(`/api/payslips/contract/${contractId}/my?page=${page}&pageSize=${pageSize}`);
  }
}