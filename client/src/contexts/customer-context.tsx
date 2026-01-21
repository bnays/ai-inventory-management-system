"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { apiRequest } from '@/lib/api-client';

interface Customer {
  customer_id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface CustomerContextType {
  customers: Customer[];
  loading: boolean;
  fetchCustomers: () => Promise<void>;
  addCustomer: (data: any) => Promise<void>;
  updateCustomer: (id: number, data: any) => Promise<void>;
  deleteCustomer: (id: number) => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/customers');
      setCustomers(data.data || data || []);
    } catch (error) {
      console.error("Failed to fetch customers", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addCustomer = async (data: any) => {
    await apiRequest('/customers', { method: 'POST', body: JSON.stringify(data) });
    await fetchCustomers();
  };

  const updateCustomer = async (id: number, data: any) => {
    await apiRequest(`/customers/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    await fetchCustomers();
  };

  const deleteCustomer = async (id: number) => {
    await apiRequest(`/customers/${id}`, { method: 'DELETE' });
    await fetchCustomers();
  };

  return (
    <CustomerContext.Provider value={{ customers, loading, fetchCustomers, addCustomer, updateCustomer, deleteCustomer }}>
      {children}
    </CustomerContext.Provider>
  );
}

export const useCustomers = () => {
  const context = useContext(CustomerContext);
  if (!context) throw new Error("useCustomers must be used within CustomerProvider");
  return context;
};