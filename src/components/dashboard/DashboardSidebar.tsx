"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  HomeIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  CpuChipIcon,
  UsersIcon,
  DocumentIcon,
  LinkIcon,
  ArrowRightStartOnRectangleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";

const ROLE_LABELS: Record<string, string> = {
  PRINCIPAL: "Principal",
  OPS: "Operations",
  ASSET_CEO: "Asset CEO",
};

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const NAV: NavItem[] = [
  { href: "/dashboard",              label: "Overview",     icon: HomeIcon,           roles: ["PRINCIPAL", "OPS", "ASSET_CEO"] },
  { href: "/dashboard/deals",        label: "Deals",        icon: BriefcaseIcon,      roles: ["PRINCIPAL", "OPS", "ASSET_CEO"] },
  { href: "/dashboard/documents",    label: "Documents",    icon: DocumentIcon,       roles: ["PRINCIPAL", "OPS", "ASSET_CEO"] },
  { href: "/dashboard/providers",    label: "Providers",    icon: BuildingOfficeIcon, roles: ["PRINCIPAL", "OPS"] },
  { href: "/dashboard/agents",       label: "AI Agents",    icon: CpuChipIcon,        roles: ["PRINCIPAL", "OPS", "ASSET_CEO"] },
  { href: "/dashboard/integrations", label: "Integrations", icon: LinkIcon,           roles: ["PRINCIPAL", "OPS"] },
  { href: "/dashboard/users",        label: "Users",        icon: UsersIcon,          roles: ["PRINCIPAL"] },
];

interface Props {
  user: { name: string; email: string; role: string };
}

export default function DashboardSidebar({ user }: Props) {
  const pathname = usePathname();
  const visible = NAV.filter((item) => item.roles.includes(user.role));

  return (
    <aside className="w-56 bg-[#0d0d0d] border-r border-gray-800 flex flex-col flex-shrink-0">
      <div className="px-5 py-6 border-b border-gray-800">
        <p className="text-[#c9a84c] tracking-[0.25em] text-[10px] uppercase mb-1">Internal</p>
        <p className="text-white text-sm font-light tracking-wider">Molecule Capital</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {visible.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 text-sm rounded transition-colors",
                active
                  ? "bg-[#c9a84c]/10 text-[#c9a84c]"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-800">
        <p className="text-white text-sm truncate mb-0.5">{user.name}</p>
        <p className="text-gray-500 text-xs mb-3">{ROLE_LABELS[user.role] ?? user.role}</p>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 text-gray-500 hover:text-red-400 text-xs transition-colors w-full"
        >
          <ArrowRightStartOnRectangleIcon className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
