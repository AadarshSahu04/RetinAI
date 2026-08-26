import axios from 'axios'

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/v1`,
  timeout: 60000,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred'
    return Promise.reject(new Error(message))
  }
)

export const predictDR = async (formData) => {
  const response = await api.post('/predict', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export const getPatients = async () => {
  const response = await api.get('/patients')
  return response.data
}

export const getPatient = async (id) => {
  const response = await api.get(`/patients/${id}`)
  return response.data
}

export const downloadReport = async (patientId, patientName) => {
  const response = await api.get(`/report/${patientId}`, {
    responseType: 'blob',
  })
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `DR_Report_${patientName.replace(/\s+/g, '_')}_${patientId}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export const deletePatient = async (id) => {
  await api.delete(`/patients/${id}`)
}

export default api
