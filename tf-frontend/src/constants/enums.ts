export enum asynchEnums {
    ACCESS_TOKEN = "ACCESS_TOKEN",
    USER_ID = "USER_ID",
    USER_INFO = "USER_INFO",
    LOGIN_INFO = "LOGIN_INFO",
    FIREBASE_TOKEN = 'fcmToken',
    ORDER_DATA = 'orderData',
    ACCEPTED_USER_ORDER='AcceptedOrder',
    SPLASH = 'splash',
    CART_BOOKING='CART_BOOKING',
    SEND_NOTI_ARTIST="SEND_NOTI_ARTIST",
    CART_ID="CART_ID"
}

export enum bookingStatusEnums {
    PENDING = "pending",
    CONFIRMED = "confirmed",
   
    // ONGOING = "ongoing",
    // UPCOMING = "upcoming",
    COMPLETED = "completed",
    DECLINED = "declined",
    CANCELLED = "cancelled",
    ACCEPTED="accepted",
}

export enum bookingType {
    NOW = "now",
    LATER = "later",
    VIRTUAL = "virtual",
}

export enum serviceType {
    VIRTUAL = "VIRTUAL",
    LOCATION = "LOCATION",
}

