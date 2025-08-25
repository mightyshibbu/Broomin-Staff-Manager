import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2, Download, List } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { DateRange } from "react-day-picker";
import { format, addDays, startOfDay, isAfter, isSameDay } from "date-fns";
import { getEmployees, getAttendanceByDate, markAttendance, exportToExcel } from "@/services/attendance";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import AttendanceCalendar from "./AttendanceCalendar";
import { useToaster } from "@/lib/toast";

interface Employee {
  id: string;
  name: string;
  area?: string;
  contact?: string;
  image_url?: string;
  status?: "active" | "inactive";
}

type FrontendStatus = "Present" | "Absent" | "FH" | "SH" | "Leave";
type BackendStatus = "present" | "absent" | "half_day" | "leave";

// Import the AttendanceRecord type from the service
import { AttendanceRecord as BackendAttendanceRecord } from "@/services/attendance";

// Use the backend type directly
type AttendanceRecord = BackendAttendanceRecord;

interface AttendanceTrackerProps {
  employees?: Employee[];
  onMarkAttendance?: (employeeId: string, status: FrontendStatus, date: Date) => void;
}

const STATUS_DISPLAY = (rec?: AttendanceRecord) => {
  if (!rec) return "Not Marked";
  if (rec.status === "present") return "Present";
  if (rec.status === "absent") return "Absent";
  if (rec.status === "leave") return "Leave";
  if (rec.status === "half_day") return rec.notes === "SH" ? "Half Day (SH)" : "Half Day (FH)";
  return "Not Marked";
};

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({ employees: propEmployees, onMarkAttendance = () => {} }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [exportDateRange, setExportDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date(),
  });
  const [isExporting, setIsExporting] = useState(false);

  const [employees, setEmployees] = useState<Employee[]>(propEmployees ?? []);
  const [loading, setLoading] = useState<boolean>(!(propEmployees && propEmployees.length));
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceRecord>>({});
  const [currentEmployeeIndex, setCurrentEmployeeIndex] = useState<number>(0);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);

  const { success: toastSuccess, error: toastError } = useToaster();
  const toastRef = useRef({ success: toastSuccess, error: toastError });
  useEffect(() => {
    toastRef.current = { success: toastSuccess, error: toastError };
  }, [toastSuccess, toastError]);

  // small stable scalar to avoid prop array identity causing effect re-runs
  const propEmployeesLength = propEmployees ? propEmployees.length : undefined;

  const todayStart = startOfDay(new Date());
  const disableNext = isSameDay(startOfDay(selectedDate), todayStart) || isAfter(startOfDay(selectedDate), todayStart);

  // fetch employees (only when not passed) and fetch attendance for selected date
  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        const dateStr = format(selectedDate, "yyyy-MM-dd");

        if (propEmployeesLength && propEmployeesLength > 0) {
          // parent provided employees - only fetch attendance
          const attendanceData = await getAttendanceByDate(dateStr);
          if (cancelled) return;
          
          // Convert array to map keyed by employee_id
          const recordsMap = (attendanceData || []).reduce<Record<string, AttendanceRecord>>((acc, record) => {
            acc[record.employee_id] = record;
            return acc;
          }, {});
          
          setAttendanceRecords(recordsMap);
        } else {
          // load both
          const [employeesData, attendanceData] = await Promise.all([
            getEmployees(), 
            getAttendanceByDate(dateStr)
          ]);
          
          if (cancelled) return;
          
          setEmployees(employeesData || []);
          
          // Convert array to map keyed by employee_id
          const recordsMap = (attendanceData || []).reduce<Record<string, AttendanceRecord>>((acc, record) => {
            acc[record.employee_id] = record;
            return acc;
          }, {});
          
          setAttendanceRecords(recordsMap);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        toastRef.current.error("Failed to load attendance data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 80);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [selectedDate, propEmployeesLength]);

  // keep current index in-range
  useEffect(() => {
    if (!employees.length) {
      setCurrentEmployeeIndex(0);
      return;
    }
    setCurrentEmployeeIndex(idx => Math.min(idx, employees.length - 1));
  }, [employees]);

  const currentEmployee = employees[currentEmployeeIndex];

  const formatTime = (time?: string) => {
    if (!time) return "";
    const [hh, mm = "00"] = time.split(":");
    const h = parseInt(hh, 10);
    const hour12 = h % 12 || 12;
    const ampm = h >= 12 ? "PM" : "AM";
    return `${hour12}:${mm} ${ampm}`;
  };

  const frontendToBackend = (s: FrontendStatus): BackendStatus => {
    if (s === "Present") return "present";
    if (s === "Absent") return "absent";
    if (s === "Leave") return "leave";
    return "half_day";
  };

  const handleMarkAttendance = async (employeeId: string, status: FrontendStatus) => {
    try {
      setSaving(prev => ({ ...prev, [employeeId]: true }));

      const backendStatus = frontendToBackend(status);
      const notes = status === "FH" || status === "SH" ? status : undefined;
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      
      // Get existing attendance record if it exists
      const existingRecord = attendanceRecords[employeeId];
      
      // Create a new attendance record with proper typing
      const attendanceRecord: AttendanceRecord = {
        ...(existingRecord || {}), // Include existing record data if it exists
        employee_id: employeeId,
        status: backendStatus,
        date: dateStr,
        check_in: (status === "Present" || status === "FH" || status === "SH") 
          ? (existingRecord?.check_in || "09:00:00") 
          : undefined,
        check_out: status === "Present" 
          ? (existingRecord?.check_out || "18:00:00")
          : status === "SH" 
            ? (existingRecord?.check_out || "13:00:00")
            : status === "FH"
              ? (existingRecord?.check_out || "13:00:00")
              : undefined,
        notes,
      };

      const updatedRecord = await markAttendance(attendanceRecord);

      // Update the attendance records with the response from the server
      setAttendanceRecords(prev => {
        const updated = {
          ...prev,
          [employeeId]: {
            ...attendanceRecord,
            id: updatedRecord.id ?? attendanceRecord.id, // Use updated ID if available
            employee_id: employeeId,
            date: dateStr,
            status: backendStatus,
          } as AttendanceRecord
        };
        return updated;
      });
      
      const emp = employees.find(e => e.id === employeeId);
      toastRef.current.success(`Marked ${emp?.name ?? employeeId} as ${status}`);
      onMarkAttendance(employeeId, status, selectedDate);
    } catch (err) {
      console.error("Mark attendance error:", err);
      toastRef.current.error("Failed to mark attendance");
    } finally {
      setSaving(prev => ({ ...prev, [employeeId]: false }));
    }
  };

  const handleExport = async () => {
    if (!exportDateRange?.from || !exportDateRange?.to) {
      toastRef.current.error("Select a valid export range");
      return;
    }
    try {
      setIsExporting(true);
      await exportToExcel(format(exportDateRange.from, "yyyy-MM-dd"), format(exportDateRange.to, "yyyy-MM-dd"));
      toastRef.current.success("Export requested");
    } catch (err) {
      console.error("Export error:", err);
      toastRef.current.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setViewMode("list");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading attendance data...</span>
      </div>
    );
  }

  if (!employees.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>No employees found. Please add employees first.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Attendance Tracker</h2>

        <div className="flex items-center gap-3">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "calendar")}>
            <TabsList>
              <TabsTrigger value="list"><List className="h-4 w-4 mr-2" />List</TabsTrigger>
              <TabsTrigger value="calendar"><CalendarIcon className="h-4 w-4 mr-2" />Calendar</TabsTrigger>
            </TabsList>
          </Tabs>

          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="bg-white">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "dd MMM yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent mode="single" selected={selectedDate} onSelect={(d) => d && setSelectedDate(d)} />
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, 1))} disabled={disableNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" disabled={isExporting}>
                {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                Export
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="end">
              <div className="space-y-4">
                <h4 className="font-medium">Export Date Range</h4>
                <CalendarComponent mode="range" selected={exportDateRange} onSelect={(r) => setExportDateRange(r as DateRange)} numberOfMonths={2} />
                <Button onClick={handleExport} disabled={!exportDateRange?.from || !exportDateRange?.to || isExporting}>
                  {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Export to Excel"}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {viewMode === "calendar" && (
        <div className="mb-6">
          <AttendanceCalendar selectedDate={selectedDate} onDateSelect={handleDateSelect} />
        </div>
      )}

      {/* main layout */}
      {viewMode === "list" && (
        <div className="flex gap-4">
          {/* left sidebar */}
          <div className="w-1/4">
            <Card className="bg-white shadow-sm">
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-4">Employees</h3>
                <div className="space-y-2 max-h-[65vh] overflow-auto pr-2">
                  {employees.map((emp, idx) => {
                    const rec = attendanceRecords[emp.id];
                    return (
                      <button key={emp.id} type="button" onClick={() => setCurrentEmployeeIndex(idx)}
                        className={`w-full text-left p-3 rounded-md flex justify-between items-center ${idx === currentEmployeeIndex ? "bg-gray-100" : "bg-gray-50"}`}>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            {emp.image_url ? <AvatarImage src={emp.image_url} alt={emp.name} /> : <AvatarFallback>{emp.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>}
                          </Avatar>
                          <div className="text-sm">
                            <div className="font-medium">{emp.name}</div>
                            <div className="text-xs text-muted-foreground">{emp.area}</div>
                          </div>
                        </div>

                        {rec && (
                          <span className={`text-xs px-2 py-1 rounded-full ${rec.status === "present" ? "bg-green-100 text-green-800" : rec.status === "absent" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
                            {STATUS_DISPLAY(rec)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* center card with header, avatar, status and buttons (all in one box) */}
          <div className="flex-1">
            {currentEmployee && (
              <Card className="bg-white rounded-lg shadow-sm">
                <CardContent className="p-6">
                  {/* header row: prev - title - next */}
                  <div className="flex items-center justify-between mb-6">
                    <Button variant="ghost" onClick={() => setCurrentEmployeeIndex(i => (i > 0 ? i - 1 : employees.length - 1))}>
                      <ChevronLeft className="h-6 w-6" />
                    </Button>

                    <div className="text-center">
                      <div className="text-lg font-semibold">{currentEmployee.name}</div>
                      <div className="text-xs text-muted-foreground">ID: {currentEmployee.id}</div>
                    </div>

                    <Button variant="ghost" onClick={() => setCurrentEmployeeIndex(i => (i < employees.length - 1 ? i + 1 : 0))}>
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </div>

                  {/* main card area: status box and avatar (single visual block) */}
                  <div className="flex items-center justify-between gap-8 mb-6">
                    <div className="flex-1">
                      <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium">Status</div>
                          <div className="font-semibold">{STATUS_DISPLAY(attendanceRecords[currentEmployee.id])}</div>
                        </div>
                        {attendanceRecords[currentEmployee.id] && (attendanceRecords[currentEmployee.id].check_in || attendanceRecords[currentEmployee.id].check_out) && (
                          <div className="text-sm text-gray-600">
                            {attendanceRecords[currentEmployee.id].check_in && <span>In: {formatTime(attendanceRecords[currentEmployee.id].check_in)}</span>}
                            {attendanceRecords[currentEmployee.id].check_out && <span className="ml-4">Out: {formatTime(attendanceRecords[currentEmployee.id].check_out)}</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="w-32 flex-shrink-0 flex justify-center">
                      <Avatar className="h-24 w-24">
                        {currentEmployee.image_url ? (
                          <AvatarImage src={currentEmployee.image_url} alt={currentEmployee.name} />
                        ) : (
                          <AvatarFallback className="bg-gray-200 text-gray-400 text-2xl">
                            {currentEmployee.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </div>
                  </div>

                  {/* action buttons aligned into single block under status */}
                  <div className="flex flex-wrap gap-4 justify-center mt-4">
                    <Button className="bg-green-500 hover:bg-green-600 text-white px-8 py-3" onClick={() => handleMarkAttendance(currentEmployee.id, "Present")} disabled={!!saving[currentEmployee.id]}>
                      {saving[currentEmployee.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : "Present"}
                    </Button>

                    <Button className="bg-yellow-400 hover:bg-yellow-500 text-black px-8 py-3" onClick={() => handleMarkAttendance(currentEmployee.id, "FH")} disabled={!!saving[currentEmployee.id]}>
                      {saving[currentEmployee.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : "Half Day (FH)"}
                    </Button>

                    <Button className="bg-yellow-400 hover:bg-yellow-500 text-black px-8 py-3" onClick={() => handleMarkAttendance(currentEmployee.id, "SH")} disabled={!!saving[currentEmployee.id]}>
                      {saving[currentEmployee.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : "Half Day (SH)"}
                    </Button>

                    <Button className="bg-red-500 hover:bg-red-600 text-white px-8 py-3" onClick={() => handleMarkAttendance(currentEmployee.id, "Absent")} disabled={!!saving[currentEmployee.id]}>
                      {saving[currentEmployee.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : "Absent"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTracker;
