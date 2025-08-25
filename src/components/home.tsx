import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import AttendanceTab from "./tabs/AttendanceTab";
import StaffInfoTab from "./tabs/StaffInfoTab";
import DataTab from "./tabs/DataTab";
import SalariesTab from "./tabs/SalariesTab";

const validTabs = ["attendance", "staff", "data", "salaries"];

const Home = () => {
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const activeTab = validTabs.includes(tab || "") ? tab : "attendance";

  useEffect(() => {
    if (!validTabs.includes(tab || "")) {
      navigate("/attendance", { replace: true });
    }
  }, [tab, navigate]);

  const handleTabChange = (value: string) => {
    navigate(`/${value}`);
  };

  return (
    
      
        
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
              <TabsList className="grid grid-cols-4 w-full max-w-3xl mx-auto bg-white">
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                <TabsTrigger value="staff">Staff Info</TabsTrigger>
                <TabsTrigger value="data">Data</TabsTrigger>
                <TabsTrigger value="salaries">Salaries</TabsTrigger>
              </TabsList>
            </div>
            
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
              <div className="space-y-6">
                {activeTab === 'attendance' && <AttendanceTab key="attendance" />}
                {activeTab === 'staff' && <StaffInfoTab key="staff" />}
                {activeTab === 'data' && <DataTab key="data" />}
                {activeTab === 'salaries' && <SalariesTab key="salaries" />}
              </div>
            </div>
          </Tabs>
       
      
    
  );
};

export default Home;
