import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/app/OnboardingWizard";
import "./onboarding.css";

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // If already onboarded, send them home.
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("onboarded_at")
    .eq("user_id", user.id)
    .single();
  if (profile?.onboarded_at) redirect("/recipes");

  return <OnboardingWizard />;
}
