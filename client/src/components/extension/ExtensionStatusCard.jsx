import { useMemo } from "react";
import { useExtensionStatus } from "../../hooks/useExtensionStatus";
import { browserIsEdge, describeStatus } from "../../utils/extensionHandshake.js";
import { cx } from "../../utils/cx";
import Button from "../ui/Button";
import Card from "../ui/Card";

const REPO_URL = "https://github.com/Nitesh-N-D/Arrakis-Intelligence-Platform";

const PERMISSION_REASONS = {
  storage: "Saves your settings, blocked-site list and queued focus activity on this device.",
  tabs: "Reads the address of the active tab so Storm Zones can redirect blocked sites.",
  alarms: "Retries queued activity sync and clears expired overrides on a schedule."
};

const toneStyles = {
  success: "border-emerald-300/25 bg-emerald-400/10 text-emerald-100",
  warning: "border-[#F97316]/30 bg-[#F97316]/10 text-orange-100",
  neutral: "border-white/10 bg-white/[0.04] text-[#A1A1AA]"
};

const syncLabel = { success: "Last sync succeeded", warning: "Sync waiting", error: "Last sync failed", idle: "No sync yet" };

function Steps({ items }) {
  return (
    <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-white/70">
      {items.map((item) => <li key={item}>{item}</li>)}
    </ol>
  );
}

/** Edge extension install guide plus live handshake status. */
export default function ExtensionStatusCard({ userId }) {
  const { status, checkedAt, recheck } = useExtensionStatus(userId);
  const summary = describeStatus(status);
  const onEdge = useMemo(() => (typeof navigator === "undefined" ? false : browserIsEdge(navigator)), []);
  const detected = status.state === "detected";

  return (
    <Card className="mt-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.34em] text-white/45">Browser extension</div>
          <h2 className="mt-3 font-display text-2xl text-white">Arrakis for Microsoft Edge</h2>
          <p className="mt-2 max-w-3xl text-sm text-white/60">
            The extension is supported on Microsoft Edge only. It records how long a focused tab spends on a site (hostname and
            duration only, never page content or full URLs) and redirects sites you choose to block while a focus session is running.
            It is not yet listed on Microsoft Edge Add-ons; install it manually with the steps below.
          </p>
        </div>
        <Button className="py-2" disabled={status.state === "checking"} variant="secondary" onClick={() => void recheck()}>
          {status.state === "checking" ? "Checking…" : "Check again"}
        </Button>
      </div>

      <div aria-live="polite" className={cx("mt-5 rounded-xl border px-4 py-3 text-sm", toneStyles[summary.tone])} role="status">
        <div className="font-semibold">{summary.title}</div>
        {detected ? (
          <dl className="mt-2 grid gap-x-6 gap-y-1 text-white/70 sm:grid-cols-2">
            <div><dt className="inline text-white/45">Version: </dt><dd className="inline">{status.version}</dd></div>
            <div><dt className="inline text-white/45">Browser: </dt><dd className="inline">{status.browser === "edge" ? "Microsoft Edge" : "Not Edge (unsupported)"}</dd></div>
            <div>
              <dt className="inline text-white/45">{syncLabel[status.lastSync.state]}: </dt>
              <dd className="inline">{status.lastSync.updatedAt ? new Date(status.lastSync.updatedAt).toLocaleString() : "never"}</dd>
            </div>
            <div><dt className="inline text-white/45">Waiting to sync: </dt><dd className="inline">{status.pendingEvents} event{status.pendingEvents === 1 ? "" : "s"}</dd></div>
            <div><dt className="inline text-white/45">Blocked sites: </dt><dd className="inline">{status.blockedSiteCount}{status.strictMode ? " · strict mode" : ""}</dd></div>
          </dl>
        ) : null}
        {checkedAt ? <div className="mt-2 text-xs text-white/40">Checked {checkedAt.toLocaleTimeString()}</div> : null}
      </div>

      {!onEdge ? (
        <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/65">
          You appear to be using a browser other than Microsoft Edge. The web app works everywhere, but the extension is only supported in Edge.
        </p>
      ) : null}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-white">Install in Edge</h3>
          <Steps
            items={[
              "Download the repository, or the arrakis-extension.zip file from it, and extract it.",
              "Open edge://extensions in Microsoft Edge.",
              "Turn on Developer mode (left-hand panel).",
              "Choose Load unpacked and select the extension folder.",
              "Open this app while signed in so the extension can connect, then press Check again."
            ]}
          />
          <a className="mt-3 inline-block text-sm text-[#F59E0B] hover:underline" href={`${REPO_URL}/blob/main/docs/EDGE_INSTALLATION.md`} rel="noopener noreferrer" target="_blank">
            Full Edge installation guide
          </a>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Permissions and why</h3>
          <ul className="mt-2 space-y-2 text-sm text-white/70">
            {Object.entries(PERMISSION_REASONS).map(([name, reason]) => (
              <li key={name}>
                <span className="font-mono text-xs text-[#F59E0B]">{name}</span>
                {detected && !status.permissions.includes(name) ? <span className="text-white/40"> (not requested by this version)</span> : null}
                <div>{reason}</div>
              </li>
            ))}
            <li>
              <span className="font-mono text-xs text-[#F59E0B]">site access</span>
              <div>Needed to measure time on any site and to show the Storm Zone page on blocked sites. Only the hostname is kept.</div>
            </li>
          </ul>
        </div>
      </div>

      <details className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold text-white">Troubleshooting</summary>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-white/65">
          <li><span className="text-white">Not detected:</span> confirm the extension is enabled on edge://extensions, then reload this page. The check only works on the official Arrakis web address.</li>
          <li><span className="text-white">Not signed in:</span> sign in to this app in the same Edge profile. Sign-in reaches the extension automatically; you never need to paste a token.</li>
          <li><span className="text-white">Different account:</span> the extension clears activity queued for a previous account. Reload this page to hand it your current sign-in.</li>
          <li><span className="text-white">Sync waiting:</span> queued activity waits up to 24 hours for a valid sign-in, then is discarded.</li>
          <li><span className="text-white">After an update:</span> on edge://extensions choose Reload under Arrakis, then reload this page.</li>
        </ul>
      </details>
    </Card>
  );
}
