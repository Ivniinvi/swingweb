import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import ViewTable from './ViewTable';
import AddTerm from './AddTerm';
import ChangePassword from './ChangePassword';

function AdminPanel() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
      <Tabs defaultValue="view-table">
        <TabsList>
          <TabsTrigger value="view-table">View Table</TabsTrigger>
          <TabsTrigger value="add-term">Add New Term</TabsTrigger>
          <TabsTrigger value="change-password">Change Password</TabsTrigger>
        </TabsList>
        <TabsContent value="view-table"><ViewTable /></TabsContent>
        <TabsContent value="add-term"><AddTerm /></TabsContent>
        <TabsContent value="change-password"><ChangePassword /></TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminPanel;