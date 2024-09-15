import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../api';
import { formatPUID } from '../utils/puidFormatter';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/src/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";

const formSchema = z.object({
  termName: z.string().min(1, "Please select a term"),
  puid: z.string().regex(/^\d{10}$/, "PUID must be 10 digits")
});

function Payments() {
  const [terms, setTerms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      termName: "",
      puid: "",
    },
  });

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const response = await api.get('/paymentterms');
        setTerms(response.data);
      } catch (error) {
        console.error('Error fetching payment terms:', error);
      }
    };
    fetchTerms();
  }, []);

  const onSubmit = async (values) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/payments', { ...values, puid: formatPUID(values.puid) });
      setResult(response.data);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">Payments</h1>
      
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="termName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Term</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a term" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {terms.map((term) => (
                      <SelectItem key={term.name} value={term.name}>
                        {term.name}: ${term.amount}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="puid"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PUID</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter PUID (10 digits)" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Submit'}
          </Button>
        </form>
      </Form>

      {result && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Result:</h2>
          <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default Payments;