"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useNotification } from '@/lib/notification';
import { GlobalSnackbar } from '@/components/core/global-snackbar';

interface PurchaseContextType {
    purchases: any[];
    loading: boolean;
    fetchPurchases: (page?: number) => Promise<void>;
    createPurchase: (data: any) => Promise<void>;
    receiveOrder: (id: number) => Promise<void>;
    meta: { totalPages: number; currentPage: number; totalItems: number };
}

const PurchaseContext = createContext<PurchaseContextType | undefined>(undefined);

export const PurchaseProvider = ({ children }: { children: React.ReactNode }) => {
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(false);
    const [meta, setMeta] = useState({ totalPages: 1, currentPage: 1, totalItems: 0 });
    const { notification, showNotification, hideNotification } = useNotification();

    const fetchPurchases = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const response = await apiRequest(`/purchases?page=${page}&limit=10`);
            setPurchases(response.data);
            setMeta(response.meta);
        } catch (error: any) {
            showNotification(error.message || "Failed to load purchases", "error");
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    const createPurchase = async (data: any) => {
        setLoading(true);
        try {
            await apiRequest('/purchases', { method: 'POST', body: JSON.stringify(data) });
            showNotification("Purchase order created successfully", "success");
            await fetchPurchases(1);
        } catch (error: any) {
            showNotification(error.message || "Error creating purchase", "error");
        } finally {
            setLoading(false);
        }
    };

    const receiveOrder = async (id: number) => {
        try {
            // Triggers the MySQL Transaction to increment stock
            await apiRequest(`/purchases/${id}/receive`, { method: 'PATCH' });
            showNotification("Inventory updated: Items received", "success");
            await fetchPurchases(meta.currentPage);
        } catch (error: any) {
            showNotification(error.message || "Error receiving stock", "error");
        }
    };

    return (
        <PurchaseContext.Provider value={{ purchases, loading, fetchPurchases, createPurchase, receiveOrder, meta }}>
            {children}
            <GlobalSnackbar state={notification} onClose={hideNotification} />
        </PurchaseContext.Provider>
    );
};

export const usePurchases = () => {
    const context = useContext(PurchaseContext);
    if (!context) throw new Error("usePurchases must be used within a PurchaseProvider");
    return context;
};