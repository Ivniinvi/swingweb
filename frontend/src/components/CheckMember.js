import React, { useState, useEffect, useRef, useCallback } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../api';
import { formatPUID } from '../utils/puidFormatter';
import { Input } from "@/src/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/src/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";

const formSchema = z.object({
  puid: z.string().regex(/^\d{1,10}$/, { message: "PUID must be up to 10 digits" })
});

function CheckMember() {
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastSubmissionTime = useRef(0);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      puid: '',
    },
  });

  const checkMembership = async (puid) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const formattedPUID = formatPUID(puid.padStart(10, '0'));
      const response = await api.post('/checkmember', { puid: formattedPUID });
      setResult({ ...response.data, puid: formattedPUID });
    } catch (error) {
      console.error('Query failed:', error);
      setError(error.message || 'Failed to check membership. Please try again.');
    } finally {
      setIsLoading(false);
      form.reset();
    }
  };

  const debouncedSubmit = useCallback((puid) => {
    const now = Date.now();
    if (now - lastSubmissionTime.current > 1000) {
      lastSubmissionTime.current = now;
      if (puid.length > 0) {
        checkMembership(puid);
      }
    }
  }, []);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const currentPUID = form.getValues().puid;
      debouncedSubmit(currentPUID);
    }
  };

  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name === 'puid' && value.puid.length === 10) {
        debouncedSubmit(value.puid);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, debouncedSubmit]);

  useEffect(() => {
    if (!isLoading) {
      form.setFocus("puid");
    }
  }, [isLoading, form]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100';
      case 'warning_issued': return 'bg-orange-100';
      case 'warning_active': return 'bg-orange-100';
      case 'warning_expired': return 'bg-red-100';
      case 'unpaid': return 'bg-orange-100';
      case 'no_waiver': return 'bg-red-100';
      case 'inactive': return 'bg-red-100';
      case 'not_found': return 'bg-red-100';
      default: return 'bg-white';
    }
  };

  return (
    <div className="flex justify-center items-center h-full py-8">
      <Card className={`w-[350px] ${result ? getStatusColor(result.status) : ''}`}>
        <CardHeader>
          <CardTitle>Check Membership</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Form {...form}>
            <form className="space-y-4">
              <FormField
                control={form.control}
                name="puid"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter PUID (10 digits)"
                        disabled={isLoading}
                        onKeyDown={handleKeyDown}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          field.onChange(value.slice(0, 10));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
          {result && (
            <div className="mt-4">
              <h2 className="text-xl font-bold">PUID: {result.puid}</h2>
              {result.name && <h3 className="text-lg">Name: {result.name}</h3>}
              <p className="font-bold">
                {result.message}
              </p>
              {(result.status === 'warning_issued' || result.status === 'warning_active') && (
                <p className="font-bold">
                  Member allowed entry this time.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CheckMember;