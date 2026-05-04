import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadCatalog } from "@/lib/db/catalog";
import { PantryAddView } from "@/components/app/PantryAddView";
import "../pantry.css";

export default async function AddLotPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const catalog = await loadCatalog(supabase);
  const ingredients = [...catalog.ingredients].sort((a, b) =>
    a.display_name.localeCompare(b.display_name),
  );

  return (
    <>
      <div className="pantry-head">
        <div>
          <h1>Add to your pantry</h1>
          <p className="pantry-subtitle">
            <Link href="/pantry">← Back to pantry</Link>
          </p>
        </div>
      </div>
      <PantryAddView ingredients={ingredients} />
    </>
  );
}
