// Client-side JWT generation for FCM was removed.
// Generating signed JWTs using service account private keys must only occur on the server.
// This module is left as a stub to surface accidental client usage.
export async function generateJWT() {
  throw new Error('generateJWT removed from client. Use backend /send-notification endpoint instead.');
}
