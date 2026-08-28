import { useEffect, useState } from "react";
import { isTauri } from "@tauri-apps/api/core";
import type { Update } from "@tauri-apps/plugin-updater";
import type { Strings } from "../i18n/strings";

export function UpdateBanner({ t }: { t: Strings }) {
  const [update, setUpdate] = useState<Update | null>(null);
  const [installing, setInstalling] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isTauri()) return;
    let cancelled = false;
    (async () => {
      try {
        const { check } = await import("@tauri-apps/plugin-updater");
        const result = await check();
        if (!cancelled && result) setUpdate(result);
      } catch {
        // No update server reachable, or nothing published yet — stay silent.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function installUpdate() {
    if (!update) return;
    setInstalling(true);
    try {
      await update.downloadAndInstall();
      const { relaunch } = await import("@tauri-apps/plugin-process");
      await relaunch();
    } catch {
      setInstalling(false);
    }
  }

  if (!update || dismissed) return null;

  return (
    <div className="update-banner">
      <span>{t.updateAvailable(update.version)}</span>
      <div className="update-banner-actions">
        <button type="button" className="primary update-banner-install" onClick={installUpdate} disabled={installing}>
          {installing ? t.updateInstalling : t.updateInstall}
        </button>
        <button type="button" className="update-banner-dismiss" aria-label={t.closeLabel} onClick={() => setDismissed(true)}>×</button>
      </div>
    </div>
  );
}
