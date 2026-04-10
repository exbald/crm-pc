import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Sidebar userRole={session.user.role} />
      <Topbar />
      <main className="ml-60 pt-14">
        <div className="mx-auto max-w-[1440px] p-6">{children}</div>
      </main>
    </div>
  );
}
