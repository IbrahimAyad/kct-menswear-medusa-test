"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { NotificationContainer } from "@/components/notifications/NotificationContainer";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { CoreCartProvider } from "@/contexts/CoreCartContext";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <CoreCartProvider>
          {children}
          <NotificationContainer />
        </CoreCartProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}