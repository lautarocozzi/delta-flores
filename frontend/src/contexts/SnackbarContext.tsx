import React, { createContext, useContext, useState } from 'react';
import { toast } from 'sonner'; // We use sonner as it is already installed

// Define Context
const SnackbarContext = createContext<any>(null);

// Provider Component
export const SnackbarProvider = ({ children }: { children: React.ReactNode }) => {

    // Function to show toast, matching a generic 'showSnackbar' or similar from mold
    const showSnackbar = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        if (type === 'success') toast.success(message);
        else if (type === 'error') toast.error(message);
        else toast.info(message);
    };

    return (
        <SnackbarContext.Provider value={{ showSnackbar }}>
            {children}
            {/* We place the Toaster here so it is available globally as requested */}
            {/* Note: In main.tsx we often place Toaster at top level too, but provider wraps it logic */}
        </SnackbarContext.Provider>
    );
};

// Hook
export const useSnackbar = () => useContext(SnackbarContext);
