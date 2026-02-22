import api from '@/services/api'

export default {
  getUserTasks(page = 1, pageSize = 10) {
    return api.get('/api/tasks/user', {
      params: { page, pageSize }
    })
  },

  getClubTasks(clubId, page = 1, pageSize = 10) {
    return api.get(`/api/tasks/club/${clubId}`, { 
      params: { page, pageSize } 
    })
  },
  
  getTaskDetails(taskId) {
    return api.get(`/api/tasks/${taskId}`)
  },

  createTask(clubId, formData) {
    return api.post(`/api/tasks/club/${clubId}/create`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  updateTaskDetails(taskId, data) {
    return api.put(`/api/tasks/${taskId}/details`, { taskId, ...data });
  },

  updateTaskReceivers(taskId, receiverIds) {
    return api.put(`/api/tasks/${taskId}/receivers`, { taskId, receiverIds });
  },

  deleteTask(clubId, taskId) {
    return api.delete(`/api/tasks/club/${clubId}/tasks/${taskId}`);
  },

  addAttachments(taskId, files) {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return api.post(`/api/tasks/${taskId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  submitResponse(taskId, text, files) {
    const formData = new FormData();
    if (text) {
      formData.append('Text', text);
    }
    if (files && files.length > 0) {
      files.forEach(file => formData.append('Files', file));
    }

    return api.post(`/api/tasks/${taskId}/respond`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  completeUserTask(userTaskId) {
    return api.put(`/api/tasks/${userTaskId}/complete`);
  }
}
