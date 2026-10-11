import React, { useState } from "react";
import { Plus, Check, X } from "lucide-react";
import { updateUserProfile } from "../../fire_base/profileController/profileController";

const AboutTab = ({ uid, interests }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newInterest, setNewInterest] = useState("");

  const handleAddInterest = async () => {
    if (!newInterest.trim()) return;
    try {
      await updateUserProfile(uid, {
        interests: [...interests, newInterest.trim()],
      });
    } catch {
      return;
    }
    setNewInterest("");
    setIsAdding(false);
  };

  return (
    <div className="bg-text/5 rounded-[var(--rounded-rounded)] px-3 py-4 shadow-[var(--shadow-glassCard)] sm:px-6 sm:py-6">
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="space-y-4 sm:space-y-6 lg:col-span-2">
          {/* Interests Section */}
          <div>
            <h2 className="text-text font-secondary mb-3 text-lg font-bold sm:text-xl">
              Interests
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              {interests.map((interest, index) => (
                <span
                  key={index}
                  className="bg-accent text-text border-accent/40 rounded-[var(--rounded-pill)] border px-2 py-1 text-xs font-medium transition-all duration-300 hover:scale-105 sm:px-3 sm:text-sm"
                >
                  {interest}
                </span>
              ))}

              {/* Add Button */}
              {!isAdding && (
                <button
                  className="text-text border-text/40 rounded-[var(--rounded-pill)] border-2 border-dashed px-2 py-1 text-xs transition-all duration-300 hover:scale-105 sm:px-3 sm:text-sm"
                  onClick={() => setIsAdding(true)}
                >
                  <Plus className="inline h-3 w-3 sm:h-4 sm:w-4 ltr:mr-1 rtl:ml-1" />
                  Add
                </button>
              )}

              {/* Input field when adding */}
              {isAdding && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    placeholder="Enter interest..."
                    className="bg-glass text-text border-secondary min-w-[120px] rounded-[var(--rounded-pill)] border px-3 py-1 text-xs sm:text-sm"
                  />
                  <button
                    onClick={handleAddInterest}
                    className="text-primary rounded-full p-1 transition-all duration-200"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setIsAdding(false);
                      setNewInterest("");
                    }}
                    className="text-accent rounded-full p-1 transition-all duration-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutTab;
