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
      <p className="mb-4 text-sm text-gray-400">Last updated: October 2026</p>

      <p className="mb-4">
        Arrakis Intelligence Platform ("Arrakis", "we", "us") provides a
        productivity and focus-tracking platform along with a companion
        browser extension. This page explains what data the platform and
        extension process and which third-party AI providers may receive.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Data We Collect</h2>
      <ul className="list-disc list-inside space-y-2 mb-4">
        <li>Account information (name, email) via standard login or Google OAuth</li>
        <li>Focus session data (Spice/Storm logs, timers, streaks)</li>
        <li>Focus sessions, distraction events, profile and roadmap data, settings, and team membership</li>
        <li>Extension activity: hostnames and durations from visible, focused HTTP and HTTPS tabs, plus event IDs and broad categories used to deduplicate and classify sync events</li>
        <li>Questions submitted to Mentat and aggregated focus, distraction, streak, and skill-gap context when a remote AI provider is enabled</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-2">How We Use Data</h2>
      <p className="mb-4">
        Data is used for analytics, distraction tracking, leaderboard rankings,
        and personalized Mentat recommendations. We do not sell user data.
        With the heuristic Mentat provider, no AI-provider request is made.
        With Gemini or OpenAI enabled, the selected provider receives the
        submitted question and aggregated context. Raw browser activity, page
        URLs, page titles, email addresses, and authentication tokens are not
        included in Mentat requests.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Browser Extension</h2>
      <p className="mb-4">
        The extension tracks hostnames only while a tab is visible and
        focused, accumulating time in ten-second increments and sending
        hostname and duration records to your account. It does not synchronize
        full page URLs or titles. Block lists, strict mode, and timed overrides
        are stored locally in the extension. The extension stores its access
        token in browser extension storage; the signed-in Arrakis app transfers
        a short-lived token to it on the trusted app origin. Logging out clears
        that token. Pending activity expires after 24 hours. Older extension
        packages may have transmitted URLs and page titles.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Retention and deletion</h2>
      <p className="mb-4">
        Focus sessions, distraction logs, profile, roadmap, and team records
        remain in the database until you delete your account. You can download
        a JSON export from Settings. Account
        deletion removes your profile, focus and distraction records, roadmap,
        and refresh tokens in one database transaction. It also removes your
        team membership; if you own a team, ownership transfers to its oldest
        remaining member, and an empty team is removed. Deletion requires your
        account email and authentication from the past five minutes.
        Local-password accounts must also confirm their password. Google-linked
        accounts must also type a confirmation phrase. Refresh-token records
        also expire automatically.
        This repository does not define a general retention schedule for active
        accounts.
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
