"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Zap, GitFork, LayoutDashboard } from "lucide-react";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/skills", label: "Skills", icon: Zap },
  { href: "/harness", label: "Harness", icon: GitFork },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{ background: "var(--bg-surface)", borderRight: "1px solid var(--border-default)" }}
      className="w-56 flex-shrink-0 flex flex-col h-screen sticky top-0"
    >
      {/* Logo */}
      <div
        className="px-5 py-5 border-b"
        style={{ borderColor: "var(--border-default)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{ background: "var(--accent-purple)", boxShadow: "0 0 16px var(--accent-purple-glow)" }}
          >
            A
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              Agent Studio
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              v1.0.0
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150"
              style={{
                background: active ? "rgba(124, 58, 237, 0.15)" : "transparent",
                color: active ? "var(--accent-purple)" : "var(--text-secondary)",
                borderLeft: active ? "2px solid var(--accent-purple)" : "2px solid transparent",
              }}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className="px-5 py-4 border-t text-xs"
        style={{ borderColor: "var(--border-default)", color: "var(--text-muted)" }}
      >
        Claude Agent Studio
      </div>
    </aside>
  );
}
