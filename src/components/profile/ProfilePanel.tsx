"use client";
import { BookOpen, Feather, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreativeStateToggle } from "@/components/layout/CreativeStateToggle";
import type { CreativeState } from "@/types/nectary";

interface ProfilePanelProps {
  creativeState: CreativeState;
  onCreativeStateChange: (state: CreativeState) => void;
}

export function ProfilePanel({ creativeState, onCreativeStateChange }: ProfilePanelProps) {
  return (
    <section className="glass-panel rounded-3xl p-5" aria-label="Tu perfil de escritura">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">AS</div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">Ana Salvatierra</p>
          <p className="text-xs text-muted-foreground">@anasalva · nivel 12</p>
        </div>
      </div>

      <div className="mt-5 border-t border-border/60 pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">¿Cómo escribes hoy?</p>
        <CreativeStateToggle value={creativeState} onChange={onCreativeStateChange} className="mt-2 w-full justify-between" />
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Solo tú ves este estado. Úsalo para ajustar tu ritmo, no para medirte.</p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border/60 pt-4 text-center">
        <ProfileStat icon={Feather} value="28" label="Sparks" />
        <ProfileStat icon={BookOpen} value="3" label="WIPs" />
        <ProfileStat icon={GitBranch} value="14" label="Forks" />
      </div>

      <Button variant="ghost" className="mt-4 w-full rounded-full text-muted-foreground">Ver mi perfil</Button>
    </section>
  );
}

function ProfileStat({ icon: Icon, value, label }: { icon: typeof Feather; value: string; label: string }) {
  return (
    <div>
      <Icon className="mx-auto mb-1 h-3.5 w-3.5 text-primary" />
      <p className="text-sm font-semibold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}



