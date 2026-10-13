import { User, Trash2 } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function CircleCardPresentational({
  hasImage,
  members,
  membersLoaded = true,
  displayedInterests,
  activeTab,
  user,
  handleJoinRequest,
  isRequestPending,
  circle,
  membersByCircle,
  isOwner,
  openDeleteCircleModal,
  sendingRequestId
}) {
  const { t } = useTranslation();
  return (
    <>
      <div
        className="group relative flex w-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-3xl p-3 transition-all duration-300 hover:shadow-xl sm:p-4 md:p-5"
        style={{
          background: `radial-gradient(ellipse at top,var(--color-main-card-top)   0%, var(--color-main-card)  60%)`,
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(172, 159, 250, 0.15)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* Shiny hover effect */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-[50%] -left-[150%] h-[200%] w-[60%] rotate-[25deg] transform bg-gradient-to-r from-transparent via-[rgba(172,159,250,0.2)] to-transparent opacity-0 transition-[opacity_transform] duration-900 group-hover:left-[150%] group-hover:opacity-100"></div>
        </div>

        {/* Content container */}
        <div className="relative z-10">
          <div className="flex justify-between gap-2">
            <div className="mb-2 flex items-center space-x-2 sm:mb-4 sm:space-x-4">
              <div className="border-primary flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border sm:h-12 sm:w-12">
                {hasImage ? (
                  <img
                    className="h-full w-full rounded-full object-cover"
                    src={circle.imageUrl}
                    alt={circle.circleName}
                  />
                ) : (
                  <span
                    className="text-text text-xl font-bold select-none"
                    style={{ fontFamily: "var(--font-secondary)" }}
                  >
                    {circle.circleName?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                )}
              </div>
              <div>
                <h3
                  className="text-base font-bold text-primary sm:text-lg break-words max-w-[240px] truncate"
                  title={circle.circleName}
                >
                  {circle.circleName}
                </h3>
                <p
                  className="mt-1 flex items-center text-xs sm:text-sm"
                  style={{ color: "var(--color-secondary)" }}
                >
                  <User className="ltr:mr-1.5 rtl:ml-1.5 h-3.5 w-3.5" />
                  {membersLoaded
                    ? <>{members.length} {members.length === 1 ? t("Member") : t("Members")}</>
                    : <span aria-hidden="true">…</span>}
                </p>
              </div>
            </div>
            {isOwner && (
              <button
                className="text-secondary bg-secondary/10 ml-0 sm:ml-2 hover:scale-110 transition-transform p-2 rounded-full self-start"
                onClick={(e) => {
                  e.stopPropagation();
                  openDeleteCircleModal(circle);
                }}
                title="Delete Circle"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
          <p
            className="mb-1.5 line-clamp-2 text-xs leading-relaxed sm:text-sm break-words max-w-[250px]"
            style={{ color: "rgba(173, 186, 199, 0.95)" }}
            title={circle.description}
          >
            {circle.description}
          </p>
          {activeTab === "forYou" && (
            <>
              <div className="mt-2 mb-2 flex flex-wrap gap-2">
                {displayedInterests.map((interest) => (
                  <span
                    key={interest}
                    className="border-primary text-primary mb-2 rounded-3xl border px-2 py-1 text-xs sm:text-sm"
                  >
                    {interest}
                  </span>
                ))}
                {circle.interests.length > 4 && (
                  <span className="border-primary text-primary mb-2 rounded-3xl border px-2 py-1 text-xs sm:text-sm">
                    +{circle.interests.length - 4} {t("more")}
                  </span>
                )}
              </div>
              {!(membersByCircle?.[circle.id] || []).some(
                (member) => member.id === user?.uid,
              ) && (
                  <button
                    className="relative w-full overflow-hidden rounded-2xl border border-primary bg-transparent py-2 text-xs font-medium text-primary transition-all duration-300 hover:bg-[rgba(172,159,250,0.15)] sm:py-2.5 sm:text-sm cursor-pointer"
                    onClick={(e) => handleJoinRequest(circle.id, e)}
                  >
                    {sendingRequestId === circle.id
                      ? t("Sending Request...")
                      : isRequestPending ? t("Request Sent") : t("Join Circle")}
                  </button>
                )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
