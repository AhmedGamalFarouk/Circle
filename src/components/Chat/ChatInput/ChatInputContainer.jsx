// libs
import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
// hooks
import { useAutoDir } from "../../../hooks/useAutoDir";
import { useAuth } from "../../../hooks/useAuth";
import { useVoiceRecording } from "../../../hooks/chathooks/useVoiceRecording";
import { useMediaUpload } from "../../../hooks/chathooks/useMediaUpload";
import { useChatTypingIndicator } from "../../../hooks/chathooks/useChatTyping";
import { useMessageManager } from "../../../hooks/chathooks/useMessageManager";
import { useReplyEditMutualExclusion } from "../../../hooks/chathooks/useReplyEditMutualExclusion";
import { useMediaHandlers } from "../../../hooks/chathooks/useMediaHandlers";
import { useVoiceHandlers } from "../../../hooks/chathooks/useVoiceHandlers";
import { useMessageHandlers } from "../../../hooks/chathooks/useMessageHandlers";
import { usePollModal } from "../../../hooks/chathooks/usePollModal";
import { useTranslation } from "react-i18next";
// components
import ChatInputPresentational from "./ChatInputPresentational";
import Modal from "../../ui/Modal/Modal";
import NotMemberModalContainer from "../../ui/Modal/NotMemberModal/NotMemberModalContainer";

function ChatInputContainer({
  circleName,
  circleId,
  replyTo,
  setReplyTo,
  editingMessage,
  setEditingMessage,
}) {
  const { dir, handleAutoDir } = useAutoDir();
  const { userId, userName } = useAuth();
  const { t } = useTranslation();
  // Custom hooks
  const voiceRecording = useVoiceRecording();
  const mediaUpload = useMediaUpload();
  const typing = useChatTypingIndicator(circleId, userId, userName);
  const photoUrl = useSelector(
    (state) => state.userProfile?.profile?.photoUrl
  );
  console.log(photoUrl);

  const messageManager = useMessageManager(
    circleId,
    circleName,
    userId,
    userName,
    photoUrl // <-- add this argument
  );

  const pollModal = usePollModal();
  const mediaHandlers = useMediaHandlers(
    mediaUpload,
    circleId,
    userId,
    userName,
    replyTo,
    setReplyTo,
    messageManager,
  );
  const voiceHandlers = useVoiceHandlers(
    voiceRecording,
    circleId,
    userId,
    userName,
    replyTo,
    setReplyTo,
    messageManager,
  );
  const messageHandlers = useMessageHandlers(
    messageManager,
    typing,
    replyTo,
    setReplyTo,
    editingMessage,
    setEditingMessage,
    handleAutoDir,
    openNotMemberModal,
  );

  useReplyEditMutualExclusion(
    replyTo,
    setReplyTo,
    editingMessage,
    setEditingMessage,
    messageManager,
  );

  useEffect(() => {
    messageManager.adjustHeight();
  }, [messageManager]);

  useEffect(() => {
    return () => {
      typing.cleanup();
    };
  }, [typing]);

  const members = useSelector(
    (state) => state.members?.membersByCircle?.[circleId] || [],
  );
  const isMember = members.some(
    (member) => member.id === userId || member.uid === userId,
  );
  // Until members load, isMember is false even for members, so sending would
  // wrongly open the Join Circle modal and drop the message.
  const membersLoaded = useSelector(
    (state) => state.members?.membersByCircle?.[circleId] !== undefined,
  );
  const notMemberModalRef = useRef();
  function openNotMemberModal() {
    notMemberModalRef.current.open();
  }
  function closeNotMemberModal() {
    notMemberModalRef.current.close();
  }

  return (
    <div className="flex max-w-full flex-col overflow-hidden px-2 py-2">
      {replyTo && (
        <div className="bg-primary/10 border-primary mb-2 flex max-w-full items-center gap-2 overflow-hidden rounded-lg border px-3 py-2">
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="max-w-[120px] truncate">
              <span className="text-primary truncate font-bold">
                {replyTo.userName || "User"}
              </span>
            </div>
            <div className="max-w-[180px] truncate">
              <span className="text-secondary truncate">
                {replyTo.messageType === "audio"
                  ? t("Voice message")
                  : replyTo.messageType === "image"
                    ? t("Photo")
                    : replyTo.messageType === "video"
                      ? t("Video")
                      : replyTo.text}
              </span>
            </div>
          </div>
          <button
            className="bg-secondary hover:bg-main ltr:ml-2 rtl:mr-2 flex-shrink-0 rounded px-2 py-1 text-xs text-text"
            onClick={() => setReplyTo(null)}
            type="button"
          >
            {t("Cancel")}
          </button>
        </div>
      )}
      {editingMessage && (
        <div className="bg-accent/10 border-accent mb-2 flex max-w-full items-center gap-2 overflow-hidden rounded-lg border px-3 py-2">
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="max-w-[120px] truncate">
              <span className="text-accent truncate font-bold">
                {t("Editing message")}
              </span>
            </div>
            <div className="max-w-[180px] truncate">
              <span className="text-secondary truncate">
                {editingMessage.text}
              </span>
            </div>
          </div>
          <button
            className="bg-secondary hover:bg-main ltr:ml-2 rtl:mr-2 flex-shrink-0 rounded px-2 py-1 text-xs text-text"
            onClick={messageHandlers.handleCancelEdit}
            type="button"
          >
            {t("Cancel")}
          </button>
        </div>
      )}
      <Modal ref={notMemberModalRef}>
        <NotMemberModalContainer onClose={closeNotMemberModal} />
      </Modal>
      <ChatInputPresentational
        pollModalRef={pollModal.pollModalRef}
        handleOpenPollModal={pollModal.handleOpenPollModal}
        handleClosePollModal={pollModal.handleClosePollModal}
        msgVal={messageManager.msgVal}
        handleSendMsg={messageHandlers.handleSendMsg}
        handleInput={messageHandlers.handleInput}
        handleKeyDown={messageHandlers.handleKeyDown}
        dir={dir}
        isEditing={!!editingMessage}
        hasText={messageManager.hasText || !!editingMessage}
        // Voice recording props
        isRecording={voiceRecording.isRecording}
        recordingTime={voiceRecording.recordingTime}
        audioStream={voiceRecording.audioStream}
        startRecording={voiceHandlers.startRecording}
        stopRecording={voiceHandlers.stopRecording}
        cancelRecording={voiceHandlers.cancelRecording}
        // Media upload props
        isUploading={mediaUpload.isUploading || voiceRecording.isUploading}
        uploadProgress={mediaUpload.uploadProgress}
        handleMediaUpload={mediaHandlers.handleMediaUpload}
        showMediaMenu={mediaUpload.showMediaMenu}
        setShowMediaMenu={mediaUpload.setShowMediaMenu}
        handleCameraCapture={mediaHandlers.handleCameraCapture}
        handleImageUpload={mediaHandlers.handleImageUpload}
        handleVideoUpload={mediaHandlers.handleVideoUpload}
        showCameraModal={mediaUpload.showCameraModal}
        closeCameraModal={mediaHandlers.closeCameraModal}
        handleCapturedPhoto={mediaHandlers.handleCapturedPhoto}
        isMember={isMember}
        disabled={!membersLoaded}
      />
    </div>
  );
}

export default ChatInputContainer;
