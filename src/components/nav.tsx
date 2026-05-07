import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Signout } from "@/modules/auth/components/signout";

export function Nav({
  user,
}: {
  user?: {
    name: string;
    email: string;
  };
}) {
  const initials = user?.name
    ?.split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold"
        >
          Secure payments flow
        </Link>
        <nav className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">Home</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/account">Account</Link>
          </Button>
          {user ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  size="icon"
                  className="rounded-full bg-primary text-xs font-semibold text-primary-foreground"
                >
                  {initials}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-52 flex flex-col gap-3 p-3"
              >
                <div>
                  <p className="truncate text-sm font-medium">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>
                </div>
                <Signout />
              </PopoverContent>
            </Popover>
          ) : (
            <Button asChild size="sm">
              <Link href="/auth">Sign In</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
