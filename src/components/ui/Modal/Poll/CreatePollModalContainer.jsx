import { useState } from "react";
import CreatePollModalPresentational from "./CreatePollModalPresentational"; // adjust path
import { useTranslation } from "react-i18next";
import { getAiPollOptions } from "./aiSuggestOptions";

export default function PollCreation({ onLaunchPoll, pollType, onClose }) {
  const { t } = useTranslation();

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [expireDate, setExpireDate] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const onOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleAskAi = async () => {
    if (!question.trim()) return alert(t("Please enter a question."));
    try {
      const aiOptions = await getAiPollOptions(question);
      if (!aiOptions || aiOptions.length < 2) {
        alert(t("AI did not return enough options."));
        return;
      }
      setOptions([...aiOptions, ""]);
    } catch (error) {
      console.error("AI suggestion error:", error);
      alert(t("Failed to fetch AI suggestions."));
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();

    const filledOptions = options.filter((opt) => opt.trim() !== "");
    if (!question.trim()) {
      alert(t("Please enter a poll question."));
      return;
    }
    if (filledOptions.length < 2) {
      alert(t("Please provide at least two options."));
      return;
    }

    // Use expireDate as expiration
    const pollData = {
      question: question.trim(),
      options: filledOptions.map((text) => ({ text })),
      deadline: new Date(expireDate).toISOString(),
      createdAt: new Date().toISOString(),
      // Both apps store one vote per member, so multi-answer isn't offered.
      allowMultiple: false,
      allowNewOptions: true,
      pollType,
    };

    onLaunchPoll(pollData);
  };

  return (
    <CreatePollModalPresentational
      question={question}
      setQuestion={setQuestion}
      options={options}
      onOptionChange={onOptionChange}
      expireDate={expireDate}
      setExpireDate={setExpireDate}
      onAskAi={handleAskAi}
      onSubmit={onSubmit}
      onClose={onClose}
      t={t}
    />
  );
}
