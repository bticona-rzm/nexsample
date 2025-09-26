"use client";// This ensures the file only runs on the client

import Link from "next/link";  // Import Link component for navigation
import { useEffect, useState } from "react"; // Import hooks from React
import { useTranslation } from "react-i18next"; // Import translation hook

// This guarantees the i18n instance is loaded early
import "../lib/i18n-client";

export default function Footer() {
  const { t, i18n } = useTranslation();
  const [isReady, setIsReady] = useState(false);

  // Use effect to handle the initialization state of i18n
  useEffect(() => {
    if (i18n.isInitialized) { // Check if i18n is already initialized
      setIsReady(true); // Set the isReady state to true
    } else {
      // Listen for the "initialized" event to set the isReady state
      i18n.on("initialized", () => setIsReady(true));
    }
  }, [i18n]);

  // If not ready, do not render the footer
  if (!isReady) return null;

  // Return the footer with links for terms of use and privacy policy
  return (
    <div className="flex space-x-24 absolute bottom-4">
      <Link href="/terms" className="text-xs text-gray-500 hover:text-gray-400">
        {/* Translate the "termsOfUse" key from the common namespace */}
        {t("termsOfUse")}
      </Link>
      <Link href="/privacy" className="text-xs text-gray-500 hover:text-gray-400">
        {/* Translate the "privacyPolicy" key from the common namespace */}
        {t("privacyPolicy")}
      </Link>
    </div>
  );
}