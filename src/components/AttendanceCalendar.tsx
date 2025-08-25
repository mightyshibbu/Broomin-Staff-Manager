import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { getAttendanceByDate } from "@/services/attendance";

interface AttendanceCalendarProps {
  onDateSelect: (date: Date) => void;
  selectedDate: Date;
}

interface AttendanceRecord {
  employee_id: string;
  status: "present" | "absent" | "half_day" | "leave";
  date: string; // YYYY-MM-DD
}

const statusColors: Record<string, string> = {
  present: "bg-green-100 text-green-800 hover:bg-green-200",
  half_day: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  absent: "bg-red-100 text-red-800 hover:bg-red-200",
  "no-data": "bg-gray-50 hover:bg-gray-100",
};

const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({ onDateSelect, selectedDate }) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceRecord[]>>({});
  const [loading, setLoading] = useState<boolean>(false);

  // keep a ref to detect cancellations between async fetches
  const cancelledRef = useRef(false);

  // Compute month range and days (memoized)
  const monthStart = useMemo(() => startOfMonth(currentMonth), [currentMonth]);
  const monthEnd = useMemo(() => endOfMonth(currentMonth), [currentMonth]);
  const daysInMonth = useMemo(
    () => eachDayOfInterval({ start: monthStart, end: monthEnd }),
    [monthStart, monthEnd]
  );

  // days to pad before the first day so weekday aligns
  const emptyStartDays = useMemo(() => {
    const startDay = monthStart.getDay(); // 0 (Sun) - 6 (Sat)
    return Array.from({ length: startDay });
  }, [monthStart]);

  // Helper: derive a "status" string for a single date from records
  const getStatusForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const records = attendanceData[dateStr];
    
    // Handle case where records is not an array or doesn't exist
    if (!Array.isArray(records) || records.length === 0) {
      return "no-data";
    }

    // Ensure all records have the expected structure
    const validRecords = records.filter(
      (r) => r && typeof r === 'object' && 'status' in r
    );

    if (validRecords.length === 0) return "no-data";

    const presentCount = validRecords.filter((r) => r.status === "present").length;
    const halfDayCount = validRecords.filter((r) => r.status === "half_day").length;
    const absentCount = validRecords.filter((r) => r.status === "absent").length;

    if (presentCount > 0) return "present";
    if (halfDayCount > 0) return "half_day";
    if (absentCount > 0) return "absent";
    return "no-data";
  };

  // Fetch attendance for all days in the month.
  // If your backend supports a date-range endpoint, replace this logic with a single range call.
  useEffect(() => {
    cancelledRef.current = false;
    setLoading(true);

    // small debounce to avoid running many requests when the user quickly navigates months
    const timer = window.setTimeout(async () => {
      try {
        const dateStrings = daysInMonth.map((d) => format(d, "yyyy-MM-dd"));

        // Fire parallel requests for every date in the month.
        // Using Promise.allSettled so one day's failure doesn't break the rest.
        const promises = dateStrings.map((ds) =>
          getAttendanceByDate(ds).then(
            (records: AttendanceRecord[]) => ({ date: ds, records }),
            (err) => {
              // return empty on failure for that date while logging
              console.error("attendance fetch error for", ds, err);
              return { date: ds, records: [] as AttendanceRecord[] };
            }
          )
        );

        const results = await Promise.all(promises);

        if (cancelledRef.current) return;

        const grouped: Record<string, AttendanceRecord[]> = {};
        results.forEach((res) => {
          // res may be {date, records} from resolved above
          const { date, records } = res as { date: string; records: AttendanceRecord[] };
          grouped[date] = records || [];
        });

        setAttendanceData(grouped);
      } catch (err) {
        console.error("Failed to fetch monthly attendance:", err);
        setAttendanceData({});
      } finally {
        if (!cancelledRef.current) setLoading(false);
      }
    }, 80);

    return () => {
      cancelledRef.current = true;
      clearTimeout(timer);
    };
    // dependency: currentMonth -> daysInMonth updates when monthStart/monthEnd change
  }, [daysInMonth, monthStart, monthEnd]);

  const handlePrevMonth = () => setCurrentMonth((m) => subMonths(m, 1));
  const handleNextMonth = () => setCurrentMonth((m) => addMonths(m, 1));

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="sm" onClick={handlePrevMonth} aria-label="Previous month">
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <h3 className="text-lg font-medium">{format(currentMonth, "MMMM yyyy")}</h3>

        <Button variant="ghost" size="sm" onClick={handleNextMonth} aria-label="Next month">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 p-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
            {day}
          </div>
        ))}

        {/* empty cells before first day */}
        {emptyStartDays.map((_, idx) => (
          <div key={`empty-${idx}`} className="h-10" />
        ))}

        {/* render each day of the month */}
        {daysInMonth.map((day) => {
          const status = getStatusForDate(day);
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentDay = isToday(day);

          const statusClass = statusColors[status] ?? statusColors["no-data"];

          return (
            <button
              key={format(day, "yyyy-MM-dd")}
              onClick={() => onDateSelect(day)}
              className={`h-10 rounded-md transition-colors flex items-center justify-center ${statusClass} ${
                isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""
              } ${isCurrentDay ? "font-semibold" : ""}`}
              title={`${format(day, "MMMM d, yyyy")} — ${status === "no-data" ? "No data" : status}`}
              aria-pressed={isSelected}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AttendanceCalendar;
