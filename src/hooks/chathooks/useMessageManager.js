import { useState, useRef, useCallback } from "react";
import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase-config";
import { sendNotificationMembers } from "../../fire_base/circleController/circleController";
import { createNotification } from "../../fire_base/notificationController/notificationController";
export function useMessageManager(circleId, circleName, userId, userName, photoUrl) {
  const [hasText, setHasText] = useState(false);
  const msgVal = useRef();

  // Format time without periods in AM/PM
  const formatTime = () => {
    const now = new Date();
    return now
      .toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .replace(/\./g, ""); // Remove periods from AM/PM
  };

  const sendTextMessage = useCallback(
    async (text, replyTo = null) => {
      if (!text.trim()) return;

      try {
        console.log(photoUrl);

        await addDoc(collection(db, "circles", circleId, "chat"), {
          messageType: "text",
          user: {
            userId: userId,
            imageurl: photoUrl || "",
            userName: userName
          },
          sentTime: formatTime(),
          text: text.trim(),
          timestamp: serverTimestamp(),
          timeStamp: serverTimestamp(),
          replyTo: replyTo
            ? {
              id: replyTo.id || replyTo.messageId || null,
              messageId: replyTo.id || replyTo.messageId || null,
              userName: replyTo.user?.userName || replyTo.user?.username || replyTo.userName || replyTo.username || null,
              username: replyTo.user?.userName || replyTo.user?.username || replyTo.userName || replyTo.username || null,
              text: replyTo.text ?? null, // Use null if text is missing
              messageType: replyTo.messageType ?? null,
            }
            : null,
        });
        const newNotification = await createNotification({
          circleName: circleName,
          circleId: circleId,
          type: "message",
          title: `Message from ${userName}`,
          link: `circles/${circleId}`,
          message: text,
          senderId: userId,
          avatar: photoUrl,
          isRead: false,
        });
        await sendNotificationMembers(circleId, userId, newNotification);
      } catch (error) {
        console.error("Message send error:", error);
        throw error;
      }
    },
    [circleId, userId, userName, photoUrl],
  );

  const editMessage = useCallback(
    async (messageId, newText) => {
      try {
        const messageRef = doc(db, "circles", circleId, "chat", messageId);
        await updateDoc(messageRef, {
          text: newText.trim(),
          edited: true,
          editedAt: new Date(),
        });
      } catch (error) {
        console.error("Edit message error:", error);
        throw error;
      }
    },
    [circleId],
  );

  const adjustHeight = useCallback(() => {
    const textarea = msgVal.current;
    if (!textarea) return;

    textarea.style.height = "auto"; // Reset the height
    const lineHeight = 24;
    const maxLines = 6;
    const maxHeight = lineHeight * maxLines;

    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;

    textarea.style.overflowY =
      textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, []);

  const clearInput = useCallback(() => {
    if (msgVal.current) {
      msgVal.current.value = "";
      setHasText(false);
      adjustHeight();
    }
  }, [adjustHeight]);

  const setInputValue = useCallback(
    (value) => {
      if (msgVal.current) {
        msgVal.current.value = value;
        setHasText(value.trim().length > 0);
        adjustHeight();
      }
    },
    [adjustHeight],
  );

  const handleInput = useCallback(
    (e) => {
      setHasText(e.target.value.trim().length > 0);
      adjustHeight();
    },
    [adjustHeight],
  );

  return {
    hasText,
    msgVal,
    sendTextMessage,
    editMessage,
    adjustHeight,
    clearInput,
    setInputValue,
    handleInput,
    formatTime,
  };
}
