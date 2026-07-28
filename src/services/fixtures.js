export async function fetchFixtures() {
  const response = await fetch('/api/fixtures');
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error || 'Could not fetch fixtures');
  }

  return response.json();
}
