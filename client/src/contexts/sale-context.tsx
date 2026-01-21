"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useNotification } from '@/lib/notification';
import { GlobalSnackbar } from '@/components/core/global-snackbar';

interface SaleContextType {
    sales: any[];
    loading: boolean;
    fetchSales: (page?: number) => Promise<void>;
    createSale: (saleData: any) => Promise<void>;
    meta: { totalPages: number; currentPage: number; totalItems: number };
}

const SaleContext = createContext<SaleContextType | undefined>(undefined);

export const SaleProvider = ({ children }: { children: React.ReactNode }) => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(false);
    const [meta, setMeta] = useState({ totalPages: 1, currentPage: 1, totalItems: 0 });
    const { notification, showNotification, hideNotification } = useNotification();

    const fetchSales = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const response = await apiRequest(`/sales?page=${page}&limit=10`);
            setSales(response.data);
            setMeta(response.meta);
        } catch (error: any) {
            showNotification("Error loading sales history", "error");
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    const createSale = async (saleData: any) => {
        setLoading(true);
        try {
            // Triggers backend transaction to deduct quantity_on_hand
            await apiRequest('/sales', { method: 'POST', body: JSON.stringify(saleData) });
            showNotification("Sale completed and stock deducted", "success");
            await fetchSales(1);
        } catch (error: any) {
            showNotification(error.message || "Insufficient stock or sale error", "error");
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return (
        <SaleContext.Provider value={{ sales, loading, fetchSales, createSale, meta }}>
            {children}
            <GlobalSnackbar state={notification} onClose={hideNotification} />
        </SaleContext.Provider>
    );
};

export const useSales = () => {
    const context = useContext(SaleContext);
    if (!context) throw new Error("useSales must be used within a SaleProvider");
    return context;
};