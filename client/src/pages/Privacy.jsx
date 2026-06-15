import React from "react";
import { motion } from "framer-motion";

const Privacy = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto px-6 py-12 text-gray-200"
    >
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="mb-4 text-sm text-gray-400">Last updated: June 2026</p>

      <p className="mb-4">
        Arrakis Intelligence Platform ("Arrakis", "we", "us") provides a
        productivity and focus-tracking platform along with a companion
        browser extension. This page explains what data we collect, how we
        use it, and how it relates to our Microsoft Edge Add-ons listing.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Data We Collect</h2>
      <ul className="list-disc list-inside space-y-2 mb-4">
        <li>Account information (name, email) via standard login or Google OAuth</li>
        <li>Focus session data (Spice/Storm logs, timers, streaks)</li>
        <li>Browsing activity related to Storm Zone blocking and strict mode</li>
        <li>Productivity analytics and Mentat usage data</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-2">How We Use Data</h2>
      <p className="mb-4">
        Data is used to power analytics, distraction detection, leaderboard
        rankings, and personalized Mentat recommendations. We do not sell
        user data to third parties.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Browser Extension</h2>
      <p className="mb-4">
        The Arrakis browser extension synchronizes blocked-site activity,
        strict mode status, and timed overrides with your Arrakis account
        to provide realtime tracking and analytics.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Contact</h2>
      <p className="mb-4">
        For privacy questions, contact the developer via the GitHub
        repository:{" "}
        <a
          href="https://github.com/Nitesh-N-D/Arrakis-Intelligence-Platform"
          className="text-blue-400 underline"
          target="_blank"
          rel="noreferrer"
        >
          Arrakis Intelligence Platform
        </a>
      </p>
    </motion.div>
  );
};

export default Privacy;