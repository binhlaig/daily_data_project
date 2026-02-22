import SettingsClient from "@/components/dashboard/settings/SettingsClient";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
  const h = await headers();
  const session = await auth.api.getSession({
    headers: Object.fromEntries(h.entries()),
  });

  if (!session?.user) redirect("/sign-in");

  const user = session.user as any;
  
  return (
    <SettingsClient
      user={{
        id: user.id ?? undefined,
        name: user.name ?? "",
        email: user.email ?? "",
        image: user.image ?? "",
        role: user.role ?? "",
      }}
    />
  );
}
