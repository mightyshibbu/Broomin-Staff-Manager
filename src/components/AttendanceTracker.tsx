import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { format } from "date-fns";

interface Employee {
  id: string;
  name: string;
  area?: string;
  contact?: string;
  image?: string;
}

interface AttendanceTrackerProps {
  employees?: Employee[];
  onMarkAttendance?: (
    employeeId: string,
    status: "Present" | "Absent" | "FH" | "SH",
    date: Date,
  ) => void;
}

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({
  employees = [
    {
      id: "1001",
      name: "Neal Borah",
      area: "Viman Nagar",
      contact: "8778728172",
    },
    {
      id: "1002",
      name: "Mansi Viman Nagar",
      area: "Viman Nagar",
      contact: "9876543210",
    },
    {
      id: "1003",
      name: "Jatin Yadav",
      area: "Viman Nagar",
      contact: "7654321098",
    },
    {
      id: "1004",
      name: "Meher Khan",
      area: "Viman Nagar",
      contact: "8765432109",
    },
  ],
  onMarkAttendance = () => {},
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentEmployeeIndex, setCurrentEmployeeIndex] = useState<number>(0);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);

  const currentEmployee = employees[currentEmployeeIndex];

  const handlePrevious = () => {
    if (currentEmployeeIndex > 0) {
      setCurrentEmployeeIndex(currentEmployeeIndex - 1);
    } else {
      // Optional: Loop back to the last employee
      setCurrentEmployeeIndex(employees.length - 1);
    }
  };

  const handleNext = () => {
    if (currentEmployeeIndex < employees.length - 1) {
      setCurrentEmployeeIndex(currentEmployeeIndex + 1);
    } else {
      // Optional: Loop back to the first employee
      setCurrentEmployeeIndex(0);
    }
  };

  const handleAttendance = (status: "Present" | "Absent" | "FH" | "SH") => {
    if (currentEmployee) {
      onMarkAttendance(currentEmployee.id, status, selectedDate);
    }
  };

  return (
    <div className="bg-gray-200 min-h-screen p-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Employee List Sidebar */}
        <div className="w-full md:w-1/4">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <h2 className="font-bold text-lg mb-4">List of employees</h2>
              <div className="space-y-2">
                {employees.map((employee, index) => (
                  <button
                    key={employee.id}
                    className={`w-full text-left p-3 rounded-md ${index === currentEmployeeIndex ? "bg-gray-100" : "bg-gray-50"}`}
                    onClick={() => setCurrentEmployeeIndex(index)}
                  >
                    {employee.name}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="w-full md:w-3/4">
          <div className="flex justify-end mb-4">
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="bg-white">
                  <Calendar className="mr-2 h-4 w-4" />
                  Date: {format(selectedDate, "dd MMMM yyyy")}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date);
                      setIsDatePickerOpen(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {currentEmployee && (
            <Card className="bg-white shadow-md rounded-lg overflow-hidden">
              <CardContent className="p-8 flex flex-col items-center overflow-hidden">
                <div className="w-full flex justify-between items-center mb-8">
                  <Button variant="ghost" onClick={handlePrevious}>
                    <ChevronLeft className="h-8 w-8" />
                  </Button>

                  <div className="relative w-full max-w-2xl h-64 flex items-center justify-center overflow-hidden">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={currentEmployeeIndex}
                        initial={{ x: 200, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -200, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="absolute w-full flex flex-col md:flex-row items-center gap-8"
                      >
                        <div className="text-center md:text-left">
                          <p className="text-lg font-medium">Name: {currentEmployee.name}</p>
                          <p className="text-md">Emp ID: {currentEmployee.id}</p>
                          {currentEmployee.contact && (
                            <p className="text-md">
                              Contact: {currentEmployee.contact}
                            </p>
                          )}
                        </div>

                        <Avatar className="h-24 w-24">
                          {currentEmployee.image ? (
                            <AvatarImage
                              src={currentEmployee.image}
                              alt={currentEmployee.name}
                            />
                          ) : (
                            <AvatarFallback className="bg-gray-200 text-gray-400 text-4xl">
                              {currentEmployee.name.charAt(0)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <Button variant="ghost" onClick={handleNext}>
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full max-w-md mt-8">
                  <Button
                    className="bg-green-500 hover:bg-green-600 text-white py-6"
                    onClick={() => handleAttendance("Present")}
                  >
                    Present
                  </Button>
                  <Button
                    className="bg-red-500 hover:bg-red-600 text-white py-6"
                    onClick={() => handleAttendance("Absent")}
                  >
                    Absent
                  </Button>
                  <Button
                    className="bg-yellow-300 hover:bg-yellow-400 text-black py-4"
                    onClick={() => handleAttendance("FH")}
                  >
                    FH
                  </Button>
                  <Button
                    className="bg-orange-400 hover:bg-orange-500 text-white py-4"
                    onClick={() => handleAttendance("SH")}
                  >
                    SH
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceTracker;
