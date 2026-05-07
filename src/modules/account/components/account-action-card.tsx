import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function AccountActionCard({
  icon: Icon,
  title,
  description,
  actionLabel,
  variant = "outline",
  destructive = false,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  variant?: "default" | "outline";
  destructive?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2.5">
        <Icon
          className={cn(
            "size-4 shrink-0",
            destructive ? "text-destructive" : "text-primary",
          )}
        />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
      <Button
        variant={destructive ? "destructive" : variant}
        size="sm"
        className="w-full"
      >
        {actionLabel}
      </Button>
    </div>
  );
}
