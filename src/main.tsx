import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/auth/auth-context";
import { appRouter } from "@/routes/app-router";
import "@/index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000
    }
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={appRouter} />
        <Toaster
          richColors
          position="top-right"
          toastOptions={{
            className: "surface-glass text-foreground"
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
