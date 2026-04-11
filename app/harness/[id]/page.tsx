"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/store";
import { HarnessCanvas } from "@/components/HarnessCanvas";
import { ChevronLeft } from "lucide-react";

export default function HarnessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { harnesses } = useStore();

  const harness = harnesses.find((h) => h.id === id);
  if (!harness) return notFound();

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div
        className="flex items-center gap-4 px-6 py-3 flex-shrink-0"
        style={{
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-default)",
        }}
      >
        <Link
          href="/harness"
          className="flex items-center gap-1 text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          <ChevronLeft size={14} />
          Harnesses
        </Link>
        <div style={{ width: 1, height: 16, background: "var(--border-default)" }} />
        <div>
          <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            {harness.name}
          </span>
          {harness.description && (
            <span className="text-xs ml-3" style={{ color: "var(--text-muted)" }}>
              {harness.description}
            </span>
          )}
        </div>
        <div className="ml-auto text-xs" style={{ color: "var(--text-muted)" }}>
          {harness.nodes.length} agents · {harness.edges.length} connections ·{" "}
          <span style={{ color: "var(--text-muted)" }}>
            Drag to connect · Backspace to delete
          </span>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1" style={{ height: "calc(100vh - 57px)" }}>
        <HarnessCanvas harness={harness} />
      </div>
    </div>
  );
}
