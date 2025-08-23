import React, { useState, ChangeEvent, FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";

interface StaffFormModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit?: (data: StaffFormData) => void;
  initialData?: StaffFormData;
}

export interface StaffFormData {
  name: string;
  age: string;
  area: string;
  salary: string;
  jobTimeFrom: string;
  jobTimeTo: string;
  joiningDate: string;
  leavesAllocated: string;
  profilePicture?: File | null;
  documents?: File[] | null;
}

const StaffFormModal: React.FC<StaffFormModalProps> = ({
  open = true,
  onOpenChange,
  onSubmit,
  initialData = {
    name: "",
    age: "",
    area: "",
    salary: "",
    jobTimeFrom: "",
    jobTimeTo: "",
    joiningDate: "",
    leavesAllocated: "",
    profilePicture: null,
    documents: null,
  },
}) => {
  const [formData, setFormData] = useState<StaffFormData>(initialData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    field: "profilePicture" | "documents",
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (field === "profilePicture") {
      setFormData(prev => ({
        ...prev,
        profilePicture: files[0],
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        documents: Array.from(files),
      }));
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    try {
      onSubmit?.(formData);
      onOpenChange?.(false);
    } catch (error) {
      console.error('Error submitting form:', error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="bg-white rounded-lg p-0 max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col"
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          onOpenChange?.(false);
        }}
        onPointerDownOutside={(e) => {
          e.preventDefault();
          onOpenChange?.(false);
        }}
      >
        <DialogHeader className="sticky top-0 bg-white z-10 p-6 pb-4 border-b border-gray-200 w-full">
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          <DialogTitle className="text-xl font-semibold text-center">
            {initialData.name ? 'Edit Staff' : 'Create New Staff'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name:</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-gray-100 rounded-md"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age:</Label>
              <Input
                id="age"
                name="age"
                type="number"
                value={formData.age}
                onChange={handleChange}
                className="w-full bg-gray-100 rounded-md"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Area:</Label>
              <Input
                id="area"
                name="area"
                value={formData.area}
                onChange={handleChange}
                className="w-full bg-gray-100 rounded-md"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary">Salary:</Label>
              <Input
                id="salary"
                name="salary"
                type="number"
                value={formData.salary}
                onChange={handleChange}
                className="w-full bg-gray-100 rounded-md"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobTimeFrom">Job Time From:</Label>
              <Input
                id="jobTimeFrom"
                name="jobTimeFrom"
                type="time"
                value={formData.jobTimeFrom}
                onChange={handleChange}
                className="w-full bg-gray-100 rounded-md"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobTimeTo">Job Time To:</Label>
              <Input
                id="jobTimeTo"
                name="jobTimeTo"
                type="time"
                value={formData.jobTimeTo}
                onChange={handleChange}
                className="w-full bg-gray-100 rounded-md"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="joiningDate">Joining Date:</Label>
              <Input
                id="joiningDate"
                name="joiningDate"
                type="date"
                value={formData.joiningDate}
                onChange={handleChange}
                className="w-full bg-gray-100 rounded-md"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="leavesAllocated">Leaves Allocated:</Label>
              <Input
                id="leavesAllocated"
                name="leavesAllocated"
                type="number"
                value={formData.leavesAllocated}
                onChange={handleChange}
                className="w-full bg-gray-100 rounded-md"
              />
            </div>

            <div className="space-y-2">
              <Label>Upload Profile Picture</Label>
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="profilePicture"
                  className="flex flex-col items-center justify-center w-full cursor-pointer text-center py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  <Upload className="h-5 w-5 mb-1" />
                  <span>Upload Profile Picture</span>
                  <Input
                    id="profilePicture"
                    name="profilePicture"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "profilePicture")}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Upload Documents</Label>
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="documents"
                  className="flex flex-col items-center justify-center w-full cursor-pointer text-center py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  <Upload className="h-5 w-5 mb-1" />
                  <span>Upload Documents</span>
                  <Input
                    id="documents"
                    name="documents"
                    type="file"
                    multiple
                    onChange={(e) => handleFileChange(e, "documents")}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="submit"
              className="w-full bg-black text-white hover:bg-gray-800"
            >
              SUBMIT
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StaffFormModal;
