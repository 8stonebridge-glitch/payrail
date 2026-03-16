import { ConvexReactClient } from 'convex/react';

export const convexUrl = import.meta.env.VITE_CONVEX_URL;

export const convexClient = convexUrl ? new ConvexReactClient(convexUrl) : null;

