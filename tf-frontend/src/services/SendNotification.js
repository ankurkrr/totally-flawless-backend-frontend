// Direct FCM HTTP v1 calls from the client are disallowed.
// Use the backend notification endpoint which holds service account credentials.
export async function sendNotification() {
  throw new Error('sendNotification removed from client. Call backend /send-notification instead.');
}



