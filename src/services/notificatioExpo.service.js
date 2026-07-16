  import { Expo } from "expo-server-sdk";

  const expo = new Expo();

  class NotificationService {
    async sendNotification({ expoPushToken, title, body, data = {} }) {
      if (!expoPushToken) {
        throw new Error("expoPushToken is required");
      }

      if (!Expo.isExpoPushToken(expoPushToken)) {
        throw new Error("Invalid Expo Push Token");
      }

      const messages = [
        {
          to: expoPushToken,
          sound: "default",
          title: title || "",
          body: body || "",
          data,
        },
      ];

      const chunks = expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      }

      return tickets;
    }

    async sendBulkNotifications(users = []) {
      const messages = users
        .filter(
          (user) =>
            user?.expoPushToken && Expo.isExpoPushToken(user.expoPushToken)
        )
        .map((user) => ({
          to: user.expoPushToken,
          sound: "default",
          title: user.title || "",
          body: user.body || "",
          data: user.data || {},
        }));

      if (!messages.length) {
        return [];
      }

      const chunks = expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      }

      return tickets;
    }
  }

  export default new NotificationService();