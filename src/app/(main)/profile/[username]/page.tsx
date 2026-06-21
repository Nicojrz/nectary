/**
 * Profile Page — RF-GU-04
 * Route: /profile/[id]
 *
 * Currently using mock data. When Supabase keys are available, replace
 * MOCK_PROFILE, MOCK_BADGES and MOCK_STATS with server queries.
 *
 * Assigned to: Dylan Martínez
 */

import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CreativeState } from "@/types/nectary";
import { Feather, BookOpen, HeartCrack, Unlock, Zap, Pen, Bell, Lock } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Profile = {
  id: string;
  name: string;
  avatar_url: string | null;
  bio: string;
  level: number;
  xp_total: number;
  creative_state: CreativeState;
};

type Badge = {
  id: string;
  key: string;
  label: string;
  description: string;
  icon: string;
  unlocked_at: string; // ISO date string
};

type Stats = {
  spark_count: number;
  wip_count: number;
  pm_count: number;
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_PROFILE: Profile = {
  id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  name: "Dylan Martínez",
  avatar_url: null,
  bio: "Escritor de ciencia ficción y ensayo. Apasionado por los mundos que aún no existen y las ideas que todavía no tienen nombre.",
  level: 7,
  xp_total: 680,
  creative_state: "flow",
};

const MOCK_BADGES: Badge[] = [
  {
    id: "b1",
    key: "first_spark",
    label: "Primera Chispa",
    description: "Publicaste tu primer Spark.",
    icon: "feather",
    unlocked_at: "2025-01-10T12:00:00Z",
  },
  {
    id: "b2",
    key: "first_wip",
    label: "En Construcción",
    description: "Creaste tu primer WIP.",
    icon: "book-open",
    unlocked_at: "2025-01-15T09:30:00Z",
  },
  {
    id: "b3",
    key: "first_pm",
    label: "Post-Mortem",
    description: "Escribiste tu primer Post-Mortem.",
    icon: "heart-crack",
    unlocked_at: "2025-02-03T18:00:00Z",
  },
  {
    id: "b4",
    key: "unblocker",
    label: "Desbloqueador",
    description: "Superaste un bloqueo creativo severo.",
    icon: "unlock",
    unlocked_at: "2025-02-20T11:00:00Z",
  },
  {
    id: "b5",
    key: "level_5",
    label: "Nivel 5",
    description: "Alcanzaste el nivel 5.",
    icon: "zap",
    unlocked_at: "2025-03-01T08:00:00Z",
  },
];

const MOCK_STATS: Stats = {
  spark_count: 24,
  wip_count: 6,
  pm_count: 3,
};

// Simulates whether the viewer owns this profile.
// Replace with: session?.user?.id === params.id
const IS_OWN_PROFILE = true;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const XP_PER_LEVEL = 100;

function xpProgress(xp: number, level: number) {
  const xpAtCurrentLevel = (level - 1) * XP_PER_LEVEL;
  const xpIntoLevel = xp - xpAtCurrentLevel;
  const pct = Math.min(100, Math.round((xpIntoLevel / XP_PER_LEVEL) * 100));
  return { xpIntoLevel, pct };
}

const CREATIVE_STATE_MAP: Record<
  CreativeState,
  { label: string; color: string; dot: string }
> = {
  flow: {
    label: "En flujo",
    color: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  mild: {
    label: "Bloqueo leve",
    color: "text-amber-400",
    dot: "bg-amber-400",
  },
  severe: {
    label: "Bloqueo severo",
    color: "text-rose-400",
    dot: "bg-rose-400",
  },
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Avatar ──────────────────────────────────────────────────────────────────────

function ProfileAvatar({
  name,
  avatarUrl,
  size = 96,
}: {
  name: string;
  avatarUrl: string | null;
  size?: number;
}) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover ring-4 ring-white/10"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-full bg-primary/20 ring-4 ring-white/10 text-2xl font-black text-primary"
      style={{ width: size, height: size }}
    >
      {getInitials(name)}
    </div>
  );
}

// Profile Header ──────────────────────────────────────────────────────────────

function ProfileHeader({
  profile,
  isOwnProfile,
}: {
  profile: Profile;
  isOwnProfile: boolean;
}) {
  const state = CREATIVE_STATE_MAP[profile.creative_state];

  return (
    <div className="glass rounded-2xl p-6 sm:p-8">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">

        {/* Avatar */}
        <div className="shrink-0">
          <ProfileAvatar
            name={profile.name}
            avatarUrl={profile.avatar_url}
            size={96}
          />
        </div>

        {/* Info */}
        <div className="flex-1 space-y-3 text-center sm:text-left">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              {profile.name}
            </h1>

            {/* Creative state */}
            <div className="mt-1.5 inline-flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${state.dot} animate-pulse`}
              />
              <span className={`text-sm font-medium ${state.color}`}>
                {state.label}
              </span>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
              {profile.bio}
            </p>
          )}
        </div>

        {/* CTA */}
        <div className="shrink-0">
          {isOwnProfile ? (
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90 active:scale-95"
            >
              <Pen className="h-4 w-4" /> Editar perfil
            </Link>
          ) : (
            <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white/10 active:scale-95">
              <Bell className="h-4 w-4" /> Seguir
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// XP / Level card ─────────────────────────────────────────────────────────────

function XPCard({ profile }: { profile: Profile }) {
  const { xpIntoLevel, pct } = xpProgress(profile.xp_total, profile.level);
  const nextLevel = profile.level + 1;

  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          <h2 className="font-bold text-foreground">Experiencia</h2>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">XP total</p>
          <p className="font-mono text-lg font-black text-primary">
            {profile.xp_total.toLocaleString("es-MX")}
          </p>
        </div>
      </div>

      {/* Level pill + progress */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-foreground">
              {profile.level}
            </span>
            <span className="text-sm text-muted-foreground">
              / 50
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {xpIntoLevel} / {XP_PER_LEVEL} XP → Nv. {nextLevel}
          </span>
        </div>

        {/* Bar */}
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-right text-xs text-muted-foreground">{pct}%</p>
      </div>
    </div>
  );
}

// Stats grid ──────────────────────────────────────────────────────────────────

type StatItem = {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
};

function StatCard({ icon, label, value, color }: StatItem) {
  return (
    <div className="glass flex flex-col items-center gap-1.5 rounded-2xl p-5 text-center">
      <div className="text-2xl text-muted-foreground">{icon}</div>
      <span className={`text-2xl font-black ${color}`}>
        {value}
      </span>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

function StatsGrid({ stats }: { stats: Stats }) {
  const items: StatItem[] = [
    {
      icon: <Feather className="h-6 w-6" />,
      label: "Sparks",
      value: stats.spark_count,
      color: "text-[var(--spark,#f59e0b)]",
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      label: "WIPs",
      value: stats.wip_count,
      color: "text-[var(--wip,#3b82f6)]",
    },
    {
      icon: <HeartCrack className="h-6 w-6" />,
      label: "Post-Mortems",
      value: stats.pm_count,
      color: "text-[var(--postmortem,#8b5cf6)]",
    },
  ];

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Publicaciones
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {items.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </div>
    </div>
  );
}

function renderBadgeIcon(iconName: string) {
  switch (iconName) {
    case "feather": return <Feather className="h-6 w-6" />;
    case "book-open": return <BookOpen className="h-6 w-6" />;
    case "heart-crack": return <HeartCrack className="h-6 w-6" />;
    case "unlock": return <Unlock className="h-6 w-6" />;
    case "zap": return <Zap className="h-6 w-6" />;
    default: return <Feather className="h-6 w-6" />;
  }
}

// Badge gallery ───────────────────────────────────────────────────────────────

function BadgeCard({ badge }: { badge: Badge }) {
  const date = new Date(badge.unlocked_at).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div
      title={badge.description}
      className="glass group flex flex-col items-center gap-2 rounded-2xl p-4 text-center transition hover:-translate-y-0.5 hover:ring-1 hover:ring-primary/30"
    >
      <div className="flex h-8 w-8 items-center justify-center text-primary">
        {renderBadgeIcon(badge.icon)}
      </div>
      <p className="text-sm font-semibold text-foreground leading-tight">
        {badge.label}
      </p>
      <p className="text-[11px] text-muted-foreground hidden group-hover:block">
        {badge.description}
      </p>
      <p className="text-[11px] text-muted-foreground">{date}</p>
    </div>
  );
}

// Locked badge placeholder ────────────────────────────────────────────────────

function LockedBadge() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/10 p-4 text-center opacity-30">
      <div className="flex h-8 w-8 items-center justify-center text-muted-foreground">
        <Lock className="h-6 w-6" />
      </div>
      <p className="text-xs text-muted-foreground">Bloqueada</p>
    </div>
  );
}

const TOTAL_BADGES = 7;

function BadgeGallery({ badges }: { badges: Badge[] }) {
  const locked = TOTAL_BADGES - badges.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Medallas
        </h2>
        <span className="text-xs text-muted-foreground">
          {badges.length} / {TOTAL_BADGES}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
        {badges.map((b) => (
          <BadgeCard key={b.id} badge={b} />
        ))}
        {Array.from({ length: locked }).map((_, i) => (
          <LockedBadge key={`locked-${i}`} />
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  // 1. Fetch profile by handle
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("handle", username)
    .single();

  if (!profile) {
    notFound();
  }

  // 2. Auth session to check ownership
  const { data: sessionData } = await supabase.auth.getUser();
  const isOwnProfile = sessionData?.user?.id === profile.id;

  // 3. Fetch exact counts for stats
  const [sparksRes, wipsRes, pmsRes] = await Promise.all([
    supabase.from('sparks').select('id', { count: 'exact', head: true }).eq('author_id', profile.id).is('deleted_at', null),
    supabase.from('wips').select('id', { count: 'exact', head: true }).eq('author_id', profile.id).is('deleted_at', null).eq('is_draft', false),
    supabase.from('post_mortems').select('id', { count: 'exact', head: true }).eq('author_id', profile.id).is('deleted_at', null)
  ]);

  const stats = {
    spark_count: sparksRes.count || 0,
    wip_count: wipsRes.count || 0,
    pm_count: pmsRes.count || 0,
  };

  // 4. Badges (Empty for now until user_badges table is ready)
  const badges: Badge[] = [];

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <ProfileHeader profile={profile} isOwnProfile={isOwnProfile} />
      <XPCard profile={profile} />
      <StatsGrid stats={stats} />
      <BadgeGallery badges={badges} />
    </div>
  );
}
