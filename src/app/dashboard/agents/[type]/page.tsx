import { notFound } from "next/navigation";
import { AGENTS, AgentType } from "@/lib/agents";
import AgentChat from "@/components/dashboard/AgentChat";

interface Props {
  params: Promise<{ type: string }>;
}

export default async function AgentPage({ params }: Props) {
  const { type } = await params;
  const agentKey = type.toUpperCase() as AgentType;

  if (!AGENTS[agentKey]) notFound();

  const agent = AGENTS[agentKey];

  return (
    <div className="flex flex-col h-screen">
      <div className="px-8 py-5 border-b border-gray-800 flex-shrink-0">
        <p className="text-[#c9a84c] text-xs tracking-widest uppercase mb-0.5">{agent.label} Agent</p>
        <p className="text-gray-400 text-xs">{agent.description}</p>
      </div>
      <AgentChat agentType={agentKey} />
    </div>
  );
}
