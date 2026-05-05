"use client";

import { useState, useCallback } from "react";
import Canvas from "@/components/Canvas";
import Toolbar from "@/components/Toolbar";
import SkillPalette from "@/components/panels/SkillPalette";
import OutputPanel from "@/components/panels/OutputPanel";
import { yamlToEdges } from "@/lib/edge-translation";
import { getChain, saveChain, generateChain as apiGenerateChain } from "@/lib/api-client";
import * as yaml from "js-yaml";

interface ChainData {
  version: string;
  name: string;
  model: string;
  nodes: Array<{
    id: string; name: string; skill: string | null; command: string | null;
    instruction: string; inputs: string[]; model?: string; cache?: boolean;
  }>;
}

export default function Home() {
  const [chain, setChain] = useState<ChainData | null>(null);
  const [chainFile, setChainFile] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, "pending" | "running" | "completed" | "failed">>({});
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [outputs, setOutputs] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showNlInput, setShowNlInput] = useState(false);
  const [nlDescription, setNlDescription] = useState("");
  const [nlGenerating, setNlGenerating] = useState(false);
  const [nlError, setNlError] = useState<string | null>(null);

  const edges = chain ? yamlToEdges(chain.nodes) : [];

  const handleRunAll = useCallback(async () => {
    if (!chain || isRunning) return;
    setIsRunning(true);
    setOutputs({});
    setErrors({});
    setNodeStatuses(
      Object.fromEntries(chain.nodes.map((n) => [n.id, "pending"]))
    );

    try {
      const res = await fetch("/api/run-chain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chain }),
      });
      if (!res.ok) throw new Error("Failed to start");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const block of lines) {
          const eventMatch = block.match(/^event: (.+)$/m);
          const dataMatch = block.match(/^data: (.+)$/m);
          if (!eventMatch || !dataMatch) continue;

          const event = eventMatch[1];
          let data: any;
          try { data = JSON.parse(dataMatch[1]); } catch { continue; }

          switch (event) {
            case "node-output":
              setOutputs((prev) => ({
                ...prev,
                [data.nodeId]: (prev[data.nodeId] ?? "") + data.line,
              }));
              break;
            case "node-status":
              setNodeStatuses((prev) => ({ ...prev, [data.nodeId]: data.status }));
              if (data.error) setErrors((prev) => ({ ...prev, [data.nodeId]: data.error }));
              break;
            case "chain-done":
              setIsRunning(false);
              break;
            case "error":
              setNlError(data.error);
              setIsRunning(false);
              break;
          }
        }
      }
    } catch (e: any) {
      setNlError(e.message);
    } finally {
      setIsRunning(false);
    }
  }, [chain, isRunning]);

  const handleSave = useCallback(async () => {
    if (!chain || !chainFile) return;
    setIsSaving(true);
    try {
      const yamlStr = yaml.dump(chain);
      await saveChain(chainFile, yamlStr);
      setHasUnsaved(false);
    } catch (e: any) {
      setNlError(e.message);
    } finally {
      setIsSaving(false);
    }
  }, [chain, chainFile]);

  const handleOpenChain = useCallback(async () => {
    const fileName = prompt("Chain file name (e.g., example.yaml):");
    if (!fileName) return;
    try {
      const content = await getChain(fileName);
      const parsed = yaml.load(content) as ChainData;
      setChain(parsed);
      setChainFile(fileName);
      setHasUnsaved(false);
      setSelectedNodeId(null);
      setOutputs({});
      setNodeStatuses(
        Object.fromEntries(parsed.nodes.map((n) => [n.id, "pending"]))
      );
    } catch (e: any) {
      setNlError(`Open failed: ${e.message}`);
    }
  }, []);

  const handleNLInit = useCallback(() => {
    setShowNlInput(true);
    setNlDescription("");
    setNlError(null);
  }, []);

  const handleNLSubmit = useCallback(async () => {
    if (!nlDescription.trim()) return;
    setNlGenerating(true);
    setNlError(null);
    try {
      const yamlStr = await apiGenerateChain(nlDescription);
      const parsed = yaml.load(yamlStr) as ChainData;
      setChain(parsed);
      setChainFile(`generated-${Date.now()}.yaml`);
      setHasUnsaved(true);
      setShowNlInput(false);
      setNodeStatuses(
        Object.fromEntries(parsed.nodes.map((n) => [n.id, "pending"]))
      );
    } catch (e: any) {
      setNlError(e.message);
    } finally {
      setNlGenerating(false);
    }
  }, [nlDescription]);

  const handleAddSkill = useCallback(
    (skillName: string) => {
      if (!chain) return;
      const newNode = {
        id: `node-${chain.nodes.length + 1}`,
        name: skillName,
        skill: skillName,
        command: null,
        instruction: `Use the ${skillName} skill to...`,
        inputs: chain.nodes.length > 0 ? [chain.nodes[chain.nodes.length - 1].id] : [],
      };
      const updated = { ...chain, nodes: [...chain.nodes, newNode] };
      setChain(updated);
      setHasUnsaved(true);
    },
    [chain]
  );

  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId === selectedNodeId ? null : nodeId);
  }, [selectedNodeId]);

  const handleNodeReRun = useCallback(
    async (nodeId: string) => {
      if (!chain || isRunning) return;
      setIsRunning(true);
      try {
        const res = await fetch("/api/run-chain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chain, fromNode: nodeId }),
        });
        const reader = res.body?.getReader();
        if (!reader) return;
        // Reuse same SSE parsing as handleRunAll
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";
          for (const block of lines) {
            const eventMatch = block.match(/^event: (.+)$/m);
            const dataMatch = block.match(/^data: (.+)$/m);
            if (!eventMatch || !dataMatch) continue;
            const event = eventMatch[1];
            let data: any;
            try { data = JSON.parse(dataMatch[1]); } catch { continue; }
            if (event === "node-output") {
              setOutputs((prev) => ({ ...prev, [data.nodeId]: (prev[data.nodeId] ?? "") + data.line }));
            } else if (event === "node-status") {
              setNodeStatuses((prev) => ({ ...prev, [data.nodeId]: data.status }));
              if (data.error) setErrors((prev) => ({ ...prev, [data.nodeId]: data.error }));
            } else if (event === "chain-done") {
              setIsRunning(false);
            }
          }
        }
      } catch (e: any) {
        setNlError(e.message);
      } finally {
        setIsRunning(false);
      }
    },
    [chain, isRunning]
  );

  const selectedNode = chain?.nodes.find((n) => n.id === selectedNodeId);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Toolbar
        chainName={chain?.name ?? ""}
        isRunning={isRunning}
        hasUnsaved={hasUnsaved}
        onRunAll={handleRunAll}
        onSave={handleSave}
        onNLInit={handleNLInit}
        onOpenChain={handleOpenChain}
        isSaving={isSaving}
      />

      {/* NL Init modal overlay */}
      {showNlInput && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.6)",
        }}>
          <div style={{
            background: "var(--bg-node)", border: "1px solid var(--border)",
            borderRadius: "var(--radius)", padding: 24, width: 500, maxWidth: "90vw",
          }}>
            <div style={{ color: "var(--text-primary)", fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
              Describe your workflow
            </div>
            <textarea
              value={nlDescription}
              onChange={(e) => setNlDescription(e.target.value)}
              placeholder="e.g., Analyze a GitHub repo for Raspberry Pi compatibility and write a decision report"
              rows={4}
              style={{
                width: "100%", background: "var(--bg-canvas)", border: "1px solid var(--border)",
                borderRadius: 4, padding: 10, color: "var(--text-primary)",
                fontSize: 13, fontFamily: "var(--font-ui)", resize: "vertical",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleNLSubmit();
                if (e.key === "Escape") setShowNlInput(false);
              }}
            />
            {nlError && (
              <div style={{ color: "var(--node-failed)", fontSize: 12, marginTop: 8 }}>{nlError}</div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowNlInput(false)}
                style={{
                  background: "transparent", border: "1px solid var(--border)",
                  color: "var(--text-primary)", padding: "6px 16px", borderRadius: 4,
                  fontSize: 12, cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleNLSubmit}
                disabled={nlGenerating}
                style={{
                  background: "var(--accent)", border: "none",
                  color: "#fff", padding: "6px 16px", borderRadius: 4,
                  fontSize: 12, fontWeight: 600, cursor: nlGenerating ? "not-allowed" : "pointer",
                  opacity: nlGenerating ? 0.6 : 1,
                }}
              >
                {nlGenerating ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error toast */}
      {nlError && !showNlInput && (
        <div style={{
          position: "fixed", bottom: 16, right: 16, zIndex: 50,
          background: "var(--node-failed)", color: "#fff", padding: "10px 16px",
          borderRadius: "var(--radius)", fontSize: 13, fontFamily: "var(--font-ui)",
          maxWidth: 400, cursor: "pointer",
        }} onClick={() => setNlError(null)}>
          {nlError}
        </div>
      )}

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left: Skill Palette */}
        <div style={{ width: 240, flexShrink: 0 }}>
          <SkillPalette onAddSkill={handleAddSkill} />
        </div>

        {/* Center: Canvas */}
        <div style={{ flex: 1 }}>
          <Canvas
            chain={chain}
            initialEdges={edges}
            onChainChange={(c) => { setChain(c); setHasUnsaved(true); }}
            nodeStatuses={nodeStatuses}
            onNodeSelect={handleNodeSelect}
            onNodeReRun={handleNodeReRun}
            selectedNodeId={selectedNodeId}
          />
        </div>

        {/* Right: Output Panel */}
        {selectedNode && selectedNodeId && (
          <div style={{ width: 320, flexShrink: 0 }}>
            <OutputPanel
              output={outputs[selectedNodeId] ?? ""}
              nodeName={selectedNode.name}
              status={nodeStatuses[selectedNodeId] ?? "pending"}
              error={errors[selectedNodeId]}
              onClose={() => setSelectedNodeId(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
