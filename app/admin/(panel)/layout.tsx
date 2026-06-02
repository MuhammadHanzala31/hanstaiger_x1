import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../actions";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/reservations", label: "Reservations" },
  { href: "/admin/availability", label: "Availability" },
  { href: "/admin/yachts", label: "Yachts" },
  { href: "/admin/services", label: "Services" },
];

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense in depth — middleware also guards, but never trust a single gate.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  return (
    <div className="flex min-h-screen bg-grey-900 text-white">
      <aside className="flex w-60 shrink-0 flex-col border-r border-white/10 px-5 py-6">
        <p className="eyebrow mb-8">Hanstaiger · Admin</p>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="t-body3 rounded-sm px-3 py-2 text-grey-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={signOut} className="mt-auto">
          <button
            type="submit"
            className="t-caption3 text-grey-500 transition-colors hover:text-white"
          >
            Sign out · {user.email}
          </button>
        </form>
      </aside>
      <main className="flex-1 overflow-y-auto px-10 py-8">{children}</main>
    </div>
  );
}
