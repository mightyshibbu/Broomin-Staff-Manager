import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Helper function to convert data to CSV format
const convertToCSV = (data: any[]) => {
  if (data.length === 0) return '';
  
  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV header
  let csv = headers.join(',') + '\n';
  
  // Add rows
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header] || '';
      // Escape quotes and wrap in quotes if contains comma or newline
      const escaped = ('' + value).replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csv += values.join(',') + '\n';
  });
  
  return csv;
};

export interface AttendanceRecord {
  id?: number;
  employee_id: string;
  date: string;
  status: 'present' | 'absent' | 'half_day' | 'leave';
  check_in?: string;
  check_out?: string;
  notes?: string;
}

export const markAttendance = async (attendance: AttendanceRecord) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/attendance`, {
      ...attendance,
      id: attendance.id // Will be undefined for new records
    });
    return response.data;
  } catch (error) {
    console.error('Error saving attendance:', error);
    throw error;
  }
};

export const getAttendanceByDate = async (date: string): Promise<AttendanceRecord[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/attendance`, {
      params: { date }
    });
    
    // Return array of attendance records for the date
    if (!Array.isArray(response.data)) {
      console.warn('Expected array of attendance records, got:', response.data);
      return [];
    }
    
    return response.data.map((record: any) => ({
      id: record.id,
      employee_id: record.employee_id,
      status: record.status,
      date: record.date,
      check_in: record.check_in,
      check_out: record.check_out,
      notes: record.notes
    }));
  } catch (error) {
    console.error('Error fetching attendance:', error);
    throw error;
  }
};

export const getEmployees = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/employees`);
    return response.data;
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }
};

export const exportToExcel = async (startDate: string, endDate: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/attendance/export`, {
      params: { startDate, endDate },
      responseType: 'blob' // Important for file download
    });
    
    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `attendance_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return true;
  } catch (error) {
    console.error('Error exporting attendance:', error);
    throw error;
  }
};
