import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadCatalog } from "@/lib/db/catalog";
import { loadPreferences } from "@/lib/db/preferences";
import { loadParOverrides } from "@/lib/db/shopping";
import { SettingsShell } from "@/components/app/SettingsShell";
import "../onboarding/onboarding.css"; // .ob__chip styles, reused here
import "./settings.css";

const TABS = ["subscription", "diet", "pantry-defaults", "profile"] as const;
type Tab = (typeof TABS)[number];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { tab: tabParam } = await searchParams;
  const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : "subscription";

  const [profile, preferences, catalog, parOverrides] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("display_name, subscription_status, subscription_period_end, stripe_customer_id, onboarded_at")
      .eq("user_id", user.id)
      .single()
      .then((r) => r.data),
    loadPreferences(supabase),
    loadCatalog(supabase),
    loadParOverrides(supabase),
  ]);

  return (
    <SettingsShell
      activeTab={tab}
      user={{ id: user.id, email: user.email ?? "" }}
      profile={profile}
      preferences={preferences}
      ingredients={catalog.ingredients}
      parOverrides={parOverrides}
    />
  );
}
