// Client-side access token fetching removed. Use the backend to obtain and manage
// any OAuth tokens required for server-to-server communication.
export async function fetchAccessToken() {
  throw new Error('fetchAccessToken removed from client. Use backend notification endpoint instead.');
}
