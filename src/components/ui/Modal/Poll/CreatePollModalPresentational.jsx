import ShinyText from "../../ReactBits/ShinyText/ShinyText";
import Input from "../../Input/Input";
import Toggle from "../../ReactBits/Toggle/Toggle";
import SendBtn from "../../ReactBits/SendBtn/SendBtn";
import AiButton from "../../Buttons/AiButton";
import ModalHeading from "../ModalHeading/ModalHeading";
export default function CreatePollModalPresentational({
  question,
  setQuestion,
  options,
  onOptionChange,
  allowMultiple,
  setAllowMultiple,
  expireDate,
  setExpireDate,
  onAskAi,
  onSubmit,
  close,
  t,
}) {
  return (
    <div className="relative w-[500px] rounded-4xl backdrop-blur-lg">
      {/* Header */}
      <ModalHeading onClose={close} title={t("Create Poll")} />

      {/* Form */}
      <form onSubmit={onSubmit} className="">
        {/* Question */}
        <div>
          <label className="text-light mb-2 block text-lg font-medium">
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
          <div className="flex items-center justify-between">
            <label className="text-light mb-2 block text-lg font-medium">
              {t("Options *")}
            </label>

            <div className="flex cursor-pointer items-center gap-x-2" onClick={onAskAi}>
              <AiButton />
              <span className="from-secondary to-primary bg-gradient-to-l bg-clip-text py-1 ps-2 font-bold text-transparent">
                Ask AI
              </span>
            </div>
          </div>

          <div className="space-y-3">
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

        {/* Toggle */}
        <div className="flex items-center justify-between">
          <ShinyText
            text={t("Allow multiple answers!")}
            disabled={false}
            speed={3}
            className="custom-class text-white"
          />
          <Toggle
            checked={allowMultiple}
            onCheckedChange={setAllowMultiple}
          />
        </div>

        {/* Expiration Date */}
        <div className="mt-6">
          <label className="text-light mb-2 block text-lg font-medium">
            {t("Expire Date")}
          </label>
          <input
            type="date"
            className="bg-dark focus:ring-primary w-full rounded-xl border border-white/20 px-4 py-2 text-white focus:ring-2 focus:outline-none"
            value={expireDate}
            onChange={(e) => setExpireDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]} // disables past dates
          />
        </div>

        {/* Submit */}
        <div className="pt-2">
          <div className="flex justify-end relative translate-y-[50%] z-10">
            <SendBtn />
          </div>
        </div>
      </form>
    </div>
  );
}
