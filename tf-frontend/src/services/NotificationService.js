
// Stubbed NotificationService to prevent crashes after Firebase removal

export async function requestUserPermission() {
    console.log("NotificationService: requestUserPermission stub called.");
    return Promise.resolve();
}

export const notificationListeners = () => {
    console.log("NotificationService: notificationListeners stub called.");
    return () => { };
};
