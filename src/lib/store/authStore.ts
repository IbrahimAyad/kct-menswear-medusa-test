import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { medusa } from "@/lib/medusa/client";

interface Customer {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  billing_address: any | null;
  shipping_addresses: any[];
  created_at: string;
  updated_at: string;
  metadata: Record<string, any> | null;
}

interface AuthState {
  customer: Customer | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  register: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      customer: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          // Use Medusa 2.0 SDK auth method - returns only token
          const result = await medusa.auth.login(
            "customer",
            "emailpass",
            {
              email,
              password
            }
          );

          // The result is the token string directly
          const token = result.token || result;

          if (token && typeof token === 'string') {
            // Store token for API calls
            localStorage.setItem("medusa_token", token);

            // Set the token in Medusa client for future requests
            if (medusa.auth.setToken_) {
              medusa.auth.setToken_('customer', token);
            }

            // Try to fetch customer data
            let customer = null;
            try {
              const customerResult = await medusa.store.customer.retrieve();
              customer = customerResult.customer;
            } catch (customerError) {
              console.log("Customer record not found for this auth identity");
              // The backend should have created this
              // For now, create a placeholder object
              customer = {
                id: '',
                email: email,
                first_name: null,
                last_name: null,
                phone: null,
                billing_address: null,
                shipping_addresses: [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                metadata: null
              };
            }

            // Store auth state
            set({
              customer: customer as Customer,
              isAuthenticated: true,
              token
            });

            return { success: true, message: "Welcome back to KCT Menswear!" };
          } else {
            throw new Error('Invalid credentials');
          }
        } catch (error: any) {
          console.error("Login error:", error);

          // User-friendly error messages
          let errorMessage = "Unable to sign in";
          if (error?.message?.includes('Unauthorized') || error?.message?.includes('401')) {
            errorMessage = "Invalid email or password. Please try again.";
          } else if (error?.message?.includes('network')) {
            errorMessage = "Network error. Please check your connection.";
          } else if (error?.message) {
            errorMessage = error.message;
          }

          return { success: false, error: errorMessage };
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          // Use Medusa 2.0 SDK to create customer - returns only token
          const result = await medusa.auth.register(
            "customer",
            "emailpass",
            {
              email: data.email,
              password: data.password,
              first_name: data.first_name || "",
              last_name: data.last_name || ""
            }
          );

          // The result is the token string directly
          const token = result.token || result;

          if (token && typeof token === 'string') {
            // Store token for API calls
            localStorage.setItem("medusa_token", token);

            // Set the token in Medusa client for future requests
            if (medusa.auth.setToken_) {
              medusa.auth.setToken_('customer', token);
            }

            // Try to fetch customer data after registration
            // Note: Medusa backend should auto-create customer records
            let customer = null;
            try {
              const customerResult = await medusa.store.customer.retrieve();
              customer = customerResult.customer;
              console.log("Customer record retrieved successfully");
            } catch (customerError) {
              console.log("Customer record not immediately available after registration");
              // The backend should be creating this automatically
              // For now, create a placeholder object
              customer = {
                id: '',
                email: data.email,
                first_name: data.first_name || null,
                last_name: data.last_name || null,
                phone: null,
                billing_address: null,
                shipping_addresses: [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                metadata: null
              };
            }

            // Store auth state
            set({
              customer: customer as Customer,
              isAuthenticated: true,
              token
            });

            return {
              success: true,
              message: "Welcome to KCT Menswear! Your account has been created successfully."
            };
          } else {
            throw new Error('No token received from registration');
          }
        } catch (error: any) {
          console.error("Registration error:", error);

          // User-friendly error messages
          let errorMessage = "Unable to create account";

          if (error?.message?.includes('already exists') || error?.message?.includes('duplicate')) {
            errorMessage = "This email is already registered. Please sign in instead.";
          } else if (error?.message?.includes('password')) {
            errorMessage = "Password must be at least 8 characters long.";
          } else if (error?.message?.includes('email')) {
            errorMessage = "Please enter a valid email address.";
          } else if (error?.message?.includes('network')) {
            errorMessage = "Network error. Please check your connection.";
          } else if (error?.message) {
            errorMessage = error.message;
          }

          return { success: false, error: errorMessage };
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          // Clear token from localStorage
          localStorage.removeItem("medusa_token");

          // Clear auth state
          set({
            customer: null,
            isAuthenticated: false,
            token: null
          });

          // Optionally call logout endpoint
          try {
            await medusa.auth.logout();
          } catch (e) {
            // Ignore logout errors
          }
        } catch (error) {
          console.error("Logout error:", error);
        }
      },

      checkAuth: async () => {
        try {
          const token = localStorage.getItem("medusa_token");
          if (token) {
            // Set the token in Medusa client
            if (medusa.auth.setToken_) {
              medusa.auth.setToken_('customer', token);
            }

            // Try to fetch customer data
            const { customer } = await medusa.store.customer.retrieve();

            if (customer) {
              set({
                customer: customer as Customer,
                isAuthenticated: true,
                token
              });
            }
          }
        } catch (error) {
          // If token is invalid, clear auth state
          localStorage.removeItem("medusa_token");
          set({
            customer: null,
            isAuthenticated: false,
            token: null
          });
        }
      }
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        customer: state.customer,
        isAuthenticated: state.isAuthenticated,
        token: state.token
      })
    }
  )
);