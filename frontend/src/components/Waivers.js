import React, { useState, useEffect } from 'react';
import api from '../api';
import { formatPUID } from '../utils/puidFormatter';
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/src/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

const formSchema = z.object({
  term: z.string().min(1, "Please select a term"),
  puid: z.string().regex(/^\d{1,10}$/, "PUID must be 1-10 digits"),
  name: z.string().optional(),
  email: z.string().email().optional(),
})

function Waivers() {
  const [terms, setTerms] = useState([]);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      term: "",
      puid: "",
      name: "",
      email: "",
    },
  })

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/terms');
      setTerms(response.data);
    } catch (error) {
      console.error('Failed to fetch terms:', error);
      setError('Failed to load terms. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (values) => {
    setIsLoading(true);
    setError(null);
    try {
      const paddedPUID = values.puid.padStart(10, '0');
      const formattedPUID = formatPUID(paddedPUID);
      // First, create or update the member
      const memberResponse = await api.post('/members', {
        puid: formattedPUID,
        name: values.name,
        email: values.email,
      });
      console.log('Member created/updated:', memberResponse.data);

      // Then, create the waiver
      const waiverResponse = await api.post('/waivers', {
        termName: values.term,
        puid: formattedPUID,
      });
      setResult({
        member: memberResponse.data,
        waiver: waiverResponse.data,
      });
    } catch (error) {
      console.error('Failed to process waiver:', error);
      setError(error.message || 'Failed to process waiver. Please try again later.');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Waivers</h1>
      {error && <p className="text-red-500">{error}</p>}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="term"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Term</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a term" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {terms.map((term) => (
                        <SelectItem key={term.name} value={term.name}>
                          {term.name}
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
                    <Input
                      {...field}
                      placeholder="Enter PUID (1-10 digits)"
                      type="text"
                      inputMode="numeric"
                      pattern="\d*"
                      maxLength={10}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button type="submit" disabled={isLoading}>Submit</Button>
        </form>
      </Form>
      {isLoading && <p>Processing...</p>}
      {result && (
        <div>
          <h2>Result:</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default Waivers;