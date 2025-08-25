import React, { useState, useEffect } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, Plus, Pencil, Trash2, Check, X, ToggleLeft, ToggleRight } from "lucide-react";
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee } from "@/services/api";
import { useToaster } from "@/lib/toast";
import { format } from "date-fns";

// Staff Form Modal (inline for now)
const StaffFormModal = ({ 
  title, 
  employee, 
  onSubmit, 
  onCancel,
  isSubmitting 
}: { 
  title: string; 
  employee: Partial<Employee> | null; 
  onSubmit: (data: Partial<Employee>) => void; 
  onCancel: () => void;
  isSubmitting: boolean;
}) => {
  const [formData, setFormData] = useState<Partial<Employee>>({
    status: 'active',
    total_leaves: 0,
    ...(employee || {})
  });

  // Update form data when employee prop changes
  useEffect(() => {
    if (employee) {
      setFormData(prev => ({
        ...prev,
        ...employee
      }));
    } else {
      // Reset form for new employee
      setFormData({
        status: 'active',
        total_leaves: 0
      });
    }
  }, [employee]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'age' || name === 'salary' || name === 'total_leaves' 
        ? (value === '' ? '' : Number(value))
        : value
    }));
  };

  // Format date for date input field
  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Name *</label>
          <Input name="name" value={formData.name || ''} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Age *</label>
          <Input name="age" type="number" value={formData.age || ''} onChange={handleChange} min="18" max="100" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Place *</label>
          <Input name="place" value={formData.place || ''} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Salary *</label>
          <Input name="salary" type="number" value={formData.salary || ''} onChange={handleChange} min="0" step="0.01" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Job Time From *</label>
          <Input name="job_time_from" type="time" value={formData.job_time_from || ''} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Job Time To *</label>
          <Input name="job_time_to" type="time" value={formData.job_time_to || ''} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Joining Date *</label>
          <Input 
            name="joining_date" 
            type="date" 
            value={formData.joining_date ? formatDateForInput(formData.joining_date) : ''} 
            onChange={handleChange} 
            required 
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Total Leaves *</label>
          <Input name="total_leaves" type="number" value={formData.total_leaves || 0} onChange={handleChange} min="0" required />
        </div>
        <div className="space-y-2 flex items-center space-x-2 pt-2">
          <span className="text-sm font-medium">Status</span>
          <button
            type="button"
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${formData.status === 'active' ? 'bg-green-500' : 'bg-gray-200'}`}
            onClick={() => {
              setFormData(prev => ({
                ...prev,
                status: prev.status === 'active' ? 'inactive' : 'active'
              }));
            }}
          >
            <span className="sr-only">Toggle status</span>
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${formData.status === 'active' ? 'translate-x-6' : 'translate-x-1'}`}
            >
              {formData.status === 'active' ? (
                <Check className="h-4 w-4 text-green-500 mx-auto mt-0.5" />
              ) : (
                <X className="h-4 w-4 text-gray-500 mx-auto mt-0.5" />
              )}
            </span>
          </button>
          <span className="text-sm text-gray-500">
            {formData.status === 'active' ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
      
      <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
};

interface Employee {
  id: string;
  name: string;
  age: number;
  place: string;  // Changed from 'area' to 'place'
  salary: number;
  job_time_from: string;  // Changed to match database column names
  job_time_to: string;    // Changed to match database column names
  joining_date: string;   // Changed to match database column names
  total_leaves: number;   // Changed to match database column names
  status: 'active' | 'inactive';
}

const StaffTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const { success: toastSuccess, error: toastError } = useToaster();

  // Load employees on mount
  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await fetchEmployees();
      setEmployees(data);
    } catch (error) {
      console.error("Error loading employees:", error);
      toastError("Failed to load employees");
    }
  };

  const handleCreate = async (newEmployee: Partial<Employee>) => {
    const requiredFields = ['name', 'age', 'place', 'salary', 'job_time_from', 'job_time_to', 'joining_date', 'total_leaves'];
    const missingFields = requiredFields.filter(field => newEmployee[field as keyof Employee] === undefined);
    
    if (missingFields.length > 0) {
      toastError(`Missing required fields: ${missingFields.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await createEmployee(newEmployee as Omit<Employee, 'id' | 'status'>);
      toastSuccess("Employee created successfully");
      setIsCreateModalOpen(false);
      await loadEmployees();
    } catch (error) {
      console.error("Error creating employee:", error);
      toastError("Failed to create employee");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (updatedEmployee: Partial<Employee>) => {
    if (!selectedEmployee) return;
    setIsSubmitting(true);
    try {
      await updateEmployee(selectedEmployee.id, updatedEmployee);
      toastSuccess("Employee updated successfully");
      setIsUpdateModalOpen(false);
      await loadEmployees();
    } catch (error) {
      console.error("Error updating employee:", error);
      toastError("Failed to update employee");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEmployee) return;
    try {
      await deleteEmployee(selectedEmployee.id);
      toastSuccess("Employee deleted successfully");
      setIsDeleteDialogOpen(false);
      await loadEmployees();
    } catch (error) {
      console.error("Error deleting employee:", error);
      toastError("Failed to delete employee");
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    return `${parseInt(hours) % 12 || 12}:${minutes} ${parseInt(hours) >= 12 ? "PM" : "AM"}`;
  };

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name, area, or ID..."
            className="pl-10 h-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
      </div>

      {/* Employee Table */}
      <div className="rounded-lg border shadow-sm overflow-hidden">
        <div className="relative overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Place</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Job Time</TableHead>
                <TableHead>Joining Date</TableHead>
                <TableHead>Leaves</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee) => (
                  <TableRow key={employee.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{employee.id.substring(0, 8)}...</TableCell>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.age}</TableCell>
                    <TableCell className="capitalize">{employee.place}</TableCell>
                    <TableCell>${employee.salary ? `$${employee.salary.toLocaleString()}` : '-'}</TableCell>
                    <TableCell>
                      {formatTime(employee.job_time_from)} - {formatTime(employee.job_time_to)}
                    </TableCell>
                    <TableCell>
                      {new Date(employee.joining_date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="font-medium">{employee.total_leaves}</span>
                        <span className="text-muted-foreground ml-1">days</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          employee.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {employee.status === "active" ? (
                          <>
                            <Check className="h-3 w-3 mr-1" /> Active
                          </>
                        ) : (
                          <>
                            <X className="h-3 w-3 mr-1" /> Inactive
                          </>
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setIsUpdateModalOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                    No employees found. Try adjusting your search or add a new employee.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create Employee Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <StaffFormModal
            title="Add New Employee"
            employee={null}
            onSubmit={handleCreate}
            onCancel={() => setIsCreateModalOpen(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Update Employee Modal */}
      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <StaffFormModal
            title={`Edit ${selectedEmployee?.name || "Employee"}`}
            employee={selectedEmployee || null}
            onSubmit={handleUpdate}
            onCancel={() => setIsUpdateModalOpen(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">{selectedEmployee?.name}</span>?  
              This will permanently remove all associated data including attendance records.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? "Deleting..." : "Delete Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffTable;
