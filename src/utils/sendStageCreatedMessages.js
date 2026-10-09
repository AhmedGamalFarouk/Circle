import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase-config";

export const sendStageCreatedMessages = async (circleId, stages) => {
  if (!circleId || !stages) return;

  const chatRef = collection(db, "circles", circleId, "chat");

  const stageNames = {
    activity: "Activity stage created!",
    place: "Place stage created!",
    time: "Who's coming stage created!",
  };

  try {
    for (const [stageKey] of Object.entries(stages)) {
      const stageNameMessage = stageNames[stageKey] || `Stage "${stageKey}" created!`;

      await addDoc(chatRef, {
        messageType: "system",
        text: `🔹 ${stageNameMessage}`,
        timestamp: serverTimestamp(),
        timeStamp: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error sending stage created messages:", error);
  }
};
