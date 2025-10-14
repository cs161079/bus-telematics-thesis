import { Injectable } from "@angular/core";
import { PushNotifications, PushNotificationSchema, RegistrationError, Token } from "@capacitor/push-notifications";
import { FCM } from "@capacitor-community/fcm";

@Injectable()
export class PushNotificationsService {
  constructor(
  ) {

  }

  async requestNotificationPermissions() {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      throw new Error('User denied permissions!');
    }
  }

  async  registerPushNotificationForUser() {
    PushNotifications.register();
    PushNotifications.addListener("registrationError", (error: RegistrationError) => {
      console.log("Error occured on notification registration -> " + JSON.stringify(error));
    });
    PushNotifications.addListener("registration", async(token: Token) => {

      const firebaseToken = await FCM.getToken();
      console.log("Firebase Notification Token ", firebaseToken);
      // Κάνουμε subscribe το topic το username του χειριστή.
      FCM.subscribeTo({topic: "bus-telematics"})
        .then((r) => {console.log("subscribed to topic.")})
        .catch((err) => {console.log(err);});
    });

    PushNotifications.addListener('pushNotificationReceived', async (notification: PushNotificationSchema) => {
      console.log('Notification received in foreground', notification);
      // this.zone.run(async () => {
        // console.log("🚀 ~ Notifcation Received ~ event", notification.body);
        // const alert = await this.alertCtrl.create({
        //   header: "On ReceiveNotification",
        //   message: notification.body
        // });
        // await alert.present();

      // });
    });

    PushNotifications.addListener('pushNotificationActionPerformed', async (notification) => {
      console.log('Notification on action perfomred', notification);
      // this.zone.run(async () => {
        console.log("🚀 ~ Notification Action Performed ~ event", notification.notification.data);
      // });
    });

  }
}
