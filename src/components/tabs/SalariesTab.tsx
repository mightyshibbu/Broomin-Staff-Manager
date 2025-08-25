import React, { useState, useEffect, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, addMonths, subMonths } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, ChevronLeft, ChevronRight, Search, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { fetchEmployees, Employee } from '@/services/api';
import axios from 'axios';

interface SalaryData {
  id: string;
  name: string;
  presentDays: number;
  halfDays: number;
  leaveDays: number;
  dailyRate: number;
  allocatedLeaves: number;
  effectiveWorkingDays: number;
  salary: number;          // Monthly salary
  netSalary: number;       // Calculated net salary
  status?: 'active' | 'inactive';
  workingDays: number;     // Total working days in month
}

const SalariesTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [salaries, setSalaries] = useState<SalaryData[]>([]);
  const [filter, setFilter] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<Record<string, any>>({});

  // Fetch all employees
  const fetchEmployeeData = async () => {
    try {
      const data = await fetchEmployees();
      setEmployees(data);
      return data;
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employee data');
      return [];
    }
  };

  // Fetch attendance for a specific month
  const fetchAttendanceForMonth = async (date: Date) => {
    const month = date.getMonth() + 1; // JavaScript months are 0-indexed
    const year = date.getFullYear();
    
    console.log(`Fetching attendance for ${month}/${year}`);
    
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const url = new URL(`${baseUrl}/api/attendance`);
      url.searchParams.append('month', month.toString());
      url.searchParams.append('year', year.toString());
      
      console.log('API URL:', url.toString());
      
      const response = await axios.get(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        timeout: 10000 // 10 second timeout
      });
      
      console.log('API Response:', response.status, response.data);
      
      if (!Array.isArray(response.data)) {
        console.error('Unexpected response format:', response.data);
        throw new Error('Invalid response format from server');
      }
      
      // Transform the data into a date-based structure with employee ID as key
      const attendanceByDate: Record<string, any[]> = {};
      
      response.data.forEach((record: any) => {
        if (!record.date) {
          console.warn('Record missing date field:', record);
          return;
        }
        if (!attendanceByDate[record.date]) {
          attendanceByDate[record.date] = [];
        }
        // Ensure employee_id is properly set from the record
        if (!record.employee_id && record.employee_id !== 0) {
          console.warn('Record missing employee_id:', record);
          return;
        }
        attendanceByDate[record.date].push({
          ...record,
          employee_id: record.employee_id.toString() // Ensure consistent string comparison
        });
      });
      
      console.log(`Processed ${response.data.length} records into ${Object.keys(attendanceByDate).length} dates`);
      console.log('Sample attendance data:', JSON.stringify(attendanceByDate, null, 2).substring(0, 500) + '...');
      
      setAttendanceData(attendanceByDate);
      return attendanceByDate;
    } catch (error) {
      console.error('Error fetching monthly attendance:', error);
      toast.error('Failed to load attendance data');
      return {};
    }
  };




  // Calculate working days in a month (excluding weekends)
  const getWorkingDaysInMonth = (date: Date): number => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const days = eachDayOfInterval({ start, end });
    return days.filter(day => !isWeekend(day)).length;
  };

  // Calculate salaries based on attendance and allocated leaves
  const calculateSalaries = (employees: Employee[], attendanceData: Record<string, any[]>): SalaryData[] => {
    console.log('Calculating salaries with employees:', employees);
    console.log('Attendance data:', attendanceData);
    
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const totalWorkingDays = getWorkingDaysInMonth(currentDate);
    console.log(`Total working days in month: ${totalWorkingDays} (${format(start, 'MMM yyyy')})`);
    
    // Flatten attendance data into a single array of records
    const allAttendance = Object.values(attendanceData).flat();
    
    return employees.map(employee => {
      console.log(`\nProcessing employee: ${employee.id} - ${employee.name}`);
      let presentDays = 0;
      let halfDays = 0;
      let leaveDays = 0;
      
      // Get all attendance records for this employee
      const allEmployeeAttendance = allAttendance.filter(record => {
        const recordId = record.employee_id?.toString() || '';
        const employeeId = employee.id?.toString() || '';
        return recordId === employeeId || 
               recordId === `EMP${employeeId}` ||
               `EMP${recordId}` === employeeId;
      });
      
      console.log(`Found ${allEmployeeAttendance.length} attendance records for ${employee.id}`);
      
      // Process each attendance record for this employee
      allEmployeeAttendance.forEach(record => {
        const date = new Date(record.date);
        if (isWeekend(date)) return; // Skip weekends
        
        console.log(`Processing record for ${record.date}: ${record.status}`);
        
        if (record.status === 'present') {
          presentDays++;
        } else if (record.status === 'half_day') {
          halfDays++;
        } else if (record.status === 'absent' || record.status === 'leave') {
          leaveDays++;
        }
      });
      
      // Calculate working days after deducting allocated leaves
      const allocatedLeaves = employee.totalLeaves || 0;
      const effectiveWorkingDays = Math.max(0, totalWorkingDays - allocatedLeaves);
      
      console.log(`Employee ${employee.id} - Present: ${presentDays}, Half-days: ${halfDays}, Leave: ${leaveDays}`);
      console.log(`Allocated leaves: ${allocatedLeaves}, Effective working days: ${effectiveWorkingDays}`);
      
      // Calculate daily rate based on effective working days
      const dailyRate = effectiveWorkingDays > 0 ? (employee.salary / effectiveWorkingDays) : 0;
      
      // Calculate net salary based on actual attendance
      const presentAmount = presentDays * dailyRate;
      const halfDayAmount = halfDays * dailyRate * 0.5;
      const netSalary = presentAmount + halfDayAmount;
      
      return {
        id: employee.id,
        name: employee.name,
        presentDays,
        halfDays,
        leaveDays,
        allocatedLeaves,
        effectiveWorkingDays,
        dailyRate: parseFloat(dailyRate.toFixed(2)),
        salary: employee.salary,
        netSalary: Math.round(netSalary * 100) / 100,
        status: employee.status,
        workingDays: totalWorkingDays
      };
    });
  };

  // Fetch all necessary data
  const fetchSalaries = useCallback(async (date: Date) => {
    const monthKey = format(date, 'yyyy-MM');
    console.log(`Fetching salaries for ${monthKey}`);
    
    try {
      setLoading(true);
      
      // Fetch employees if not already loaded
      const empData = employees.length > 0 ? employees : await fetchEmployeeData();
      
      // Only fetch active employees
      const activeEmployees = empData.filter((emp: any) => emp.status === 'active');
      
      // Fetch attendance data for the entire month
      const monthlyAttendance = await fetchAttendanceForMonth(date);
      
      // Calculate salaries with the fetched attendance data
      const calculatedSalaries = calculateSalaries(activeEmployees, monthlyAttendance);
      setSalaries(calculatedSalaries);
      
    } catch (error) {
      console.error('Error fetching salary data:', error);
      toast.error('Failed to load salary data');
    } finally {
      setLoading(false);
    }
  }, [employees]);

  // Refresh data when month changes
  useEffect(() => {
    const controller = new AbortController();
    
    // Only fetch if we have a valid date
    if (currentDate) {
      fetchSalaries(currentDate);
    }
    
    return () => {
      controller.abort();
    };
  }, [currentDate, fetchSalaries]);

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    // Don't allow going beyond current month
    const now = new Date();
    if (startOfMonth(currentDate).getTime() >= startOfMonth(now).getTime()) {
      return;
    }
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  const filteredSalaries = salaries.filter(employee =>
    employee.name.toLowerCase().includes(filter.toLowerCase()) ||
    employee.id.toString().includes(filter)
  );

  const totalNetSalary = salaries.reduce((sum, emp) => sum + emp.netSalary, 0);
  return (
    <TabsContent value="salaries" className="p-4">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Salary Information</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={handleCurrentMonth}>
              Current Month
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleNextMonth}
              disabled={startOfMonth(currentDate).getTime() >= startOfMonth(new Date()).getTime()}
            >
              Next
            </Button>
            <span className="text-sm font-medium">
              {format(currentDate, 'MMMM yyyy')}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="w-64">
            <Input
              placeholder="Search by name or ID..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className="text-right">
            <span className="font-medium">Total Payout: </span>
            <span className="font-bold">₹{totalNetSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading salary data...</span>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Emp ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Working Days
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Allocated Leaves
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Present
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Half Days
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Leave Days
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Daily Rate
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Monthly Salary
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Net Salary
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredSalaries.length > 0 ? (
                filteredSalaries.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {employee.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {employee.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">
                      {employee.workingDays}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">
                      {employee.allocatedLeaves}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">
                      {employee.presentDays}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">
                      {employee.halfDays}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">
                      {employee.leaveDays}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">
                      ₹{employee.dailyRate.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">
                      ₹{employee.salary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center text-green-600 dark:text-green-400">
                      ₹{employee.netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    {salaries.length === 0 ? 'No salary data available' : 'No matching employees found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </TabsContent>
  );
};

export default SalariesTab;
