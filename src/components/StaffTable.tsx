import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";

// Define a mock StaffFormModal component since the actual one isn't available
// In a real implementation, you would create this component in a separate file
const StaffFormModal = ({ title, employee, onSubmit, onCancel }) => {
  // This is a placeholder implementation
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name:</label>
          <Input defaultValue={employee?.name || ""} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Age:</label>
          <Input type="number" defaultValue={employee?.age || ""} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Area:</label>
          <Input defaultValue={employee?.area || ""} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Salary:</label>
          <Input type="number" defaultValue={employee?.salary || ""} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Job Time From:
          </label>
          <Input defaultValue={employee?.jobTimeFrom || ""} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Job Time To:</label>
          <Input defaultValue={employee?.jobTimeTo || ""} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Joining Date:
          </label>
          <Input defaultValue={employee?.joiningDate || ""} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Leaves Allocated:
          </label>
          <Input type="number" defaultValue={employee?.totalLeaves || ""} />
        </div>
        <div className="pt-4 flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => onSubmit(employee || {})}>Submit</Button>
        </div>
      </div>
    </div>
  );
};

interface Employee {
  id: string;
  name: string;
  joiningDate: string;
  age: number;
  area: string;
  salary: number;
  jobTimeFrom: string;
  jobTimeTo: string;
  status: string;
  totalLeaves: number;
}

const StaffTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Mock data for demonstration
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: "10001",
      name: "Neil Borah",
      joiningDate: "25/04/2025",
      age: 28,
      area: "Viman Nagar",
      salary: 14000,
      jobTimeFrom: "1000",
      jobTimeTo: "1900",
      status: "active",
      totalLeaves: 5,
    },
    {
      id: "10002",
      name: "Jatin Yadav",
      joiningDate: "25/04/2025",
      age: 28,
      area: "Viman Nagar",
      salary: 14000,
      jobTimeFrom: "1000",
      jobTimeTo: "1900",
      status: "active",
      totalLeaves: 5,
    },
    {
      id: "10003",
      name: "Meher Khan",
      joiningDate: "25/04/2025",
      age: 28,
      area: "Viman Nagar",
      salary: 14000,
      jobTimeFrom: "1000",
      jobTimeTo: "1900",
      status: "active",
      totalLeaves: 5,
    },
    {
      id: "10004",
      name: "Neil Borah",
      joiningDate: "25/04/2025",
      age: 28,
      area: "Viman Nagar",
      salary: 14000,
      jobTimeFrom: "1000",
      jobTimeTo: "1900",
      status: "active",
      totalLeaves: 5,
    },
    {
      id: "10005",
      name: "Neil Borah",
      joiningDate: "25/04/2025",
      age: 28,
      area: "Viman Nagar",
      salary: 14000,
      jobTimeFrom: "1000",
      jobTimeTo: "1900",
      status: "active",
      totalLeaves: 5,
    },
  ]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredEmployees = employees.filter(
    (employee) =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.id.includes(searchTerm),
  );

  const handleCreateEmployee = (newEmployee: Omit<Employee, "id">) => {
    // In a real app, this would be handled by a backend service
    const id = `${10000 + employees.length + 1}`;
    setEmployees([...employees, { ...newEmployee, id }]);
    setIsCreateModalOpen(false);
  };

  const handleUpdateEmployee = (updatedEmployee: Employee) => {
    setEmployees(
      employees.map((emp) =>
        emp.id === updatedEmployee.id ? updatedEmployee : emp,
      ),
    );
    setIsUpdateModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleDeleteEmployee = () => {
    if (selectedEmployee) {
      setEmployees(employees.filter((emp) => emp.id !== selectedEmployee.id));
      setIsDeleteDialogOpen(false);
      setSelectedEmployee(null);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name or ID"
            value={searchTerm}
            onChange={handleSearch}
            className="pl-8"
          />
        </div>
        
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Emp ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Joining Date</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Area</TableHead>
              <TableHead>Salary</TableHead>
              <TableHead>Job Time From</TableHead>
              <TableHead>Job Time To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total Leaves</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.id}</TableCell>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>{employee.joiningDate}</TableCell>
                  <TableCell>{employee.age}</TableCell>
                  <TableCell>{employee.area}</TableCell>
                  <TableCell>{employee.salary}</TableCell>
                  <TableCell>{employee.jobTimeFrom}</TableCell>
                  <TableCell>{employee.jobTimeTo}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${employee.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                    >
                      {employee.status}
                    </span>
                  </TableCell>
                  <TableCell>{employee.totalLeaves}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setIsUpdateModalOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={11}
                  className="text-center py-10 text-gray-500"
                >
                  No employees found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

    
      {/* Update Employee Modal */}
      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedEmployee && (
            <StaffFormModal
              title="Update staff information"
              employee={selectedEmployee}
              onSubmit={handleUpdateEmployee}
              onCancel={() => setIsUpdateModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-semibold">Delete Employee</h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete {selectedEmployee?.name}? This
              action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteEmployee}>
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffTable;
