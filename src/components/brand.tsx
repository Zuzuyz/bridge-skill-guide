import { Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return <Link to="/" className="flex items-center gap-3 font-display"><span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"><GraduationCap className="size-5" /></span><span><strong className="block text-lg leading-none">SkillBridge</strong>{!compact && <small className="mt-1 block text-[10px] font-bold uppercase text-muted-foreground">Academia × Industry</small>}</span></Link>;
}