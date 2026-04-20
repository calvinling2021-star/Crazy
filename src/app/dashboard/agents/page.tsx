import { auth } from "@/auth";
import AgentsGrid from "@/components/dashboard/AgentsGrid";

export default async function AgentsPage() {
  const session = await auth();
  const isPrincipal = session?.user.role === "PRINCIPAL";
  return <AgentsGrid isPrincipal={isPrincipal} />;
}
