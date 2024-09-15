import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Input } from "@/src/components/ui/input"
import { Button } from "@/src/components/ui/button"
import api from '../api';

const schema = z.object({
  type: z.string().min(1, "Please select a password type"),
  value: z.string().min(8, "Password must be at least 8 characters"),
  adminPassword: z.string().min(1, "Admin password is required"),
});

function ChangePassword() {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const handleChangePassword = async (data) => {
    try {
      // First, authenticate as admin
      const authResponse = await api.post('/admin/auth', { adminPassword: data.adminPassword });
      if (authResponse.data.success) {
        // If authentication successful, proceed to change the password
        await api.post('/admin/changepassword', data);
        alert('Password changed successfully');
      } else {
        alert('Admin authentication failed');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to change password');
    }
  };

  return (
    <form onSubmit={handleSubmit(handleChangePassword)} className="space-y-4">
      <Select onValueChange={(value) => setValue('type', value)}>
        <SelectTrigger>
          <SelectValue placeholder="Select password type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="password">Site Password</SelectItem>
          <SelectItem value="adminpassword">Admin Password</SelectItem>
        </SelectContent>
      </Select>
      {errors.type && <p className="text-red-500">{errors.type.message}</p>}

      <Input {...register('value')} type="password" placeholder="New Password" />
      {errors.value && <p className="text-red-500">{errors.value.message}</p>}

      <Input 
        type="password" 
        placeholder="Current Admin Password" 
        {...register('adminPassword')}
      />
      {errors.adminPassword && <p className="text-red-500">{errors.adminPassword.message}</p>}

      <Button type="submit">Change Password</Button>
    </form>
  );
}

export default ChangePassword;