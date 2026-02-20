import { cn } from "@/lib/utils";
import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import {
  Cloud,
  Cpu,
  Database,
  Globe,
  HardDrive,
  Laptop,
  Network,
  Server,
  Smartphone,
} from "lucide-react";

const iconMap = {
  database: Database,
  server: Server,
  cloud: Cloud,
  internet: Globe,
  mobile: Smartphone,
  laptop: Laptop,
  compute: Cpu,
  storage: HardDrive,
  network: Network,
};

export type ArchitectureNodeData = {
  label: string;
  type: keyof typeof iconMap;
  status?: "active" | "inactive" | "warning" | "error";
};

export type ArchitectureNodeObject = Node<ArchitectureNodeData, "architecture">;

export function ArchitectureNode({ data, selected }: NodeProps<ArchitectureNodeObject>) {
  const Icon = (iconMap[data.type as keyof typeof iconMap] || Server) as React.ElementType;

  return (
    <div
      className={cn(
        "px-4 py-2 shadow-md rounded-md border-2 bg-card min-w-[150px]",
        selected ? "border-primary" : "border-border",
        data.status === "error" && "border-destructive",
        data.status === "warning" && "border-yellow-500",
      )}
    >
      <div className="flex items-center">
        <div className="rounded-full w-12 h-12 flex justify-center items-center bg-muted">
          <Icon className="w-6 h-6 text-foreground" />
        </div>
        <div className="ml-2">
          <div className="text-lg font-bold text-foreground">{data.label}</div>
          <div className="text-xs text-muted-foreground capitalize">{data.type}</div>
        </div>
      </div>

      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-muted-foreground" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-muted-foreground" />
    </div>
  );
}
