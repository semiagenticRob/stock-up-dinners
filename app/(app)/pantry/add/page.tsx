import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadCatalog } from "@/lib/db/catalog";
import { AddLotForm } from "@/components/app/AddLotForm";

export default async function AddLotPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const catalog = await loadCatalog(supabase);

  // Order by display name for the dropdown.
  const ingredients = [...catalog.ingredients].sort((a, b) =>
    a.display_name.localeCompare(b.display_name),
  );

  return (
    <>
      <div className="pantry-head">
        <div>
          <h1>Add a lot</h1>
          <p className="pantry-subtitle">
            <Link href="/pantry">← Back to pantry</Link>
          </p>
        </div>
      </div>
      <AddLotForm ingredients={ingredients} />
    </>
  );
}
