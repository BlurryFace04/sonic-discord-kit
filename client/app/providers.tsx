"use client"

import { PrivyProvider } from "@privy-io/react-auth";

export const PrivyAuthProvider = ({ children }: { children: React.ReactNode }) => (
  <PrivyProvider
    appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
    config={{
      embeddedWallets: {
        solana: {
          createOnLogin: "all-users"
        },
        ethereum: {
          createOnLogin: "off"
        }
      }
    }}
  >
    {children}
  </PrivyProvider>
);
