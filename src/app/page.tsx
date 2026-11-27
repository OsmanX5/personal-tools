import Link from "next/link";
import { tools } from "@/lib/tools-registry";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Personal Tools</h1>
        <p className="text-muted-foreground mt-2">
          A collection of small tools to help organize your life.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link key={tool.slug} href={`/${tool.slug}`}>
              <Card className="group h-full transition-colors hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    {tool.status === "coming-soon" && (
                      <Badge variant="secondary">Coming Soon</Badge>
                    )}
                  </div>
                  <CardTitle className="mt-3 sm:mt-4">{tool.name}</CardTitle>
                  <CardDescription className="line-clamp-3 sm:line-clamp-none">
                    {tool.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-sm:hidden">
                  <span className="inline-flex items-center gap-1 text-sm text-primary transition-opacity hover-device:opacity-0 hover-device:group-hover:opacity-100">
                    Open <ArrowRight className="h-3 w-3" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
