import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/src/components/ui/form";
import logo from '../logo.png';

// Define the schema for form validation
const formSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

function Login() {
  const auth = useAuth();
  const navigate = useNavigate();

  // Initialize the form with react-hook-form and zod resolver
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
    },
  });

  const onSubmit = async (values) => {
    if (auth && auth.login) {
      const success = await auth.login(values.password);
      if (success) {
        navigate('/checkmember');  // Change this line
      } else {
        form.setError('password', { type: 'manual', message: 'Incorrect password' });
      }
    } else {
      alert('Authentication service not available');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <img src={logo} alt="Logo" className="w-32 h-32" />
        </div>
        <h1 className="text-2xl font-bold text-center">Login</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">Login</Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

export default Login;