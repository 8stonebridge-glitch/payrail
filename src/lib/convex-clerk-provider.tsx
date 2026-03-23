"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk as BaseConvexProviderWithClerk } from "convex/react-clerk";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL ?? "https://placeholder.convex.cloud"
);

export function ConvexProviderWithClerk({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BaseConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </BaseConvexProviderWithClerk>
  );
}
