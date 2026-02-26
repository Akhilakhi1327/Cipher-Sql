import axios from 'axios';

const backendConnect = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
});

export const fetchAssignmentsList = () => backendConnect.get('/assignments');
export const fetchSingleAssignment = (id) => backendConnect.get(`/assignments/${id}`);
export const submitStudentSql = (sqlBody) => backendConnect.post('/assignments/run-sql', sqlBody);
export const requestAiHelp = (hintData) => backendConnect.post('/assignments/ai-hint', hintData);
