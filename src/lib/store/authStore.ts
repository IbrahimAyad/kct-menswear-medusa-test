import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { medusa } from "@/lib/medusa/client";

interface Customer {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  has_account: boolean;
  created_at: string;
  metadata?: Record<string, any>;
}

interface AuthStore {
  customer: Customer | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { email: string; password: string; first_name?: string; last_name?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Customer>) => Promise<void>;
  refreshCustomer: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      customer: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,

      login: async (email: string, password: string) => {
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

            // Now fetch the customer data
            const { customer } = await medusa.store.customer.retrieve();

            // Store auth state
            set({
              customer: customer as Customer,
              isAuthenticated: true,
              token
            });

            return { success: true };
          } else {
            throw new Error('No token received from login');
          }
        } catch (error: any) {
          console.error("Login error:", error);
          const errorMessage = error.message || "Invalid credentials";
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

            // Now fetch the customer data
            const { customer } = await medusa.store.customer.retrieve();

            // Store auth state
            set({
              customer: customer as Customer,
              isAuthenticated: true,
              token
            });

            return { success: true };
          } else {
            throw new Error('No token received from registration');
          }
        } catch (error: any) {
          console.error("Registration error:", error);
          let errorMessage = "Registration failed";
          if (error?.message?.includes('already exists')) {
            errorMessage = 'An account with this email already exists';
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
          // Call Medusa logout
          await medusa.auth.logout();
        } catch (error) {
          console.error("Logout error:", error);
        }

        // Clear auth state
        set({
          customer: null,
          isAuthenticated: false,
          token: null
        });

        // Clear stored token
        localStorage.removeItem("medusa_token");

        // Clear cart data
        localStorage.removeItem("medusa_cart_id");
        localStorage.removeItem("kct-cart-storage");
      },

      updateProfile: async (data: Partial<Customer>) => {
        const { customer } = get();
        if (!customer) throw new Error("Not authenticated");

        set({ isLoading: true });
        try {
          // Use Medusa 2.0 SDK to update customer
          const updatedCustomer = await medusa.store.customer.update({
            first_name: data.first_name,
            last_name: data.last_name,
            phone: data.phone,
            metadata: data.metadata
          });

          set({ customer: updatedCustomer.customer as Customer });
        } catch (error) {
          console.error("Update profile error:", error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      refreshCustomer: async () => {
        try {
          // Use Medusa 2.0 SDK to get current customer
          const { customer } = await medusa.store.customer.retrieve();

          if (customer) {
            set({
              customer: customer as Customer,
              isAuthenticated: true
            });
          }
        } catch (error) {
          console.error("Refresh customer error:", error);
          // If refresh fails, user is not authenticated
          set({
            customer: null,
            isAuthenticated: false,
            token: null
          });
        }
      },

      checkAuth: async () => {
        // Check if we have a stored token
        const storedToken = localStorage.getItem("medusa_token");
        if (!storedToken) {
          set({
            customer: null,
            isAuthenticated: false,
            token: null
          });
          return;
        }

        try {
          // Set the token in Medusa client before making requests
          if (medusa.auth.setToken_) {
            medusa.auth.setToken_('customer', storedToken);
          }

          // Try to get customer with stored token
          const { customer } = await medusa.store.customer.retrieve();

          if (customer) {
            set({
              customer: customer as Customer,
              isAuthenticated: true,
              token: storedToken
            });
          }
        } catch (error) {
          console.error("Auth check failed:", error);
          // Token is invalid, clear auth state
          set({
            customer: null,
            isAuthenticated: false,
            token: null
          });
          localStorage.removeItem("medusa_token");
        }
      },
    }),
    {
      name: "kct-auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        customer: state.customer,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);