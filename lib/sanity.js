import { createClient } from '@sanity/client';

export const sanityClient = createClient({
  projectId: '08gwx5vw',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-06-18',
  useCdn: true,
  ignoreBrowserTokenWarning: true,
});
