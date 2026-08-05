import Link from "next/link";

import { signOut } from "@/auth";
import { QuickCapture } from "@/components/capture/QuickCapture";
import { Button } from "@/components/ui/button";

export function AppShell({
  children,
  userName,
}: {
  children: React.ReactNode;
  userName?: string | null;
}) {
  return (
    <div className="min-h-screen bg-brain">
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 md:px-8">
        <header className="mb-8 flex flex-col gap-4 border-b border-border pb-6">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="text-brand">
              Cerebrizky
            </Link>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="hidden sm:inline">{userName}</span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/login" });
                }}
              >
                <Button type="submit" variant="ghost" size="sm">
                  Sign out
                </Button>
              </form>
            </div>
          </div>
          <QuickCapture />
        </header>
        <main className="flex-1 pb-10">{children}</main>
      </div>
    </div>
  );
}
