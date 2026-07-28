import { createClient } from '@sanity/client';

const rawProjectId = import.meta.env.VITE_SANITY_PROJECT_ID?.trim();
const projectId = rawProjectId && rawProjectId !== 'yourSanityProjectId' ? rawProjectId : undefined;
const dataset = import.meta.env.VITE_SANITY_DATASET?.trim() || 'production';

export const isSanityConfigured = Boolean(projectId);

if (!isSanityConfigured) {
  console.warn(
    'Sanity is not configured. Articles will use fallback content until VITE_SANITY_PROJECT_ID is set in .env.'
  );
}

export const client = isSanityConfigured
  ? createClient({
      projectId,
      dataset,
      useCdn: true,
      apiVersion: '2024-06-18',
    })
  : {
      fetch: async () => [],
    };