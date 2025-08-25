import React, { useState, useEffect } from 'react';
import { TabsContent } from "@/components/ui/tabs";
import { format, subMonths, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from 'lucide-react';
import { fetchEmployees } from '@/services/api';
import { getAttendanceByDate } from '@/services/attendance';

interface SalaryData {
  id: string;
  name: string;
  workingDays: number;
  presentDays: number;
  halfDays: number;
  dailyRate: number;
  salary: number;
  netSalary: number;
  status?: 'active' | 'inactive';
}

const SalariesTab = () => {
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [salaries, setSalaries] = useState<SalaryData[]>([]);
  const [filter, setFilter] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<Record<string, any>>({});

  // Calculate working days in the current month (excluding weekends)
  const getWorkingDaysInMonth = (date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const days = eachDayOfInterval({ start, end });
    return days.filter(day => !isWeekend(day)).length;
  };

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

  // Fetch attendance for a specific date range
  const fetchAttendanceData = async (startDate: Date, endDate: Date) => {
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
    const attendance: Record<string, any> = {};
    
    for (const date of dateRange) {
      const dateStr = format(date, 'yyyy-MM-dd');
      try {
        const data = await getAttendanceByDate(dateStr);
        attendance[dateStr] = data;
      } catch (error) {
        console.error(`Error fetching attendance for ${dateStr}:`, error);
      }
    }
    
    setAttendanceData(attendance);
    return attendance;
  };

  // Calculate salaries based on attendance
  const calculateSalaries = (employees: any[], attendance: Record<string, any[]>) => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const workingDays = getWorkingDaysInMonth(currentDate);
    
    return employees.map(employee => {
      let presentDays = 0;
      let halfDays = 0;
      
      // Count present and half days
      const dateRange = eachDayOfInterval({ start, end });
      dateRange.forEach(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayAttendance = attendance[dateStr] || [];
        const employeeAttendance = dayAttendance.find((a: any) => a.employee_id === employee.id);
        
        if (employeeAttendance) {
          if (employeeAttendance.status === 'present') {
            presentDays++;
          } else if (employeeAttendance.status === 'half_day') {
            halfDays++;
          }
        }
      });
      
      // Calculate salary
      const dailyRate = employee.salary / workingDays;
      const presentAmount = presentDays * dailyRate;
      const halfDayAmount = halfDays * dailyRate * 0.5;
      const netSalary = presentAmount + halfDayAmount;
      
      return {
        id: employee.id,
        name: employee.name,
        workingDays,
        presentDays,
        halfDays,
        dailyRate: parseFloat(dailyRate.toFixed(2)),
        salary: employee.salary,
        netSalary: Math.round(netSalary * 100) / 100
      };
    });
  };

  // Fetch all necessary data
  const fetchSalaries = async (date: Date) => {
    try {
      setLoading(true);
      
      // Fetch employees if not already loaded
      const empData = employees.length > 0 ? employees : await fetchEmployeeData();
      
      // Only fetch active employees
      const activeEmployees = empData.filter((emp: any) => emp.status === 'active');
      
      // Set date range for the current month
      const startDate = startOfMonth(date);
      const endDate = endOfMonth(date);
      
      // Fetch attendance data
      await fetchAttendanceData(startDate, endDate);
      
      // Calculate salaries
      const calculatedSalaries = calculateSalaries(activeEmployees, attendanceData);
      setSalaries(calculatedSalaries);
      
    } catch (error) {
      console.error('Error fetching salary data:', error);
      toast.error('Failed to load salary data');
    } finally {
      setLoading(false);
    }
  };

  // Refresh data when month changes
  useEffect(() => {
    fetchSalaries(currentDate);
  }, [currentDate, attendanceData]);

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
                  Present
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Half Days
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
                      {employee.presentDays}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">
                      {employee.halfDays}
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
