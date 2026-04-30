import { Stub } from "@/components/app/Stub";

export default function RecipesPage() {
  return (
    <Stub title="Cook tonight" milestone="Milestone 3">
      <p>This is the home of the recipe matching engine.</p>
      <p>
        Today: pantry &times; recipes &rarr; tiered list (perishable priority &rarr; cookable
        &rarr; substitutable &rarr; almost). Cook button writes a <code>cook_event</code>, runs FIFO
        decrement, redirects back here.
      </p>
      <p>Defined in spec § 6.1 and § 8.2.</p>
    </Stub>
  );
}
