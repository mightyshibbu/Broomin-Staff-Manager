import React from 'react';
import { TabsContent } from "@/components/ui/tabs";

interface SalaryData {
  id: number;
  name: string;
  workingDays: number;
  salary: number;
  deductions: number;
  netSalary: number;
}

const mockSalaryData: SalaryData[] = [
  {
    id: 10001,
    name: "Neil Borah",
    workingDays: 26,
    salary: 14000,
    deductions: 0,
    netSalary: 14000,
  },
  {
    id: 10002,
    name: "Jatin Yadav",
    workingDays: 26,
    salary: 14000,
    deductions: 0,
    netSalary: 14000,
  },
  {
    id: 10003,
    name: "Meher Khan",
    workingDays: 26,
    salary: 14000,
    deductions: 0,
    netSalary: 14000,
  },
  {
    id: 10004,
    name: "Neil Borah",
    workingDays: 26,
    salary: 14000,
    deductions: 0,
    netSalary: 14000,
  },
  {
    id: 10005,
    name: "Neil Borah",
    workingDays: 26,
    salary: 14000,
    deductions: 0,
    netSalary: 14000,
  },
];

const SalariesTab = () => {
  return (
    <TabsContent value="salaries" className="p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Salary Information</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border px-4 py-2 text-left">Emp ID</th>
              <th className="border px-4 py-2 text-left">Name</th>
              <th className="border px-4 py-2 text-center">Working Days</th>
              <th className="border px-4 py-2 text-center">Salary</th>
              <th className="border px-4 py-2 text-center">Deductions</th>
              <th className="border px-4 py-2 text-center">Net Salary</th>
            </tr>
          </thead>
          <tbody>
            {mockSalaryData.map((employee) => (
              <tr key={employee.id}>
                <td className="border px-4 py-2">{employee.id}</td>
                <td className="border px-4 py-2">{employee.name}</td>
                <td className="border px-4 py-2 text-center">
                  {employee.workingDays}
                </td>
                <td className="border px-4 py-2 text-center">
                  {employee.salary}
                </td>
                <td className="border px-4 py-2 text-center">
                  {employee.deductions}
                </td>
                <td className="border px-4 py-2 text-center">
                  {employee.netSalary}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TabsContent>
  );
};

export default SalariesTab;
