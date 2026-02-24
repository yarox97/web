// src/modules/payslips/services/payslipService.js
import api from '@/services/api';

export default {
  // Старый метод (оставьте его, он используется для общего чарта в профиле)
  getMyPayslips(page = 1, pageSize = 5) {
    return api.get(`/api/payslips/my?page=${page}&pageSize=${pageSize}`);
  },
  
  // НОВЫЙ МЕТОД для конкретного контракта
  getContractPayslips(contractId, page = 1, pageSize = 5) {
    return api.get(`/api/payslips/contract/${contractId}/my?page=${page}&pageSize=${pageSize}`);
  }
}