import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "@/lib/convex-clerk-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Payrail — Approval & Disbursement Platform",
  description:
    "Multi-company, policy-driven approvals and disbursement platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          <ConvexProviderWithClerk>{children}</ConvexProviderWithClerk>
        </ClerkProvider>
      </body>
    </html>
  );
}
