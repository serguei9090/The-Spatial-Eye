import type { Edge, Node } from "@xyflow/react";

export function downloadDiagram(nodes: Node[], edges: Edge[]) {
  const data = JSON.stringify(
    { nodes, edges, version: "1.0", timestamp: Date.now() },
    null,
    2,
  );
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `spatial-eye-architecture-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function uploadDiagram(
  file: File,
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  try {
    const text = await file.text();
    const content = JSON.parse(text);
    if (content.nodes && content.edges) {
      return { nodes: content.nodes, edges: content.edges };
    }
    throw new Error("Invalid diagram file format");
  } catch (err) {
    throw err instanceof Error ? err : new Error("File read error");
  }
}
