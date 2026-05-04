"use client";

import Link from "next/link";
import type { Ingredient, PantryParOverride, UserPreferences } from "@/lib/types";
import { SubscriptionTab } from "./settings/SubscriptionTab";
import { DietTab } from "./settings/DietTab";
import { PantryDefaultsTab } from "./settings/PantryDefaultsTab";
import { ProfileTab } from "./settings/ProfileTab";

interface ProfileRow {
  display_name: string | null;
  subscription_status: string | null;
  subscription_period_end: string | null;
  stripe_customer_id: string | null;
  onboarded_at: string | null;
}

type Tab = "subscription" | "diet" | "pantry-defaults" | "profile";

const TAB_LABELS: Record<Tab, string> = {
  subscription: "Subscription",
  diet: "Diet & Preferences",
  "pantry-defaults": "Pantry Defaults",
  profile: "Profile",
};

interface Props {
  activeTab: Tab;
  user: { id: string; email: string };
  profile: ProfileRow | null;
  preferences: UserPreferences;
  ingredients: Ingredient[];
  parOverrides: PantryParOverride[];
}

export function SettingsShell({
  activeTab,
  user,
  profile,
  preferences,
  ingredients,
  parOverrides,
}: Props) {
  return (
    <div className="settings">
      <header className="settings__head">
        <h1>Settings</h1>
        <p className="settings__subtitle">
          {profile?.display_name
            ? `${profile.display_name} · ${user.email}`
            : user.email}
        </p>
      </header>

      <nav className="settings__tabs" role="tablist" aria-label="Settings sections">
        {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
          <Link
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            href={`/settings?tab=${tab}`}
            className={`settings__tab ${activeTab === tab ? "settings__tab--on" : ""}`}
            scroll={false}
          >
            {TAB_LABELS[tab]}
          </Link>
        ))}
      </nav>

      <div className="settings__panel" role="tabpanel">
        {activeTab === "subscription" && <SubscriptionTab profile={profile} />}
        {activeTab === "diet" && <DietTab initial={preferences} />}
        {activeTab === "pantry-defaults" && (
          <PantryDefaultsTab
            preferences={preferences}
            ingredients={ingredients}
            initialOverrides={parOverrides}
          />
        )}
        {activeTab === "profile" && (
          <ProfileTab
            email={user.email}
            displayName={profile?.display_name ?? ""}
          />
        )}
      </div>
    </div>
  );
}
