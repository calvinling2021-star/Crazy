import Link from "next/link";
import { AGENTS } from "@/lib/agents";
import {
  CalculatorIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ScaleIcon,
} from "@heroicons/react/24/outline";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  ACCOUNTING: CalculatorIcon,
  AUDIT_PREP: ClipboardDocumentCheckIcon,
  DOC_PREP: DocumentTextIcon,
  IR: ChartBarIcon,
  LEGAL: ScaleIcon,
};

export default function AgentsPage() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <p className="text-[#c9a84c] text-xs tracking-widest uppercase mb-1">Powered by Claude</p>
        <h1 className="text-white text-2xl font-light">AI Agents</h1>
        <p className="text-gray-500 text-sm mt-2">Select an agent to start a conversation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Object.entries(AGENTS).map(([key, agent]) => {
          const Icon = ICONS[key] ?? DocumentTextIcon;
          return (
            <Link
              key={key}
              href={`/dashboard/agents/${key.toLowerCase()}`}
              className="bg-[#111] border border-gray-800 px-6 py-5 hover:border-[#c9a84c]/50 hover:bg-[#131313] transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center flex-shrink-0 group-hover:border-[#c9a84c]/40 transition-colors">
                  <Icon className="w-4 h-4 text-[#c9a84c]" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{agent.label}</p>
                  <p className="text-gray-500 text-xs mt-1 leading-relaxed">{agent.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
