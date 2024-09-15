import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Input } from "@/src/components/ui/input"
import { Button } from "@/src/components/ui/button"
import api from '../api';

const schema = z.object({
  termType: z.string().min(1, "Please select a term type"),
  name: z.string().min(1, "Term name is required"),
  amount: z.string().optional(),
  validUntil: z.string().min(1, "Valid until date is required"),
  adminPassword: z.string().min(1, "Admin password is required"),
});

function AddTerm() {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const termType = watch('termType');

  const handleAddTerm = async (data) => {
    try {
      // First, authenticate as admin
      const authResponse = await api.post('/admin/auth', { adminPassword: data.adminPassword });
      if (authResponse.data.success) {
        // If authentication successful, proceed to add the term
        await api.post('/admin/addterm', data);
        alert('Term added successfully');
      } else {
        alert('Admin authentication failed');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to add term');
    }
  };

  return (
    <form onSubmit={handleSubmit(handleAddTerm)} className="space-y-4">
      <Select onValueChange={(value) => setValue('termType', value)}>
        <SelectTrigger>
          <SelectValue placeholder="Select term type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="waiver">Waiver</SelectItem>
          <SelectItem value="payment">Payment</SelectItem>
        </SelectContent>
      </Select>
      {errors.termType && <p className="text-red-500">{errors.termType.message}</p>}

      <Input {...register('name')} placeholder="Term Name" />
      {errors.name && <p className="text-red-500">{errors.name.message}</p>}

      {termType === 'payment' && (
        <Input {...register('amount')} type="number" placeholder="Amount" />
      )}
      {errors.amount && <p className="text-red-500">{errors.amount.message}</p>}

      <Input {...register('validUntil')} type="date" />
      {errors.validUntil && <p className="text-red-500">{errors.validUntil.message}</p>}

      <Input 
        type="password" 
        placeholder="Admin Password" 
        {...register('adminPassword')}
      />
      {errors.adminPassword && <p className="text-red-500">{errors.adminPassword.message}</p>}

      <Button type="submit">Add Term</Button>
    </form>
  );
}

export default AddTerm;