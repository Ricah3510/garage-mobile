package com.garage.simulation;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import com.getcapacitor.PushNotifications;

public class MyFirebaseMessagingService extends FirebaseMessagingService {

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        // Forward the message to Capacitor PushNotifications plugin
        PushNotifications.fireNotification(remoteMessage);
    }
}
