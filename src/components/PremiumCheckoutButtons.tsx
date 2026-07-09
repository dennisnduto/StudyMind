"use client";

import { useState } from "react";
import { CreditCard, Bitcoin, Loader2 } from "lucide-react";

export default function PremiumCheckoutButtons() {
  const [loadingMethod, setLoadingMethod] = useState<"flutterwave" | "crypto" | null>(null);

  const handleCheckout = async (method: "flutterwave" | "crypto") => {
    setLoadingMethod(method);
    try {
      const response = await fetch(`/api/payments/${method}`, {
        method: "POST",
      });
      const data = await response.json();
      
      if (data.link) {
        window.location.href = data.link;
      } else {
        alert(data.error || "Something went wrong. Please try again.");
        setLoadingMethod(null);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to initialize payment. Please try again later.");
      setLoadingMethod(null);
    }
  };

  return (
    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
      <button
        onClick={() => handleCheckout("flutterwave")}
        disabled={loadingMethod !== null}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loadingMethod === "flutterwave" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CreditCard className="h-4 w-4" />
        )}
        Pay with Card / M-Pesa / GPay
      </button>

      <button
        onClick={() => handleCheckout("crypto")}
        disabled={loadingMethod !== null}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0052FF] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#0042cc] disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loadingMethod === "crypto" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Bitcoin className="h-4 w-4" />
        )}
        Pay with Crypto
      </button>
    </div>
  );
}
