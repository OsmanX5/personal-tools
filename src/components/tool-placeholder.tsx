import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction } from "lucide-react";

interface ToolPlaceholderProps {
  name: string;
  description: string;
}

export function ToolPlaceholder({ name, description }: ToolPlaceholderProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20">
      <Card className="w-full max-w-md text-center">
        <CardContent className="flex flex-col items-center gap-4 pt-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Construction className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">{name}</h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
          <Badge variant="secondary">Coming Soon</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
