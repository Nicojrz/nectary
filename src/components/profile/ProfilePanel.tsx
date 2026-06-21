"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Feather, GitBranch, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreativeStateToggle } from "@/components/layout/CreativeStateToggle";
import type { CreativeState } from "@/types/nectary";
import { useAuth } from "@/hooks";
import { createClient } from "@/lib/supabase/client";

interface ProfilePanelProps {
  creativeState: CreativeState;
  onCreativeStateChange: (state: CreativeState) => void;
}

export function ProfilePanel({ creativeState, onCreativeStateChange }: ProfilePanelProps) {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({ 
    sparks: 0, wips: 0, forks: 0, level: 1, 
    name: "Escritor", handle: "@escritor", initials: "ES" 
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      const supabase = createClient();
      
      try {
        const [profileRes, sparksRes, wipsRes, forksRes] = await Promise.all([
          supabase.from('profiles').select('level, name').eq('id', user.id).single(),
          supabase.from('sparks').select('id', { count: 'exact', head: true }).eq('author_id', user.id).is('deleted_at', null),
          supabase.from('wips').select('id', { count: 'exact', head: true }).eq('author_id', user.id).is('deleted_at', null).eq('is_draft', false),
          supabase.from('forks').select('id', { count: 'exact', head: true }).eq('forker_id', user.id)
        ]);

        const dbName = profileRes.data?.name || user.user_metadata?.name || user.email?.split('@')[0] || "Escritor";
        
        setStats({
          level: profileRes.data?.level || 1,
          sparks: sparksRes.count || 0,
          wips: wipsRes.count || 0,
          forks: forksRes.count || 0,
          name: dbName,
          handle: `@${dbName.toLowerCase().replace(/\s+/g, '')}`,
          initials: dbName.substring(0, 2).toUpperCase()
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (authLoading) {
    return (
      <section className="glass-panel flex h-48 items-center justify-center rounded-3xl p-5">
        <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
      </section>
    );
  }

  if (!user) return null;

  return (
    <section className="glass-panel rounded-3xl p-5" aria-label="Tu perfil de escritura">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {stats.initials}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">{stats.name}</p>
          <p className="text-xs text-muted-foreground">{stats.handle} · nivel {stats.level}</p>
        </div>
      </div>

      <div className="mt-5 border-t border-border/60 pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">¿Cómo escribes hoy?</p>
        <CreativeStateToggle value={creativeState} onChange={onCreativeStateChange} className="mt-2 w-full justify-between" />
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Solo tú ves este estado. Úsalo para ajustar tu ritmo, no para medirte.</p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border/60 pt-4 text-center">
        {statsLoading ? (
          <div className="col-span-3 flex justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <ProfileStat icon={Feather} value={stats.sparks.toString()} label="Sparks" />
            <ProfileStat icon={BookOpen} value={stats.wips.toString()} label="WIPs" />
            <ProfileStat icon={GitBranch} value={stats.forks.toString()} label="Forks" />
          </>
        )}
      </div>

      <Button variant="ghost" className="mt-4 w-full rounded-full text-muted-foreground" asChild>
        <Link href={`/profile/${stats.handle.substring(1)}`}>Ver mi perfil</Link>
      </Button>
    </section>
  );
}

function ProfileStat({ icon: Icon, value, label }: { icon: any; value: string; label: string }) {
  return (
    <div>
      <Icon className="mx-auto mb-1 h-3.5 w-3.5 text-primary" />
      <p className="text-sm font-semibold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
