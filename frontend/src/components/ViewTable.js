import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Button } from "@/src/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table"
import { Input } from "@/src/components/ui/input"
import api from '../api';

const schema = z.object({
  tableName: z.string().min(1, "Please select a table"),
  adminPassword: z.string().min(1, "Admin password is required"),
});

function ViewTable() {
  const [tableData, setTableData] = useState(null);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const handleViewTable = async (data) => {
    try {
      // First, authenticate as admin
      const authResponse = await api.post('/admin/auth', { adminPassword: data.adminPassword });
      if (authResponse.data.success) {
        // If authentication successful, proceed to fetch table data
        const response = await api.post('/admin/viewtable', { 
          tableName: data.tableName,
          adminPassword: data.adminPassword  // Include admin password in this request as well
        });
        setTableData(response.data);
      } else {
        alert('Admin authentication failed');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to fetch table data');
    }
  };

  const downloadCSV = () => {
    if (!tableData || tableData.length === 0) return;

    const headers = Object.keys(tableData[0]);
    const csvContent = [
      headers.join(','),
      ...tableData.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${schema.tableName}_data.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(handleViewTable)} className="space-y-4">
        <Select onValueChange={(value) => setValue('tableName', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select a table" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="members">Members</SelectItem>
            <SelectItem value="waivers">Waivers</SelectItem>
            <SelectItem value="payments">Payments</SelectItem>
            <SelectItem value="signins">Sign-ins</SelectItem>
            <SelectItem value="warnings">Warnings</SelectItem>
          </SelectContent>
        </Select>
        {errors.tableName && <p className="text-red-500">{errors.tableName.message}</p>}

        <Input 
          type="password" 
          placeholder="Admin Password" 
          {...register('adminPassword')}
        />
        {errors.adminPassword && <p className="text-red-500">{errors.adminPassword.message}</p>}

        <Button type="submit">View Table</Button>
      </form>

      {tableData && (
        <>
          <Button onClick={downloadCSV}>Download CSV</Button>
          <Table>
            <TableHeader>
              <TableRow>
                {Object.keys(tableData[0]).map(key => <TableHead key={key}>{key}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((row, index) => (
                <TableRow key={index}>
                  {Object.values(row).map((value, i) => <TableCell key={i}>{value}</TableCell>)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  );
}

export default ViewTable;