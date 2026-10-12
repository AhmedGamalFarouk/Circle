import { useState } from "react";
import CreatePollModalPresentational from "./CreatePollModalPresentational"; // adjust path
import { useTranslation } from "react-i18next";

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
    // Typing in the last field opens another one.
    if (index === options.length - 1 && value.trim()) newOptions.push("");
    setOptions(newOptions);
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
      onSubmit={onSubmit}
      onClose={onClose}
      t={t}
    />
  );
}
