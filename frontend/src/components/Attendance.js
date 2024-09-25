import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import api from '../api';

const schema = z.object({
  date: z.string().min(1, "Date is required"),
  adminPassword: z.string().min(1, "Admin password is required"),
});

function Attendance() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const fetchAttendance = async (data) => {
    try {
      // First, authenticate as admin
      const authResponse = await api.post('/admin/auth', { adminPassword: data.adminPassword });
      if (authResponse.data.success) {
        // If authentication successful, proceed to fetch attendance data
        const response = await api.post('/admin/attendance', { 
          date: data.date,
          adminPassword: data.adminPassword  // Include admin password in this request as well
        });
        setAttendanceData(response.data);
        setError('');
      } else {
        setError('Admin authentication failed');
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError('Failed to fetch attendance data');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Attendance</h2>
      <form onSubmit={handleSubmit(fetchAttendance)} className="space-y-4">
        <Input
          type="date"
          {...register('date')}
          className="border rounded p-2 mr-2"
        />
        {errors.date && <p className="text-red-500">{errors.date.message}</p>}

        <Input 
          type="password" 
          placeholder="Admin Password" 
          {...register('adminPassword')}
        />
        {errors.adminPassword && <p className="text-red-500">{errors.adminPassword.message}</p>}

        <Button type="submit">Fetch Attendance</Button>
      </form>
      
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {attendanceData.length > 0 && (
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Name</th>
              <th className="border p-2">PUID</th>
              <th className="border p-2">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {attendanceData.map((entry, index) => (
              <tr key={index}>
                <td className="border p-2">{entry.name}</td>
                <td className="border p-2">{entry.puid}</td>
                <td className="border p-2">{new Date(entry.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Attendance;
