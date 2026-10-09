import React from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, UserCheck, Calendar } from "lucide-react";

const ConnectionCard = ({ connection, isLoading = false }) => {
  const navigate = useNavigate();

  // Format the connection date
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString();
  };

  // Show skeleton loader if loading
  if (isLoading || !connection) {
    return (
      <div className="overflow-hidden rounded-[20px] border border-white/10 bg-[rgba(22,23,30,0.7)] shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-sm">
        <div className="p-4">
          <div className="flex items-center space-x-4">
            {/* Skeleton Avatar */}
            <div className="h-16 w-16 animate-pulse rounded-full bg-white/10"></div>

            {/* Skeleton Content */}
            <div className="flex-1 space-y-2">
              <div className="h-5 w-3/4 animate-pulse rounded bg-white/10"></div>
              <div className="h-4 w-1/2 animate-pulse rounded bg-white/10"></div>
              <div className="h-3 w-2/3 animate-pulse rounded bg-white/10"></div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <div className="h-8 w-20 animate-pulse rounded-full bg-white/10"></div>
            <div className="h-8 w-20 animate-pulse rounded-full bg-white/10"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => navigate(`/profile/${connection.uid}`)}
      className="cursor-pointer overflow-hidden rounded-[20px] border border-white/10 bg-[rgba(22,23,30,0.7)] shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-all duration-200 hover:border-[#ac9ffa]/30 hover:bg-[rgba(22,23,30,0.8)] hover:shadow-[0_25px_60px_rgba(0,0,0,0.4)]"
    >
      <div className="p-4">
        <div className="flex items-center space-x-4">
          {/* Avatar */}
          <img
            src={connection.photoUrl || connection.avatarPhoto || "/default-avatar.png"}
            alt={connection.username || connection.displayName}
            className="h-16 w-16 rounded-full border-2 border-white/20 object-cover"
            onError={(e) => {
              e.target.src = "/default-avatar.png";
            }}
          />

          {/* Connection Info */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">
              {connection.displayName || connection.username}
            </h3>
            <p className="text-sm text-white/70">@{connection.username}</p>
            {connection.bio && (
              <p className="mt-1 line-clamp-2 text-xs text-white/60">
                {connection.bio}
              </p>
            )}
          </div>
        </div>

        {/* Connection Status */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center text-xs text-white/60">
            <Calendar className="mr-1 h-3 w-3" />
            <span>Connected</span>
          </div>

          {/* Action Buttons */}
        </div>

        {/* Mutual Interests (if available) */}
        {connection.interests && connection.interests.length > 0 && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-1">
              {connection.interests.slice(0, 3).map((interest, index) => (
                <span
                  key={index}
                  className="rounded-full border border-white/20 bg-white/10 px-2 py-1 text-xs text-white/80 backdrop-blur-sm"
                >
                  {interest}
                </span>
              ))}
              {connection.interests.length > 3 && (
                <span className="rounded-full border border-[#ac9ffa]/30 bg-[#ac9ffa]/20 px-2 py-1 text-xs text-[#ac9ffa] backdrop-blur-sm">
                  +{connection.interests.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ConnectionsTap = ({ connections, isLoading = false }) => {
  // Show skeleton cards while loading
  if (isLoading) {
    return (
      <div className="px-3 py-4 sm:px-6 sm:py-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {/* Show 6 skeleton cards while loading */}
          {Array.from({ length: 6 }).map((_, index) => (
            <ConnectionCard key={`skeleton-${index}`} isLoading={true} />
          ))}
        </div>
      </div>
    );
  }

  // Show empty state if no connections
  if (!connections || connections.length === 0) {
    return (
      <div className="px-3 py-4 sm:px-6 sm:py-6">
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
            <UserCheck className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            No connections yet
          </h3>
          <p className="text-gray-500">
            Start connecting with people to build your network!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-4 sm:px-6 sm:py-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {connections.map((connection, index) => (
          <ConnectionCard
            key={connection.uid || connection.id || index}
            connection={connection}
          />
        ))}
      </div>
    </div>
  );
};

export default ConnectionsTap;
