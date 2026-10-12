import DeleteBtn from "../../ui/ReactBits/DeleteBtn/DeleteBtn";
import VoiceWaveform from "../../ui/VoiceWaveform/VoiceWaveform";
import CameraView from "../../ui/CameraView/CameraViewPresentational";
import Skeleton from "@mui/material/Skeleton";
import { Mic, Paperclip, Camera, Image, Send, Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
function ChatInputPresentational({
  msgVal,
  handleSendMsg,
  handleInput,
  handleKeyDown,
  dir,
  isEditing,
  hasText,
  isRecording,
  recordingTime,
  audioStream,
  startRecording,
  stopRecording,
  cancelRecording,
  isUploading,
  uploadProgress,
  handleMediaUpload,
  showMediaMenu,
  setShowMediaMenu,
  handleCameraCapture,
  handleImageUpload,
  showCameraModal,
  closeCameraModal,
  handleCapturedPhoto,
  handleVideoUpload, // Add this prop for video upload
  disabled,
}) {
  const mediaMenuRef = useRef(null);
  const { t } = useTranslation();
  // Close media menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        mediaMenuRef.current &&
        !mediaMenuRef.current.contains(event.target)
      ) {
        setShowMediaMenu(false);
      }
    }

    if (showMediaMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showMediaMenu, setShowMediaMenu]);
  const [direction, setDirection] = useState(document.documentElement.dir || "ltr");

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDirection(document.documentElement.dir || "ltr");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["dir"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative">
      {/* Show Camera View when camera is active, otherwise show chat input */}
      {showCameraModal ? (
        <CameraView
          isOpen={showCameraModal}
          onClose={closeCameraModal}
          onCapture={handleCapturedPhoto}
        />
      ) : (
        <>
          {/* Recording Overlay - WhatsApp style with waveform */}
          {isRecording && (
            <div className="bg-main/95 absolute inset-0 z-50 flex items-center justify-between rounded-4xl px-4 backdrop-blur-sm">
              <VoiceWaveform
                isRecording={isRecording}
                recordingTime={recordingTime}
                audioStream={audioStream}
              />
              <div className="flex items-center gap-3">
                <DeleteBtn onDelete={cancelRecording} />
                <button
                  onClick={stopRecording}
                  className="bg-primary hover:bg-primary/80 flex h-12 w-12 items-center justify-center rounded-full text-text transition-colors"
                  title="Send recording"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          )}

          <form
            onSubmit={(e) => handleSendMsg(e)}
            className="bg-main/10 shadow-2xl inset-shadow-xs inset-shadow-secondary flex items-center rounded-4xl p-2"
          >
            <textarea
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              dir={dir}
              ref={msgVal}
              className="bg-inputsBg text-text w-full resize-none overflow-y-auto rounded-4xl p-2 ltr:mr-2 rtl:ml-2"
              rows={1}
              placeholder={
                isEditing ? "Edit your message..." : "Type a message..."
              }
              disabled={isRecording || disabled}
            />
            {hasText || isEditing ? (
              <button
                type="submit"
                className="bg-primary hover:bg-primary/80 flex h-12 w-12 items-center justify-center rounded-full text-text transition-colors"
                title={isEditing ? t("Save Cshanges") : t("Send message")}
              >
                <Send size={20} />
              </button>
            ) : (
              <div
                className="relative flex items-center gap-2"
                style={{ visibility: isRecording ? "hidden" : "visible" }}
              >
                {/* Media Upload Button with Dropup Menu */}
                <div className="relative" ref={mediaMenuRef}>
                  {/* Dropup Menu - Context Menu Style */}
                  {showMediaMenu && (
                    <div
                      className="bg-main border-primary/20 fixed z-[9999] min-w-[140px] rounded-lg border py-1 shadow-lg"
                      style={{
                        bottom: "70px",
                        ...(direction === "rtl" ? { left: "20px" } : { right: "20px" }),
                      }}
                    >
                      <button
                        onClick={handleCameraCapture}
                        className="hover:bg-primary/10 text-primary flex w-full items-center gap-3 px-3 py-2 ltr:text-left rtl:text-right transition-colors"
                        type="button"
                      >
                        <Camera size={16} />
                        <span className="text-sm">{t("Camera")}</span>
                      </button>
                      <button
                        onClick={handleImageUpload}
                        className="hover:bg-primary/10 text-primary flex w-full items-center gap-3 px-3 py-2 ltr:text-left rtl:text-right transition-colors"
                        type="button"
                      >
                        <Image size={16} />
                        <span className="text-sm">{t("Gallery")}</span>
                      </button>
                      {/* Add this for video upload */}
                      <button
                        onClick={handleVideoUpload} // You need to implement this handler
                        className="hover:bg-primary/10 text-primary flex w-full items-center gap-3 px-3 py-2 ltr:text-left rtl:text-right transition-colors"
                        type="button"
                      >
                        <Video size={16} /> {/* Import Video icon from lucide-react */}
                        <span className="text-sm">{t("Video")}</span>
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handleMediaUpload}
                    className="bg-secondary/10 hover:bg-secondary/20 text-secondary hover:text-main border-secondary/20 hover:border-secondary/40 flex h-12 w-12 items-center justify-center rounded-full border transition-all duration-200"
                    title="Upload media"
                    type="button"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      uploadProgress.total > 1 ? (
                        <div className="flex flex-col items-center">
                          <Skeleton
                            sx={{ bgcolor: "var(--color-secondary)" }}
                            animation="wave"
                            variant="circular"
                            width={20}
                            height={20}
                          />
                          <span className="text-secondary/80 mt-0.5 text-[8px]">
                            {uploadProgress.current}/{uploadProgress.total}
                          </span>
                        </div>
                      ) : (
                        <Skeleton
                          sx={{ bgcolor: "var(--color-secondary)" }}
                          animation="wave"
                          variant="circular"
                          width={20}
                          height={20}
                        />
                      )
                    ) : (
                      <Paperclip size={20} />
                    )}
                  </button>
                </div>

                <button
                  onClick={startRecording}
                  className="bg-secondary/10 hover:bg-secondary/20 text-secondary hover:text-main border-secondary/20 hover:border-secondary/40 flex h-12 w-12 items-center justify-center rounded-full border transition-all duration-200"
                  title="Record voice message"
                  type="button"
                >
                  <Mic size={20} />
                </button>
              </div>
            )}
          </form>
        </>
      )}
    </div>
  );
}

export default ChatInputPresentational;
