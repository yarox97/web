import api from '@/services/api'

export const contractsService = {
  async getMyContracts(pageNumber, pageSize) {
    const response = await api.get('/api/contracts/user/my-contracts', {
      params: { pageNumber, pageSize }
    });
    return response.data;
  },

  async getContractById(contractId) {
    const response = await api.get(`/api/contracts/${contractId}`);
    return response.data;
  },

  endContract(id) {
    return api.put(`/api/contracts/end-contract/${id}`);
  }
}