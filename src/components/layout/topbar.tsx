"use client";

import { useSession, signOut } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

export function Topbar() {
  const { data: session } = useSession();

  return (
    <header className="fixed top-0 right-0 left-60 z-30 flex h-14 items-center justify-between border-b border-neutral-100 bg-white px-6">
      <div />
      <div className="flex items-center gap-4">
        {session?.user && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-500">
              {session.user.name}
            </span>
            <Avatar>
              <AvatarFallback name={session.user.name || ""} />
            </Avatar>
            <button
              onClick={() => signOut()}
              className="text-xs text-neutral-400 hover:text-neutral-700"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
