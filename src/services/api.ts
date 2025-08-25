const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface Employee {
  id: string;
  name: string;
  joiningDate: string;
  age: number;
  area: string;
  salary: number;
  jobTimeFrom: string;
  jobTimeTo: string;
  status: 'active' | 'inactive';
  totalLeaves: number;
}

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok) {
    const error = (data && data.message) || response.statusText;
    throw new Error(error);
  }
  return data;
};

// Fetch all employees
export const fetchEmployees = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/employees`);
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }
};

// Create a new employee
export const createEmployee = async (employeeData: Omit<Employee, 'id' | 'status'>) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...employeeData,
        status: 'active' // Default status for new employees
      }),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error creating employee:', error);
    throw error;
  }
};

// Update an employee
export const updateEmployee = async (id: string, employeeData: Partial<Employee>) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/employees/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(employeeData),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error updating employee:', error);
    throw error;
  }
};

// Delete an employee
export const deleteEmployee = async (id: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/employees/${id}`, {
      method: 'DELETE',
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error deleting employee:', error);
    throw error;
  }
};

// Toggle employee status (active/inactive)
export const toggleEmployeeStatus = async (id: string, currentStatus: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/employees/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: currentStatus === 'active' ? 'inactive' : 'active'
      }),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error toggling employee status:', error);
    throw error;
  }
};

// Fetch attendance for a specific date
export const fetchAttendance = async (date: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/attendance/date/${date}`);
    if (!response.ok) {
      throw new Error('Failed to fetch attendance');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching attendance:', error);
    throw error;
  }
};

// Mark attendance
export const markAttendance = async (employeeId: string, status: string, date: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ employeeId, status, date }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to mark attendance');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error marking attendance:', error);
    throw error;
  }
};
