import React, { useState, useEffect } from 'react';
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { getAttendanceByDate, getEmployees } from "@/services/attendance";
import { format, subDays, addDays, isToday, isAfter } from 'date-fns';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Employee {
  id: string;
  name: string;
}

interface AttendanceData {
  employee_id: string;
  status: 'present' | 'absent' | 'half_day' | 'leave';
  date: string;
}

const DataTab = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceData>>({});
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 6), // Last 7 days by default
    end: new Date()
  });

  // Fetch employees on component mount
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await getEmployees();
        setEmployees(data);
      } catch (error) {
        console.error('Error fetching employees:', error);
      }
    };

    fetchEmployees();
  }, []);

  // Fetch attendance data when date range changes
  useEffect(() => {
    const fetchAttendanceData = async () => {
      setLoading(true);
      try {
        // Fetch attendance for each day in the range
        const date = new Date(dateRange.start);
        const allAttendance: Record<string, AttendanceData> = {};

        while (date <= dateRange.end) {
          const dateStr = format(date, 'yyyy-MM-dd');
          try {
            const data = await getAttendanceByDate(dateStr);
            data.forEach((record: AttendanceData) => {
              const key = `${record.employee_id}-${dateStr}`;
              allAttendance[key] = record;
            });
          } catch (error) {
            console.error(`Error fetching attendance for ${dateStr}:`, error);
          }
          date.setDate(date.getDate() + 1);
        }

        setAttendanceData(allAttendance);
      } catch (error) {
        console.error('Error fetching attendance data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [dateRange]);

  const getStatus = (employeeId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const key = `${employeeId}-${dateStr}`;
    const record = attendanceData[key];
    
    if (!record) return '';
    
    switch(record.status) {
      case 'present': return 'P';
      case 'absent': return 'A';
      case 'half_day': return 'H';
      case 'leave': return 'L';
      default: return '';
    }
  };

  const handleDateRangeChange = (range: { from: Date; to: Date }) => {
    if (range.from && range.to) {
      setDateRange({ start: range.from, end: range.to });
    }
  };

  const getDateRangeLabel = () => {
    if (!dateRange.start || !dateRange.end) return 'Select Date Range';
    return `${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d, yyyy')}`;
  };

  const generateDateRange = () => {
    const dates = [];
    const currentDate = new Date(dateRange.start);
    while (currentDate <= dateRange.end) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  };

  if (loading) {
    return (
      <TabsContent value="data" className="p-4 flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </TabsContent>
    );
  }

  return (
    <TabsContent value="data" className="p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Attendance Data</h2>
        <div className="flex gap-4 mb-4 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[300px] justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {getDateRangeLabel()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.start}
                selected={{ from: dateRange.start, to: dateRange.end }}
                onSelect={(range) => range?.from && range?.to && handleDateRangeChange({ from: range.from, to: range.to })}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border px-4 py-2 text-left">Emp ID</th>
              <th className="border px-4 py-2 text-left">Name</th>
              {generateDateRange().map((date, idx) => (
                <th key={idx} className="border px-2 py-1 text-center text-xs">
                  {format(date, 'd MMM')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id} className="hover:bg-gray-50">
                <td className="border px-4 py-2">{employee.id}</td>
                <td className="border px-4 py-2 font-medium">{employee.name}</td>
                {generateDateRange().map((date, idx) => (
                  <td 
                    key={idx} 
                    className={cn(
                      "border px-2 py-1 text-center text-sm",
                      getStatus(employee.id, date) === 'P' && 'bg-green-50',
                      getStatus(employee.id, date) === 'A' && 'bg-red-50',
                      getStatus(employee.id, date) === 'H' && 'bg-yellow-50',
                      getStatus(employee.id, date) === 'L' && 'bg-blue-50',
                      isToday(date) && 'border-2 border-blue-300'
                    )}
                  >
                    {getStatus(employee.id, date)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TabsContent>
  );
};

export default DataTab;