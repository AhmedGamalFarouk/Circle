// libs
import { useState, useEffect, useRef } from "react";
import useContextMenu from "../../../hooks/chathooks/useContextMenu";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebase-config";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../hooks/useAuth";
import Skeleton from "@mui/material/Skeleton";

// Components
import ChatMessaagePresentational from "./ChatMessagePresentational";
import Modal from "../../ui/Modal/Modal";
import MessageInfoModalContainer from "../../ui/Modal/MessageInfoModal/MessageInfoModalContainer";
import TypingIndicatorContainer from "../TypingIndicator/TypingIndicatorContainer";

// Utils and Hooks
import { getMessageRadius } from "../../../utils/chatutils/MessageBorderDir";
import {
  getUserColor,
  canEditMessage,
  formatMessageDate,
  shouldShowDateSeparator,
  scrollToMessage,
  handleDownloadMedia,
} from "../../../utils/chatutils/messageUtils";
import {
  handleReact,
  handleDeleteMessage,
  handleEditMessage,
  handleOpenModal,
  handleCloseModal,
} from "../../../utils/chatutils/messageActions";
import { useTypingIndicator } from "../../../hooks/chathooks/useTypingIndicator";
import { useAutoScroll } from "../../../hooks/chathooks/useAutoScroll";
import { useMessageSeen } from "../../../hooks/chathooks/useMessageSeen";
function ChatMessageContainer({ circleId, setReplyTo, setEditingMessage }) {
  const messagesEndRef = useRef(null);
  const deleteModalRefs = useRef({});
  const messageRefs = useRef({});
  const containerRef = useRef(null);
  const messageInfoModalRef = useRef(null);
  const { userName, userId } = useAuth();
  const currentUser = { id: userId, username: userName };
  const { i18n } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);

  // Custom hooks for complex functionality
  const { typingUsers } = useTypingIndicator(circleId, userId);
  useAutoScroll(messages, messagesEndRef);
  useMessageSeen(circleId, userId, userName, messageRefs, messages);

  const {
    menu,
    setMenu,
    menuDirection,
    handleContextMenu: handleContextMenuRaw,
  } = useContextMenu();

  // Context menu handler
  const handleContextMenu = (e, msg) => {
    handleContextMenuRaw(e, msg);
  };

  // Wrapper functions that use our utility functions
  const handleReactWrapper = (messageId, emoji) =>
    handleReact(messageId, emoji, circleId, userId, setError);

  const handleDeleteMessageWrapper = (messageId, deleteOption) =>
    handleDeleteMessage(messageId, deleteOption, circleId, userId, setError);

  const handleEditMessageWrapper = (message) =>
    handleEditMessage(message, setEditingMessage);

  const handleOpenModalWrapper = (messageId) =>
    handleOpenModal(messageId, deleteModalRefs);

  const handleCloseModalWrapper = (messageId) =>
    handleCloseModal(messageId, deleteModalRefs);

  const scrollToMessageWrapper = (messageId) =>
    scrollToMessage(messageId, messageRefs);

  const getUserColorWrapper = (userId) => getUserColor(userId);

  const canEditMessageWrapper = (message) => canEditMessage(message, userId);

  // *REAL TIME MESSAGING
  useEffect(() => {
    if (!circleId) return;
    setLoading(true);
    setError(null);
    const q = query(
      collection(db, "circles", circleId, "chat"),
      orderBy("timeStamp"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const filteredMessages = allMessages.filter((msg) => {
          const deletedFor = msg.deletedFor || [];
          return !deletedFor.includes(userId);
        });
        setMessages(filteredMessages);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [circleId, userId]);

  //* Prevent scrolling when context menu is open
  useEffect(() => {
    if (menu.visible) {
      // Store original styles
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;

      // Prevent scroll event handler
      const preventScroll = (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      };

      // Prevent touch scroll on mobile
      const preventTouchMove = (e) => {
        e.preventDefault();
      };

      // Disable scrolling completely
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";

      // Add event listeners to prevent scroll
      window.addEventListener("scroll", preventScroll, { passive: false });
      window.addEventListener("wheel", preventScroll, { passive: false });
      window.addEventListener("touchmove", preventTouchMove, {
        passive: false,
      });
      document.addEventListener("scroll", preventScroll, { passive: false });

      // Cleanup function to restore scrolling
      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;

        // Remove event listeners
        window.removeEventListener("scroll", preventScroll);
        window.removeEventListener("wheel", preventScroll);
        window.removeEventListener("touchmove", preventTouchMove);
        document.removeEventListener("scroll", preventScroll);
      };
    }
  }, [menu.visible]);

  function handleAction(action, message) {
    const targetMessage = message || menu.message;
    if (!targetMessage) return;
    const messageType = targetMessage.messageType;

    if (action === "reply") {
      if (typeof setReplyTo === "function") setReplyTo(targetMessage);
    }
    if (action === "edit") {
      // Only allow edit for text messages or messages without messageType (default to text)
      if (
        (!messageType || messageType === "text") &&
        canEditMessageWrapper(targetMessage)
      ) {
        handleEditMessageWrapper(targetMessage);
      }
    }
    if (action === "download") {
      // Download media files (images, videos, audio)
      if (["image", "video", "audio"].includes(messageType)) {
        handleDownloadMedia(targetMessage);
      }
    }
    if (action === "react-close") {
      // Close menu after reaction is selected
    }
    if (action === "info") {
      // Show message info modal for own messages
      if (targetMessage.user.userId === userId) {
        setSelectedMessage(targetMessage);
        messageInfoModalRef.current?.open();
      }
    }
    setMenu((m) => ({ ...m, visible: false }));
  }

  function handleCloseInfoModal() {
    messageInfoModalRef.current?.close();
    setSelectedMessage(null);
  }
  const [contextMenuMsg, setContextMenuMsg] = useState(null);

  const handleMessageContextMenu = (e, msg, x, y) => {
    // Use touch coordinates if available
    const menuWidth = 300; // or your actual menu width
    const menuHeight = 180; // or your actual menu height
    const padding = 8;

    // Clamp x
    let left = x;
    if (left + menuWidth > window.innerWidth - padding) left = window.innerWidth - menuWidth - padding;
    if (left < padding) left = padding;

    // Clamp y
    let top = y;
    if (top + menuHeight > window.innerHeight - padding) top = window.innerHeight - menuHeight - padding;
    if (top < padding) top = padding;

    setContextMenuMsg({ visible: true, message: msg, x: left, y: top });
  };
  // Message skeleton component
  const MessageSkeleton = ({ isMe }) => (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`flex max-w-[85%] sm:max-w-lg ${isMe ? "items-end" : "items-start"} gap-2`}
      >
        {!isMe && (
          <Skeleton
            sx={{ bgcolor: "var(--color-inputsBg)" }}
            animation="wave"
            variant="circular"
            width={32}
            height={32}
          />
        )}
        <div className="flex flex-col gap-1">
          {!isMe && (
            <Skeleton
              sx={{ bgcolor: "var(--color-inputsBg)" }}
              animation="wave"
              variant="text"
              width={80}
              height={16}
            />
          )}
          <Skeleton
            sx={{ bgcolor: "var(--color-inputsBg)" }}
            animation="wave"
            variant="rounded"
            width={Math.random() * 200 + 100}
            height={40}
          />
        </div>
      </div>
    </div>
  );

  // Loading skeleton for messages
  const MessagesLoadingSkeleton = () => (
    <div className="space-y-3 px-4 py-2">
      <MessageSkeleton isMe={false} />
      <MessageSkeleton isMe={true} />
      <MessageSkeleton isMe={false} />
      <MessageSkeleton isMe={true} />
      <MessageSkeleton isMe={false} />
    </div>
  );

  const dir = i18n.language === "ar" ? "rtl" : "ltr";
  return (
    <>
      {loading ? (
        <MessagesLoadingSkeleton />
      ) : error ? (
        <div className="py-4 text-center text-red-500">{error}</div>
      ) : (
        <div
          className="flex min-h-0 flex-1 flex-col overflow-y-auto"
          ref={containerRef}
        >
          <div className="flex min-h-full flex-1 flex-col justify-end">
            <ChatMessaagePresentational
              handleReact={handleReactWrapper}
              deleteModalRefs={deleteModalRefs}
              onDeleteMessage={handleDeleteMessageWrapper}
              messages={messages}
              messagesEndRef={messagesEndRef}
              currentUser={currentUser}
              getUserColor={getUserColorWrapper}
              getMessageRadius={(args) => getMessageRadius({ ...args, dir })}
              dir={dir}
              onMessageContextMenu={handleContextMenu}
              handleAction={handleAction}
              menu={menu}
              menuDirection={menuDirection}
              canEditMessage={canEditMessageWrapper}
              open={handleOpenModalWrapper}
              close={handleCloseModalWrapper}
              formatMessageDate={formatMessageDate}
              shouldShowDateSeparator={shouldShowDateSeparator}
              messageRefs={messageRefs}
              scrollToMessage={scrollToMessageWrapper}
              contextMenuMsg={contextMenuMsg}
              handleMessageContextMenu={handleMessageContextMenu}
              setContextMenuMsg={setContextMenuMsg}
            />
          </div>
        </div>
      )}

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <TypingIndicatorContainer typingUsers={typingUsers} />
      )}

      {/* Message Info Modal */}
      <Modal ref={messageInfoModalRef}>
        {selectedMessage && (
          <MessageInfoModalContainer
            message={selectedMessage}
            circleId={circleId}
            onClose={handleCloseInfoModal}
          />
        )}
      </Modal>
    </>
  );
}

export default ChatMessageContainer;
