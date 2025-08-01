import { useEffect, useState } from "react";
import { CheckCircle, ArrowRight, Download, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router";

const PaymentSuccess = ({
  transactionId = "TXN-2025-0001",
  amount = "$49.99",
  email = "customer@example.com",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [iconScale, setIconScale] = useState(0);
  const navigate = useNavigate();
  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => setIconScale(1), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4">
      <div
        className={`w-full max-w-md transform rounded-2xl bg-white p-8 shadow-2xl transition-all duration-700 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        {/* Success Icon */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle
              className={`text-green-600 transition-transform duration-500 ease-out ${
                iconScale ? "scale-100" : "scale-0"
              }`}
              size={48}
            />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Payment Successful!
          </h1>
          <p className="text-gray-600">
            Thank you for your purchase. Your payment has been processed
            successfully.
          </p>
        </div>

        {/* Payment Details */}
        <div className="mb-6 space-y-3 rounded-xl bg-gray-50 p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Amount</span>
            <span className="font-semibold text-gray-900">{amount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Transaction ID</span>
            <span className="font-mono text-sm text-gray-900">
              {transactionId}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Email</span>
            <span className="text-sm text-gray-900">{email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Date</span>
            <span className="text-sm text-gray-900">
              {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate("/")}
            className="group flex w-full items-center justify-center rounded-xl bg-green-600 px-4 py-3 font-semibold text-white transition-all duration-200 hover:bg-green-700"
          >
            Continue to Circle
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
