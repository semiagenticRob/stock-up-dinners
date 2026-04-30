import { Stub } from "@/components/app/Stub";

export default function ShoppingPage() {
  return (
    <Stub title="Live shopping mode" milestone="Milestone 4">
      <p>Mobile-optimized: search, quick-tap grid, running session list, auto-save every 30s.</p>
      <p>On commit: convert session items into <code>pantry_lots</code> in a single transaction.</p>
    </Stub>
  );
}
