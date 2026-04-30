"use client";

import { useEffect } from "react";
import { extractUtmParams, UTM_KEYS } from "@/lib/utm";

/**
 * On marketing pages, append any inbound UTM params to every
 * `<a data-signup-link>` so attribution flows into Beehiiv.
 *
 * Existing UTM params already on a link are not overwritten.
 */
export function UtmForwarder() {
  useEffect(() => {
    const utm = extractUtmParams(window.location.search);
    if (Object.keys(utm).length === 0) return;
    const anchors = document.querySelectorAll<HTMLAnchorElement>("a[data-signup-link]");
    anchors.forEach((a) => {
      try {
        const url = new URL(a.href);
        for (const k of UTM_KEYS) {
          const v = utm[k];
          if (v && !url.searchParams.has(k)) url.searchParams.set(k, v);
        }
        a.href = url.toString();
      } catch {
        // skip malformed links
      }
    });
  }, []);
  return null;
}
