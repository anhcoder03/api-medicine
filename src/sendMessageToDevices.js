import admin from "firebase-admin";
import { getMessaging } from "firebase-admin/messaging";
import serviceAccount from "./fpoly-medipro-firebase-adminsdk-3cdj6-31c8d73a7b.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export async function sendMessageToDevices(tokens, title, body, link) {
  const message = {
    tokens: tokens,
    data: {
      link: link,
      title: title,
      body: body,
    },
  };

  try {
    const response = await getMessaging().sendMulticast(message);
    console.log("Successfully sent message:", response);
  } catch (error) {
    console.log("Error sending message:", error);
  }
}
