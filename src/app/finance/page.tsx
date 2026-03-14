import { ToolPlaceholder } from "@/components/tool-placeholder";
import { tools } from "@/lib/tools-registry";

export default function FinancePage() {
  const tool = tools.find((t) => t.slug === "finance")!;
  return <ToolPlaceholder name={tool.name} description={tool.description} />;
}
