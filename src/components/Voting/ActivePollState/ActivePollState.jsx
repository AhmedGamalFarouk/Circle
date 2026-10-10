import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";

const ActivePollState = ({ pollData, onFinishVoting, onVote, onAddOption }) => {
  const [remainingTime, setRemainingTime] = useState("");
  const [isExpired, setIsExpired] = useState(false);
  const [showAddOption, setShowAddOption] = useState(false);
  const [newOptionText, setNewOptionText] = useState("");
  const [message, setMessage] = useState("");
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (!pollData || !pollData.deadline) {
      setRemainingTime("No deadline");
      return;
    }

    const calculateRemainingTime = () => {
      const deadlineDate = new Date(pollData.deadline);
      const now = new Date();
      const diff = deadlineDate.getTime() - now.getTime();

      if (diff <= 0) {
        setRemainingTime("Poll ended");
        if (!isExpired) {
          setIsExpired(true);
          setTimeout(() => onFinishVoting(), 1000);
        }
        return;
      } else {
        setIsExpired(false);
      }

      const seconds = Math.floor((diff / 1000) % 60);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      let timeString = "";
      if (days > 0) timeString += `${days}d `;
      if (hours > 0 || days > 0) timeString += `${hours}h `;
      if (minutes > 0 || hours > 0 || days > 0) timeString += `${minutes}m `;
      timeString += `${seconds}s`;

      setRemainingTime(timeString.trim());
    };

    calculateRemainingTime();
    const timer = setInterval(calculateRemainingTime, 1000);
    return () => clearInterval(timer);
  }, [pollData, isExpired, onFinishVoting]);

  if (!pollData) return null;

  const getVoteCount = (optionText) =>
    Object.values(pollData.votes || {}).filter((vote) => vote === optionText)
      .length;

  const handleAddOption = () => {
    if (!newOptionText.trim()) return setMessage("Please enter an option.");
    if (isExpired) return setMessage("Cannot add options after the deadline.");
    if (
      pollData.options.some(
        (o) => o.text.toLowerCase() === newOptionText.trim().toLowerCase(),
      )
    ) {
      return setMessage("This option already exists.");
    }

    onAddOption(newOptionText.trim());
    setNewOptionText("");
    setShowAddOption(false);
  };

  const canAddOptions = pollData.allowNewOptions && !isExpired;
  const totalVotes = Object.keys(pollData.votes || {}).length;

  return (
    <div className="fixed md:relative z-[9999] mx-auto w-[100%] md:w-[100%] backdrop-blur-lg overflow-y-auto  max-h-[300px] overflow-hidden rounded-2xl  text-text shadow-2xl mt-2">
      {/* Header with toggle */}
      <div
        className="from-primary/30 to-secondary/30 flex cursor-pointer items-center justify-between bg-gradient-to-r px-4 py-3"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div>
          <h3 className="text-lg font-bold">{pollData.question}</h3>
          {/* <p className={`text-sm ${isExpired ? 'text-red-400 font-bold' : 'text-text-300'}`}>
            {isExpired ? 'Poll Ended' : `Ends in: ${remainingTime}`}
          </p> */}
        </div>
        {isOpen ? (
          <ChevronUp className="h-6 w-6" />
        ) : (
          <ChevronDown className="h-6 w-6" />
        )}
      </div>

      {/* Alert message */}
      {message && (
        <div className="absolute top-4 left-1/2 z-50 flex min-w-[200px] -translate-x-1/2 items-center gap-3 rounded-lg bg-red-600 p-3 text-text shadow-lg">
          <p className="text-sm">{message}</p>
          <X
            className="h-4 w-4 cursor-pointer"
            onClick={() => setMessage("")}
          />
        </div>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 px-4 py-4"
          >
            {/* Options */}
            <div className="space-y-3">
              {pollData.options.map((option, i) => {
                const voteCount = getVoteCount(option.text);
                const percent =
                  totalVotes > 0
                    ? Math.round((voteCount / totalVotes) * 100)
                    : 0;
                const isEnabled = !isExpired;

                return (
                  <div
                    key={i}
                    onClick={() => isEnabled && onVote(option.text)}
                    className={`group flex flex-col gap-1 rounded-xl border px-4 py-3 transition-all ${isEnabled
                      ? "hover:border-primary cursor-pointer border-text/10 bg-text/5"
                      : "cursor-not-allowed opacity-60"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{option.text}</span>
                      <span className="text-primary text-xs">{percent}%</span>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-text/20">
                      <div
                        className="from-primary to-secondary absolute top-0 left-0 h-full bg-gradient-to-r transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-xs text-text/40">
                      {voteCount} votes
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Add option */}
            {canAddOptions && (
              <div>
                {showAddOption ? (
                  <div className="flex flex-col justify-evenly">
                    <input
                      type="text"
                      placeholder="Add new option..."
                      value={newOptionText}
                      onChange={(e) => setNewOptionText(e.target.value)}
                      maxLength={50}
                      className="focus:ring-primary w-full rounded-lg bg-text-800 p-3 text-text placeholder-text-400 outline-none focus:ring-2"
                    />
                    <div className="flex gap-3">
                      <button
                        className="bg-primary flex-1 rounded-lg py-2 font-bold text-black hover:opacity-90"
                        onClick={handleAddOption}
                      >
                        Add
                      </button>
                      <button
                        className="flex-1 rounded-lg border border-text/20 py-2 font-bold text-text hover:bg-text/10"
                        onClick={() => {
                          setShowAddOption(false);
                          setNewOptionText("");
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="border-primary text-primary flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-3 font-bold hover:bg-text/5"
                    onClick={() => setShowAddOption(true)}
                  >
                    <Plus className="h-5 w-5" /> Add Option
                  </button>
                )}
              </div>
            )}

            {/* Finish button */}
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "inset 0 0 7px black" }}
              whileTap={{ scale: 0.95 }}
              disabled={isExpired}
              onClick={() => {
                // Closing ends voting for the whole circle, not just this user.
                if (window.confirm("Close this poll for everyone and pick the winner?")) {
                  onFinishVoting();
                }
              }}
              className={`border-secondary from-primary to-secondary font-secondary mt-4 w-full cursor-pointer rounded-full border-2 bg-gradient-to-l bg-clip-text px-4 py-3 font-bold text-transparent shadow-2xl sm:mt-6 sm:px-5 sm:py-4 ${isExpired && "cursor-not-allowed opacity-50"
                }`}
            >
              {isExpired ? "Poll Ended" : "Close Poll"}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ActivePollState;
