import React from 'react';
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface AttendanceData {
  id: number;
  name: string;
  dates: string[];
}

const mockAttendanceData: AttendanceData[] = [
  { id: 10001, name: "Neil Borah", dates: Array(30).fill("P") },
  { id: 10002, name: "Jatin Yadav", dates: Array(30).fill("P") },
  { id: 10003, name: "Meher Khan", dates: Array(30).fill("P") },
  { id: 10004, name: "Neil Borah", dates: Array(30).fill("P") },
  { id: 10005, name: "Neil Borah", dates: Array(30).fill("P") },
];

const DataTab = () => {
  return (
    <TabsContent value="data" className="p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Attendance Data</h2>
        <div className="flex gap-4 mb-4">
          <Button variant="outline">Daily</Button>
          <Button variant="outline">Weekly</Button>
          <Button variant="outline">Monthly</Button>
          <Button variant="outline">Custom Range</Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border px-4 py-2 text-left">Emp ID</th>
              <th className="border px-4 py-2 text-left">Name</th>
              {Array.from({ length: 30 }, (_, i) => (
                <th key={i} className="border px-4 py-2 text-center">
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockAttendanceData.map((employee) => (
              <tr key={employee.id}>
                <td className="border px-4 py-2">{employee.id}</td>
                <td className="border px-4 py-2">{employee.name}</td>
                {employee.dates.map((status, idx) => (
                  <td key={idx} className="border px-4 py-2 text-center">
                    {status}
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
