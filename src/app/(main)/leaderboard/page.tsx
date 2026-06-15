/**
 * Leaderboard Page — RF-KM-04
 * Async Server Component. Reads directly from the materialized view `leaderboard`.
 * No client-side JS required — data is fetched at request time on the server.
 */

//import { createClient } from "@/lib/supabase/server";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

type LeaderboardEntry = {
  rank: number;
  id: string;
  name: string | null;
  avatar_url: string | null;
  level: number;
  xp_total: number;
  spark_count: number;
  wip_count: number;
  pm_count: number;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400/20 text-lg font-black text-yellow-400">
        🥇
      </span>
    );
  if (rank === 2)
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-400/20 text-lg font-black text-zinc-300">
        🥈
      </span>
    );
  if (rank === 3)
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-700/20 text-lg font-black text-amber-600">
        🥉
      </span>
    );

  return (
    <span className="flex h-8 w-8 items-center justify-center text-sm font-semibold text-muted-foreground">
      {rank}
    </span>
  );
}

function Avatar({ name, avatarUrl }: { name: string | null; avatarUrl: string | null }) {
  const initials = (name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name ?? "Avatar"}
        width={40}
        height={40}
        className="h-10 w-10 rounded-full object-cover ring-2 ring-white/10"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary ring-2 ring-white/10">
      {initials}
    </div>
  );
}

function LevelPill({ level }: { level: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
      <span className="text-[10px]">⚡</span>
      Nv. {level}
    </span>
  );
}

function StatChip({
  icon,
  count,
  label,
}: {
  icon: string;
  count: number;
  label: string;
}) {
  return (
    <span
      title={label}
      className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-xs text-muted-foreground"
    >
      <span>{icon}</span>
      <span className="font-medium text-foreground">{count}</span>
    </span>
  );
}

// ─── Row component (top-3 card vs regular row) ───────────────────────────────

function TopCard({ entry }: { entry: LeaderboardEntry }) {
  const ringColors: Record<number, string> = {
    1: "ring-yellow-400/50 shadow-yellow-400/10",
    2: "ring-zinc-400/40 shadow-zinc-400/10",
    3: "ring-amber-600/40 shadow-amber-600/10",
  };
  const ring = ringColors[entry.rank] ?? "";

  return (
    <div
      className={`glass flex items-center gap-4 rounded-2xl p-4 ring-1 shadow-lg ${ring} transition-transform hover:-translate-y-0.5`}
    >
      <RankBadge rank={entry.rank} />
      <Avatar name={entry.name} avatarUrl={entry.avatar_url} />

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-foreground">
          {entry.name ?? "Escritor anónimo"}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <LevelPill level={entry.level} />
          <span className="text-xs text-muted-foreground">
            {entry.xp_total.toLocaleString("es-MX")} XP
          </span>
        </div>
      </div>

      <div className="hidden items-center gap-1.5 sm:flex">
        <StatChip icon="✦" count={entry.spark_count} label="Sparks" />
        <StatChip icon="🔧" count={entry.wip_count} label="WIPs" />
        <StatChip icon="📋" count={entry.pm_count} label="Post-Mortems" />
      </div>
    </div>
  );
}

function TableRow({ entry }: { entry: LeaderboardEntry }) {
  return (
    <tr className="group border-b border-white/5 transition-colors last:border-0 hover:bg-white/5">
      {/* Rank */}
      <td className="py-3 pl-4 pr-2 text-center">
        <RankBadge rank={entry.rank} />
      </td>

      {/* Author */}
      <td className="py-3 px-3">
        <div className="flex items-center gap-3">
          <Avatar name={entry.name} avatarUrl={entry.avatar_url} />
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">
              {entry.name ?? "Escritor anónimo"}
            </p>
            <LevelPill level={entry.level} />
          </div>
        </div>
      </td>

      {/* XP */}
      <td className="py-3 px-3 text-right font-mono text-sm font-semibold text-primary">
        {entry.xp_total.toLocaleString("es-MX")}
      </td>

      {/* Sparks */}
      <td className="hidden py-3 px-3 text-center text-sm text-muted-foreground sm:table-cell">
        {entry.spark_count}
      </td>

      {/* WIPs */}
      <td className="hidden py-3 px-3 text-center text-sm text-muted-foreground md:table-cell">
        {entry.wip_count}
      </td>

      {/* Post-Mortems */}
      <td className="hidden py-3 px-3 text-center text-sm text-muted-foreground lg:table-cell">
        {entry.pm_count}
      </td>
    </tr>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 py-20 text-center">
      <span className="text-4xl">🏆</span>
      <p className="font-semibold text-foreground">Aún no hay escritores en el ranking</p>
      <p className="max-w-xs text-sm text-muted-foreground">
        Publica tu primer Spark o WIP para aparecer aquí.
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

// ─── Page (Mocked for Local Development) ───────────────────────────────────────

export default async function LeaderboardPage() {
  // Datos simulados de prueba (Mock) para desarrollo local
  const mockEntries: LeaderboardEntry[] = [
    {
      rank: 1,
      id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      name: "Gabo Márquez",
      avatar_url: null,
      level: 16,
      xp_total: 1500,
      spark_count: 12,
      wip_count: 5,
      pm_count: 2
    },
    {
      rank: 2,
      id: "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
      name: "Sor Juana Inés",
      avatar_url: null,
      level: 13,
      xp_total: 1200,
      spark_count: 9,
      wip_count: 4,
      pm_count: 1
    },
    {
      rank: 3,
      id: "c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f",
      name: "Juan Rulfo",
      avatar_url: null,
      level: 9,
      xp_total: 800,
      spark_count: 6,
      wip_count: 2,
      pm_count: 3
    },
    {
      rank: 4,
      id: "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
      name: "Julio Cortázar",
      avatar_url: null,
      level: 4,
      xp_total: 300,
      spark_count: 3,
      wip_count: 1,
      pm_count: 0
    }
  ];

  /*//  ESTO ES LO QUE SE INYECTA EN SU LUGAR:
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leaderboard")
    .select("rank, id, name, avatar_url, level, xp_total, spark_count, wip_count, pm_count")
    .order("rank", { ascending: true })
    .limit(50);

  // Mapeamos los datos reales de la base de datos
  const entries: LeaderboardEntry[] = (data ?? []).map((row) => ({
    rank: Number(row.rank),
    id: row.id,
    name: row.name,
    avatar_url: row.avatar_url,
    level: row.level,
    xp_total: row.xp_total,
    spark_count: Number(row.spark_count),
    wip_count: Number(row.wip_count),
    pm_count: Number(row.pm_count),
  }));

  // Hacemos exactamente los mismos cortes pero con la variable 'entries' real
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);*/

  // Separamos el podio del resto de la tabla exactamente igual que el diseño de Claude
  const top3 = mockEntries.slice(0, 3);
  const rest = mockEntries.slice(3);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-gradient-primary text-3xl font-black tracking-tight">
          Leaderboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Los 50 escritores con más XP en la plataforma.
        </p>
      </div>

      {mockEntries.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* ── Top 3 podium cards ── */}
          {top3.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Podio
              </h2>
              <div className="space-y-2">
                {top3.map((entry) => (
                  <TopCard key={entry.id} entry={entry} />
                ))}
              </div>
            </section>
          )}

          {/* ── Rest of the table ── */}
          {rest.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Ranking general
              </h2>

              <div className="glass overflow-hidden rounded-2xl">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="py-3 pl-4 pr-2 text-center">#</th>
                      <th className="py-3 px-3">Escritor</th>
                      <th className="py-3 px-3 text-right">XP</th>
                      <th className="hidden py-3 px-3 text-center sm:table-cell">✦ Sparks</th>
                      <th className="hidden py-3 px-3 text-center md:table-cell">🔧 WIPs</th>
                      <th className="hidden py-3 px-3 text-center lg:table-cell">📋 PMs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rest.map((entry) => (
                      <TableRow key={entry.id} entry={entry} />
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      {/* Footer note */}
      <p className="text-center text-xs text-muted-foreground">
        El ranking se actualiza periódicamente.{" "}
        <span className="opacity-50">Modo de desarrollo local · Datos Simulados</span>
      </p>
    </div>
  );
}
