import React from 'react';
import { TabsContent } from "@/components/ui/tabs";
import AttendanceTracker from "../AttendanceTracker";

const AttendanceTab = () => {
  return (
    <TabsContent value="attendance" className="p-4">
      <AttendanceTracker />
    </TabsContent>
  );
};

export default AttendanceTab;
