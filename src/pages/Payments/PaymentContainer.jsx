import { CrownIcon, UserIcon, ZapIcon } from "lucide-react";
import Button from "../../components/ui/Buttons/Button";
import PaymentPresentational from "./PaymentPresentational";
import { memo } from "react";
import { useTranslation } from "react-i18next";

function PaymentContainer() {
  const { t } = useTranslation();
  // Billing is deferred: nothing records a purchase yet, so paid plans
  // can't be bought.
  const comingSoon = (
    <button
      type="button"
      disabled
      className="font-quick-sand mx-auto block w-full cursor-not-allowed rounded-full bg-gray-500/40 px-6 py-3 text-lg font-semibold opacity-70"
    >
      {t("payment.Coming soon")}
    </button>
  );

  const cards = [
    {
      color: "#5c57a1",
      icon: <UserIcon size={50} />,
      header: t("payment.Explore & Connect"),
      price: (
        <p className="mb-10 text-center text-5xl font-bold">
          {t("payment.Free")}
        </p>
      ),
      services: [
        t("payment.Join Public Circles"),
        t("payment.Up to 2 private Circles"),
      ],
      actionBtn: (
        <Button size="large" variant="primary" classes={"mx-auto block"}>
          {t("payment.Get Started")}
        </Button>
      ),
    },
    {
      color: "#ac9ffa",
      icon: <ZapIcon size={50} />,
      header: t("payment.More Circles, More Power"),
      price: (
        <p className="mb-10 text-center text-5xl font-bold">
          50 EGP <span className="text-base">/ {t("payment.month")}</span>
        </p>
      ),
      services: [
        t("payment.Unlimited private Circles"),
        t("payment.Priority support"),
        t("payment.Up to 10GB storage"),
      ],
      actionBtn: comingSoon,
    },
    {
      color: "#4ea8de",
      icon: <CrownIcon size={50} />,
      header: t("payment.Circle+"),
      price: (
        <p className="mb-10 text-center text-5xl font-bold">
          100 EGP <span className="text-base">/ {t("payment.month")}</span>
        </p>
      ),
      services: [
        t("payment.Host up to 1000 members per Circle"),
        t("payment.Analytics & engagement insights"),
        t("payment.Custom Circle branding"),
        t("payment.Scheduled hangouts & auto-reminders"),
      ],
      actionBtn: comingSoon,
    },
  ];
  return <PaymentPresentational cards={cards} />;
}
export default memo(PaymentContainer);
