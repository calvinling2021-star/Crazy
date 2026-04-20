import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  const [dealsCount, providersCount, usersCount] = await Promise.all([
    session.user.role === "ASSET_CEO"
      ? prisma.deal.count({ where: { ownerId: session.user.id } })
      : prisma.deal.count(),
    prisma.serviceProvider.count(),
    session.user.role === "PRINCIPAL" ? prisma.user.count() : Promise.resolve(null),
  ]);

  const recentDeals = await prisma.deal.findMany({
    where: session.user.role === "ASSET_CEO" ? { ownerId: session.user.id } : {},
    include: { owner: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  const STATUS_COLORS: Record<string, string> = {
    ACTIVE: "text-green-400",
    PENDING: "text-yellow-400",
    CLOSED: "text-gray-500",
    ON_HOLD: "text-orange-400",
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <p className="text-[#c9a84c] text-xs tracking-widest uppercase mb-1">Welcome back</p>
        <h1 className="text-white text-2xl font-light">{session.user.name}</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        <StatCard label="Active Deals" value={String(dealsCount)} />
        {session.user.role !== "ASSET_CEO" && (
          <StatCard label="Service Providers" value={String(providersCount)} />
        )}
        {usersCount !== null && (
          <StatCard label="Team Members" value={String(usersCount)} />
        )}
      </div>

      <div>
        <h2 className="text-gray-400 text-xs tracking-widest uppercase mb-4">Recent Deals</h2>
        {recentDeals.length === 0 ? (
          <p className="text-gray-600 text-sm">No deals yet.</p>
        ) : (
          <div className="space-y-2">
            {recentDeals.map((deal) => (
              <div
                key={deal.id}
                className="flex items-center justify-between bg-[#111] border border-gray-800 px-5 py-4"
              >
                <div>
                  <p className="text-white text-sm">{deal.name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{deal.owner.name}</p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-medium ${STATUS_COLORS[deal.status] ?? "text-gray-400"}`}>
                    {deal.status}
                  </p>
                  {deal.sector && <p className="text-gray-600 text-xs mt-0.5">{deal.sector}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#111] border border-gray-800 px-5 py-5">
      <p className="text-gray-500 text-xs tracking-widest uppercase mb-2">{label}</p>
      <p className="text-white text-3xl font-light">{value}</p>
    </div>
  );
}
