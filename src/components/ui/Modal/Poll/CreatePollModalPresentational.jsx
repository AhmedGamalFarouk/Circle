import Input from "../../Input/Input";
import SendBtn from "../../ReactBits/SendBtn/SendBtn";
import ModalHeading from "../ModalHeading/ModalHeading";
export default function CreatePollModalPresentational({
  question,
  setQuestion,
  options,
  onOptionChange,
  expireDate,
  setExpireDate,
  onSubmit,
  onClose,
  t,
}) {
  return (
    <div className="relative w-full  rounded-4xl backdrop-blur-lg">
      {/* Header */}
      <ModalHeading onClose={onClose} title={t("Create Poll")} />

      {/* Form */}
      <form onSubmit={onSubmit} className="">
        {/* Question */}
        <div>
          <label className="text-primary mb-2 block text-lg font-medium">
            {t("Question *")}
          </label>
          <Input
            label={t("Ask question")}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>

        {/* Options */}
        <div>
          <label className="text-primary mb-2 block text-lg font-medium">
            {t("Options *")}
          </label>

          <div className="space-y-1">
            {options.map((option, index) => (
              <Input
                key={index}
                label={`${t("Option")} ${index + 1}`}
                value={option}
                onChange={(e) => onOptionChange(index, e.target.value)}
              />
            ))}
          </div>
        </div>

        {/* Expiration Date */}
        <div className="">
          <label className="text-primary mb-2 block text-lg font-medium">
            {t("Expire Date")}
          </label>
          <input
            type="date"
            className="bg-primary focus:ring-primary w-full rounded-xl border border-text/20 px-4 py-2 text-text focus:ring-2 focus:outline-none"
            value={expireDate}
            onChange={(e) => setExpireDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]} // disables past dates
          />
        </div>

        {/* Submit */}
        <div className="relative z-10 flex translate-y-[50%] justify-end">
          <SendBtn />
        </div>
      </form>
    </div>
  );
}
