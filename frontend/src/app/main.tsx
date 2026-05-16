import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "../assets/styles/index.css";
// Providers in requested order
import { ThemeProvider } from "../contexts/ThemeContext";
import { SnackbarProvider } from "../contexts/SnackbarContext";
import { AuthProvider } from "../contexts/AuthContext";
import { ProductProvider } from "../contexts/ProductContext"; // Keeping jsx for now if not refactored
import { Toaster } from "sonner"; // Visual toast component

createRoot(document.getElementById("root")!).render(
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <SnackbarProvider>
            <AuthProvider>
                <ProductProvider>
                    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                        <Toaster /> {/* Toaster is part of the visual layer, usually inside Theme/Snack */}
                        <App />
                    </BrowserRouter>
                </ProductProvider>
            </AuthProvider>
        </SnackbarProvider>
    </ThemeProvider>
);
