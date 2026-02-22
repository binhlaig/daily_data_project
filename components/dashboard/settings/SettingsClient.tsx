// "use client";

// import React, { useEffect, useMemo, useState } from "react";
// import Image from "next/image";
// import {
//   Bell,
//   Lock,
//   Palette,
//   User,
//   Wallet,
//   Globe,
//   ShieldCheck,
//   Save,
// } from "lucide-react";

// import { cn } from "@/lib/utils";
// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Switch } from "@/components/ui/switch";
// import { Label } from "@/components/ui/label";
// import { Separator } from "@/components/ui/separator";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";

// type TabKey = "profile" | "appearance" | "finance" | "notifications" | "security";

// const TAB_ITEMS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
//   { key: "profile", label: "Profile", icon: <User className="h-4 w-4" /> },
//   { key: "appearance", label: "Appearance", icon: <Palette className="h-4 w-4" /> },
//   { key: "finance", label: "Finance", icon: <Wallet className="h-4 w-4" /> },
//   { key: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
//   { key: "security", label: "Security", icon: <Lock className="h-4 w-4" /> },
// ];

// export default function SettingsClient() {
//   const [tab, setTab] = useState<TabKey>("profile");

//   // demo state (later connect to DB)
//   const [name, setName] = useState("Daily Data Admin");
//   const [email, setEmail] = useState("admin@dailydata.app");
//   const [currency, setCurrency] = useState("JPY");
//   const [timezone, setTimezone] = useState("Asia/Tokyo");
//   const [theme, setTheme] = useState<"sky" | "violet" | "mint" | "sunset">("violet");

//   const [notifyEmail, setNotifyEmail] = useState(true);
//   const [notifyDailySummary, setNotifyDailySummary] = useState(true);

//   const [pinLock, setPinLock] = useState(false);
//   const [twoFA, setTwoFA] = useState(false);

//   const themeDot = useMemo(() => {
//     const map: Record<typeof theme, string> = {
//       sky: "bg-sky-400",
//       violet: "bg-violet-400",
//       mint: "bg-emerald-400",
//       sunset: "bg-orange-400",
//     };
//     return map[theme];
//   }, [theme]);

//   return (
//     <div className="min-h-[calc(100vh-1px)] p-4 lg:p-6">
//       {/* Background like the image */}
//       <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-sky-200/40 via-violet-200/30 to-emerald-200/30 dark:from-sky-900/20 dark:via-violet-900/10 dark:to-emerald-900/10">
//         {/* soft blobs */}
//         <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-violet-400/20 blur-3xl" />
//         <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl" />

//         <div className="relative grid gap-4 p-4 lg:p-6 lg:grid-cols-[260px_1fr]">
//           {/* LEFT SIDEBAR (like image) */}
//           <Card className="rounded-2xl border-border/60 bg-white/40 dark:bg-neutral-900/40 backdrop-blur">
//             <div className="p-4">
//               <div className="flex items-center justify-between">
//                 <div className="font-semibold">Settings</div>
//                 <Badge variant="secondary" className="rounded-full">
//                   Admin
//                 </Badge>
//               </div>

//               <Separator className="my-4" />

//               <nav className="space-y-1">
//                 {TAB_ITEMS.map((t) => (
//                   <button
//                     key={t.key}
//                     onClick={() => setTab(t.key)}
//                     className={cn(
//                       "w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
//                       tab === t.key
//                         ? "bg-primary/10 text-primary"
//                         : "hover:bg-muted/50 text-foreground/80"
//                     )}
//                   >
//                     <span className="opacity-80">{t.icon}</span>
//                     <span>{t.label}</span>
//                   </button>
//                 ))}
//               </nav>

//               <Separator className="my-4" />

//               {/* small status bar like the image */}
//               <div className="space-y-2">
//                 <div className="text-xs text-muted-foreground">Setup completion</div>
//                 <div className="h-2 w-full rounded-full bg-muted">
//                   <div className="h-2 w-[70%] rounded-full bg-primary" />
//                 </div>
//                 <div className="flex items-center justify-between text-xs text-muted-foreground">
//                   <span>7 / 10</span>
//                   <span className={cn("h-2 w-2 rounded-full", themeDot)} />
//                 </div>
//               </div>
//             </div>
//           </Card>

//           {/* RIGHT MAIN */}
//           <div className="space-y-4">
//             {/* Top header strip */}
//             <Card className="rounded-2xl border-border/60 bg-white/40 dark:bg-neutral-900/40 backdrop-blur">
//               <div className="p-4 flex items-center justify-between gap-3">
//                 <div className="min-w-0">
//                   <div className="text-sm font-semibold tracking-wide">
//                     Daily Data Settings
//                   </div>
//                   <div className="text-xs text-muted-foreground">
//                     Configure your Income • Outcome • Reports experience
//                   </div>
//                 </div>
//                 <Button className="rounded-xl gap-2">
//                   <Save className="h-4 w-4" />
//                   Save
//                 </Button>
//               </div>
//             </Card>

//             {/* Content */}
//             {tab === "profile" && (
//               <Section title="Profile" icon={<User className="h-4 w-4" />}>
//                 <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
//                   {/* avatar card (image vibe) */}
//                   <Card className="rounded-2xl border-border/60 bg-white/40 dark:bg-neutral-900/40 backdrop-blur p-4">
//                     <div className="flex flex-col items-center gap-3">
//                       <div className="h-24 w-24 rounded-2xl bg-muted/40 overflow-hidden border border-border/60">
//                         {/* optional avatar */}
//                         <Image
//                           src="https://avatars.githubusercontent.com/u/1?v=4"
//                           alt="avatar"
//                           width={96}
//                           height={96}
//                           className="h-24 w-24 object-cover"
//                         />
//                       </div>
//                       <Button variant="secondary" className="rounded-xl w-full">
//                         Change photo
//                       </Button>
//                     </div>
//                   </Card>

//                   <Card className="rounded-2xl border-border/60 bg-white/40 dark:bg-neutral-900/40 backdrop-blur p-4">
//                     <div className="grid gap-4 sm:grid-cols-2">
//                       <div className="space-y-2">
//                         <Label>Name</Label>
//                         <Input value={name} onChange={(e) => setName(e.target.value)} />
//                       </div>
//                       <div className="space-y-2">
//                         <Label>Email</Label>
//                         <Input value={email} onChange={(e) => setEmail(e.target.value)} />
//                       </div>
//                     </div>

//                     <Separator className="my-4" />

//                     <div className="flex items-center justify-between">
//                       <div className="space-y-0.5">
//                         <div className="text-sm font-medium">Role</div>
//                         <div className="text-xs text-muted-foreground">
//                           Admin can access settings and reports
//                         </div>
//                       </div>
//                       <Badge className="rounded-full">ADMIN</Badge>
//                     </div>
//                   </Card>
//                 </div>
//               </Section>
//             )}

//             {tab === "appearance" && (
//               <Section title="Appearance" icon={<Palette className="h-4 w-4" />}>
//                 <Card className="rounded-2xl border-border/60 bg-white/40 dark:bg-neutral-900/40 backdrop-blur p-4">
//                   <div className="space-y-4">
//                     <div className="flex items-center justify-between">
//                       <div className="space-y-0.5">
//                         <div className="text-sm font-medium">Theme accent</div>
//                         <div className="text-xs text-muted-foreground">
//                           Choose a color that matches your dashboard
//                         </div>
//                       </div>
//                       <div className={cn("h-3 w-3 rounded-full", themeDot)} />
//                     </div>

//                     <div className="grid grid-cols-4 gap-2">
//                       <ThemeButton label="Sky" active={theme === "sky"} onClick={() => setTheme("sky")} dot="bg-sky-400" />
//                       <ThemeButton label="Violet" active={theme === "violet"} onClick={() => setTheme("violet")} dot="bg-violet-400" />
//                       <ThemeButton label="Mint" active={theme === "mint"} onClick={() => setTheme("mint")} dot="bg-emerald-400" />
//                       <ThemeButton label="Sunset" active={theme === "sunset"} onClick={() => setTheme("sunset")} dot="bg-orange-400" />
//                     </div>

//                     <Separator />

//                     <div className="flex items-center justify-between">
//                       <div className="space-y-0.5">
//                         <div className="text-sm font-medium">Glass blur</div>
//                         <div className="text-xs text-muted-foreground">
//                           Keep the soft background effect
//                         </div>
//                       </div>
//                       <Badge variant="outline" className="rounded-full">
//                         ON
//                       </Badge>
//                     </div>
//                   </div>
//                 </Card>
//               </Section>
//             )}

//             {tab === "finance" && (
//               <Section title="Finance" icon={<Wallet className="h-4 w-4" />}>
//                 <Card className="rounded-2xl border-border/60 bg-white/40 dark:bg-neutral-900/40 backdrop-blur p-4">
//                   <div className="grid gap-4 sm:grid-cols-2">
//                     <div className="space-y-2">
//                       <Label>Currency</Label>
//                       <Input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="JPY / MMK / USD" />
//                       <p className="text-xs text-muted-foreground">
//                         Dashboard totals will display using this currency.
//                       </p>
//                     </div>

//                     <div className="space-y-2">
//                       <Label>Timezone</Label>
//                       <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="Asia/Tokyo" />
//                       <p className="text-xs text-muted-foreground">
//                         Used for Today / Month calculations.
//                       </p>
//                     </div>
//                   </div>

//                   <Separator className="my-4" />

//                   <div className="flex items-center justify-between">
//                     <div className="space-y-0.5">
//                       <div className="text-sm font-medium flex items-center gap-2">
//                         <Globe className="h-4 w-4 opacity-70" /> Date format
//                       </div>
//                       <div className="text-xs text-muted-foreground">
//                         yyyy-mm-dd (recommended)
//                       </div>
//                     </div>
//                     <Badge variant="secondary" className="rounded-full">
//                       ISO
//                     </Badge>
//                   </div>
//                 </Card>
//               </Section>
//             )}

//             {tab === "notifications" && (
//               <Section title="Notifications" icon={<Bell className="h-4 w-4" />}>
//                 <Card className="rounded-2xl border-border/60 bg-white/40 dark:bg-neutral-900/40 backdrop-blur p-4 space-y-4">
//                   <RowToggle
//                     title="Email notifications"
//                     desc="Receive important alerts by email"
//                     checked={notifyEmail}
//                     onCheckedChange={setNotifyEmail}
//                   />
//                   <Separator />
//                   <RowToggle
//                     title="Daily summary"
//                     desc="Send daily income/outcome summary"
//                     checked={notifyDailySummary}
//                     onCheckedChange={setNotifyDailySummary}
//                   />
//                 </Card>
//               </Section>
//             )}

//             {tab === "security" && (
//               <Section title="Security" icon={<ShieldCheck className="h-4 w-4" />}>
//                 <Card className="rounded-2xl border-border/60 bg-white/40 dark:bg-neutral-900/40 backdrop-blur p-4 space-y-4">
//                   <RowToggle
//                     title="PIN lock"
//                     desc="Require PIN before opening dashboard"
//                     checked={pinLock}
//                     onCheckedChange={setPinLock}
//                   />
//                   <Separator />
//                   <RowToggle
//                     title="Two-factor (2FA)"
//                     desc="Extra security for admin accounts"
//                     checked={twoFA}
//                     onCheckedChange={setTwoFA}
//                   />
//                   <Separator />
//                   <div className="flex items-center justify-between">
//                     <div className="space-y-0.5">
//                       <div className="text-sm font-medium">Change password</div>
//                       <div className="text-xs text-muted-foreground">
//                         Recommended every 3 months
//                       </div>
//                     </div>
//                     <Button variant="secondary" className="rounded-xl">
//                       Update
//                     </Button>
//                   </div>
//                 </Card>
//               </Section>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// function Section({
//   title,
//   icon,
//   children,
// }: {
//   title: string;
//   icon: React.ReactNode;
//   children: React.ReactNode;
// }) {
//   return (
//     <div className="space-y-3">
//       <div className="flex items-center gap-2 px-1">
//         <span className="opacity-70">{icon}</span>
//         <div className="text-sm font-semibold">{title}</div>
//       </div>
//       {children}
//     </div>
//   );
// }

// function ThemeButton({
//   label,
//   active,
//   onClick,
//   dot,
// }: {
//   label: string;
//   active: boolean;
//   onClick: () => void;
//   dot: string;
// }) {
//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       className={cn(
//         "rounded-xl border border-border/70 bg-white/40 dark:bg-neutral-900/40 backdrop-blur px-3 py-2 text-xs flex items-center justify-between",
//         active && "ring-2 ring-primary/30"
//       )}
//     >
//       <span className="text-muted-foreground">{label}</span>
//       <span className={cn("h-3 w-3 rounded-full", dot)} />
//     </button>
//   );
// }

// function RowToggle({
//   title,
//   desc,
//   checked,
//   onCheckedChange,
// }: {
//   title: string;
//   desc: string;
//   checked: boolean;
//   onCheckedChange: (v: boolean) => void;
// }) {
//   return (
//     <div className="flex items-center justify-between gap-4">
//       <div className="min-w-0">
//         <div className="text-sm font-medium">{title}</div>
//         <div className="text-xs text-muted-foreground">{desc}</div>
//       </div>
//       <Switch checked={checked} onCheckedChange={onCheckedChange} />
//     </div>
//   );
// }

"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Bell,
  Lock,
  Palette,
  User,
  Wallet,
  Globe,
  ShieldCheck,
  Save,
  LoaderCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";
import { IconLogout } from "@tabler/icons-react";

type TabKey =
  | "profile"
  | "appearance"
  | "finance"
  | "notifications"
  | "security";

type ThemeKey = "sky" | "violet" | "mint" | "sunset";

type SettingsDTO = {
  currency?: string;
  timezone?: string;
  theme?: ThemeKey;

  notifyEmail?: boolean;
  notifyDailySummary?: boolean;

  pinLock?: boolean;
  twoFA?: boolean;
};

type UserInfo = {
  id?: string;
  name?: string;
  email?: string;
  image?: string;
  role?: string;
};

const TAB_ITEMS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "profile", label: "Profile", icon: <User className="h-4 w-4" /> },
  {
    key: "appearance",
    label: "Appearance",
    icon: <Palette className="h-4 w-4" />,
  },
  { key: "finance", label: "Finance", icon: <Wallet className="h-4 w-4" /> },
  {
    key: "notifications",
    label: "Notifications",
    icon: <Bell className="h-4 w-4" />,
  },
  { key: "security", label: "Security", icon: <Lock className="h-4 w-4" /> },
];

export default function SettingsClient({ user }: { user: UserInfo }) {
  const [tab, setTab] = useState<TabKey>("profile");
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  // settings (saved)
  const [currency, setCurrency] = useState("JPY");
  const [timezone, setTimezone] = useState("Asia/Tokyo");
  const [theme, setTheme] = useState<ThemeKey>("violet");

  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyDailySummary, setNotifyDailySummary] = useState(true);

  const [pinLock, setPinLock] = useState(false);
  const [twoFA, setTwoFA] = useState(false);

  // loading + save states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const themeDot = useMemo(() => {
    const map: Record<ThemeKey, string> = {
      sky: "bg-sky-400",
      violet: "bg-violet-400",
      mint: "bg-emerald-400",
      sunset: "bg-orange-400",
    };
    return map[theme];
  }, [theme]);

  // ✅ Load settings from DB
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setIsLoading(true);
        setErrorMsg(null);

        const res = await fetch("/api/settings", { method: "GET" });
        if (!res.ok) {
          const t = await safeText(res);
          throw new Error(t || `Failed to load settings (${res.status})`);
        }

        const json = await res.json();
        const s: SettingsDTO = json?.settings ?? {};

        if (!mounted) return;

        setCurrency(s.currency ?? "JPY");
        setTimezone(s.timezone ?? "Asia/Tokyo");
        setTheme((s.theme as ThemeKey) ?? "violet");

        setNotifyEmail(Boolean(s.notifyEmail ?? true));
        setNotifyDailySummary(Boolean(s.notifyDailySummary ?? true));

        setPinLock(Boolean(s.pinLock ?? false));
        setTwoFA(Boolean(s.twoFA ?? false));
      } catch (e:any) {
        if (!mounted) return;
        setErrorMsg(e?.message ?? "Failed to load settings");
      } finally {
        if (!mounted) return;
        setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // ✅ Save settings to DB
  async function onSave() {
    try {
      setIsSaving(true);
      setErrorMsg(null);

      const payload: SettingsDTO = {
        currency: currency?.trim() || "JPY",
        timezone: timezone?.trim() || "Asia/Tokyo",
        theme,

        notifyEmail,
        notifyDailySummary,

        pinLock,
        twoFA,
      };

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const t = await safeText(res);
        throw new Error(t || `Save failed (${res.status})`);
      }
    } catch (e:any) {
      setErrorMsg(e?.message ?? "Save failed");
    } finally {
      setIsSaving(false);
    }
  }

  async function onLogout() {
    setLoading(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            // ✅ Redirect to sign-in page after logout
            window.location.href = "/sign-in";
          },
        },
      });
    } catch (error) {
      console.error("Logout failed", error);
    }
  }

  return (
    <div className="min-h-[calc(100vh-1px)] p-4 lg:p-6">
      <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-sky-200/40 via-violet-200/30 to-emerald-200/30 dark:from-sky-900/20 dark:via-violet-900/10 dark:to-emerald-900/10">
        <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl" />

        <div className="relative grid gap-4 p-4 lg:p-6 lg:grid-cols-[260px_1fr]">
          {/* LEFT SIDEBAR */}
          <Card className="rounded-2xl border-border/60 bg-white/40 dark:bg-neutral-900/40 backdrop-blur">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold">Settings</div>
                <Badge variant="secondary" className="rounded-full">
                  Admin
                </Badge>
              </div>

              <Separator className="my-4" />

              <nav className="space-y-1">
                {TAB_ITEMS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={cn(
                      "w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
                      tab === t.key
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted/50 text-foreground/80"
                    )}
                  >
                    <span className="opacity-80">{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </nav>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  Setup completion
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-2 w-[70%] rounded-full bg-primary" />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>7 / 10</span>
                  <span className={cn("h-2 w-2 rounded-full", themeDot)} />
                </div>
              </div>
            </div>
          </Card>

          {/* RIGHT MAIN */}
          <div className="space-y-4">
            {/* Top header strip */}
            <Card className="rounded-2xl border-border/60 bg-white/40 dark:bg-neutral-900/40 backdrop-blur">
              <div className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold tracking-wide">
                    Daily Data Settings
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Configure your Income • Outcome • Reports experience
                  </div>
                </div>

                <Button
                  className="rounded-xl gap-2"
                  onClick={onSave}
                  disabled={isLoading || isSaving}
                >
                  {isSaving ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save
                    </>
                  )}
                </Button>
              </div>

              {(isLoading || errorMsg) && (
                <div className="px-4 pb-4">
                  {isLoading ? (
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Loading settings...
                    </div>
                  ) : errorMsg ? (
                    <div className="text-xs text-rose-600 dark:text-rose-400">
                      {errorMsg}
                    </div>
                  ) : null}
                </div>
              )}
            </Card>

            {/* Content */}
            {tab === "profile" && (
              <Section title="Profile" icon={<User className="h-4 w-4" />}>
                <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
                  <Card className="rounded-2xl border-border/60 bg-white/40 dark:bg-neutral-900/40 backdrop-blur p-4">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-24 w-24 rounded-2xl bg-muted/40 overflow-hidden border border-border/60">
                        <Image
                          src={user?.image?.trim() ? user.image : "/avatar.png"}
                          alt="avatar"
                          width={96}
                          height={96}
                          className="h-24 w-24 object-cover"
                          priority
                        />
                      </div>
                      <Button
                        variant="secondary"
                        className="rounded-xl w-full"
                        disabled
                      >
                        Change photo (soon)
                      </Button>
                    </div>
                  </Card>

                  <Card className="rounded-2xl border-border/60 bg-white/40 dark:bg-neutral-900/40 backdrop-blur p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">Role</div>
                        <div className="text-xs text-muted-foreground">
                          Admin can access settings and reports
                        </div>
                      </div>
                      <Badge className="rounded-full">
                        {user?.role || "USER"}
                      </Badge>
                    </div>
                  </Card>
                  <div className="">
                    <Separator className="my-4" />
                    <Button
                      variant="outline"
                      className="w-full rounded-xl cursor-pointer border-rose-600 text-rose-600 hover:bg-rose-600/10 dark:border-rose-400 dark:text-rose-400 dark:hover:bg-rose-400/10"
                      onClick={onLogout}
                    >
                      <IconLogout className="h-5 w-5" />
                      <span>{loading ? "Logging out..." : "Logout"}</span>
                    </Button>
                  </div>
                </div>
              </Section>
            )}

            {tab === "appearance" && (
              <Section
                title="Appearance"
                icon={<Palette className="h-4 w-4" />}
              >
                <Card className="rounded-2xl border-border/60 bg-white/40 dark:bg-neutral-900/40 backdrop-blur p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">Theme accent</div>
                        <div className="text-xs text-muted-foreground">
                          Choose a color that matches your dashboard
                        </div>
                      </div>
                      <div className={cn("h-3 w-3 rounded-full", themeDot)} />
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <ThemeButton
                        label="Sky"
                        active={theme === "sky"}
                        onClick={() => setTheme("sky")}
                        dot="bg-sky-400"
                      />
                      <ThemeButton
                        label="Violet"
                        active={theme === "violet"}
                        onClick={() => setTheme("violet")}
                        dot="bg-violet-400"
                      />
                      <ThemeButton
                        label="Mint"
                        active={theme === "mint"}
                        onClick={() => setTheme("mint")}
                        dot="bg-emerald-400"
                      />
                      <ThemeButton
                        label="Sunset"
                        active={theme === "sunset"}
                        onClick={() => setTheme("sunset")}
                        dot="bg-orange-400"
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">Glass blur</div>
                        <div className="text-xs text-muted-foreground">
                          Keep the soft background effect
                        </div>
                      </div>
                      <Badge variant="outline" className="rounded-full">
                        ON
                      </Badge>
                    </div>
                  </div>
                </Card>
              </Section>
            )}

            {tab === "finance" && (
              <Section title="Finance" icon={<Wallet className="h-4 w-4" />}>
                <Card className="rounded-2xl border-border/60 bg-white/40 dark:bg-neutral-900/40 backdrop-blur p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Input
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        placeholder="JPY / MMK / USD"
                        disabled={isLoading}
                      />
                      <p className="text-xs text-muted-foreground">
                        Dashboard totals will display using this currency.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Timezone</Label>
                      <Input
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        placeholder="Asia/Tokyo"
                        disabled={isLoading}
                      />
                      <p className="text-xs text-muted-foreground">
                        Used for Today / Month calculations.
                      </p>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium flex items-center gap-2">
                        <Globe className="h-4 w-4 opacity-70" /> Date format
                      </div>
                      <div className="text-xs text-muted-foreground">
                        yyyy-mm-dd (recommended)
                      </div>
                    </div>
                    <Badge variant="secondary" className="rounded-full">
                      ISO
                    </Badge>
                  </div>
                </Card>
              </Section>
            )}

            {tab === "notifications" && (
              <Section
                title="Notifications"
                icon={<Bell className="h-4 w-4" />}
              >
                <Card className="rounded-2xl border-border/60 bg-white/40 dark:bg-neutral-900/40 backdrop-blur p-4 space-y-4">
                  <RowToggle
                    title="Email notifications"
                    desc="Receive important alerts by email"
                    checked={notifyEmail}
                    onCheckedChange={setNotifyEmail}
                    disabled={isLoading}
                  />
                  <Separator />
                  <RowToggle
                    title="Daily summary"
                    desc="Send daily income/outcome summary"
                    checked={notifyDailySummary}
                    onCheckedChange={setNotifyDailySummary}
                    disabled={isLoading}
                  />
                </Card>
              </Section>
            )}

            {tab === "security" && (
              <Section
                title="Security"
                icon={<ShieldCheck className="h-4 w-4" />}
              >
                <Card className="rounded-2xl border-border/60 bg-white/40 dark:bg-neutral-900/40 backdrop-blur p-4 space-y-4">
                  <RowToggle
                    title="PIN lock"
                    desc="Require PIN before opening dashboard"
                    checked={pinLock}
                    onCheckedChange={setPinLock}
                    disabled={isLoading}
                  />
                  <Separator />
                  <RowToggle
                    title="Two-factor (2FA)"
                    desc="Extra security for admin accounts"
                    checked={twoFA}
                    onCheckedChange={setTwoFA}
                    disabled={isLoading}
                  />
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">Change password</div>
                      <div className="text-xs text-muted-foreground">
                        Recommended every 3 months
                      </div>
                    </div>
                    <Button variant="secondary" className="rounded-xl" disabled>
                      Update (soon)
                    </Button>
                  </div>
                </Card>
              </Section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

async function safeText(res: Response) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <span className="opacity-70">{icon}</span>
        <div className="text-sm font-semibold">{title}</div>
      </div>
      {children}
    </div>
  );
}

function ThemeButton({
  label,
  active,
  onClick,
  dot,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  dot: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border border-border/70 bg-white/40 dark:bg-neutral-900/40 backdrop-blur px-3 py-2 text-xs flex items-center justify-between transition",
        active && "ring-2 ring-primary/30"
      )}
    >
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("h-3 w-3 rounded-full", dot)} />
    </button>
  );
}

function RowToggle({
  title,
  desc,
  checked,
  onCheckedChange,
  disabled,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}
