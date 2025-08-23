import React, { useState } from 'react';
import { TabsContent } from "@/components/ui/tabs";
import StaffTable from "../StaffTable";
import StaffFormModal, { StaffFormData } from "../StaffFormModal";
import { Button } from "../ui/button";
import { Dialog, DialogTrigger } from "../ui/dialog";

const StaffInfoTab = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleSubmit = (data: StaffFormData) => {
    // Handle form submission
    console.log('New staff data:', data);
    setIsCreateModalOpen(false);
  };

  return (
    <TabsContent value="staff" className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Staff Management</h2>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>Add Staff</Button>
          </DialogTrigger>
          <StaffFormModal
            open={isCreateModalOpen}
            onOpenChange={setIsCreateModalOpen}
            onSubmit={handleSubmit}
          />
        </Dialog>
      </div>
      <StaffTable />
    </TabsContent>
  );
};

export default StaffInfoTab;
