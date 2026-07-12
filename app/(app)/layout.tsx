import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/app/Sidebar";
import { Topbar } from "@/components/app/Topbar";
import { Toaster } from "@/components/ui/toast";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/login");

  return (
    <div className="relative flex min-h-screen bg-bg">
      {/* Subtle ambient depth behind the whole app */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-32 -top-24 h-[30rem] w-[30rem] rounded-full bg-accent/[0.07] blur-[120px]" />
        <div className="absolute -right-40 top-1/3 h-[26rem] w-[26rem] rounded-full bg-blue/[0.06] blur-[120px]" />
      </div>
      <Sidebar role={user.role} />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <Topbar user={{ name: user.name, email: user.email, role: user.role }} />
        <main className="flex-1 overflow-x-hidden p-5 sm:p-6">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
