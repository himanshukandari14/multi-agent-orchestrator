import { PageHeaderSkeleton } from "@/components/skeletons/presets";

export default function Loading() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton showKicker />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="h-80 rounded-xl border border-border/80 bg-surface-elevated/20" />
        <div className="h-80 rounded-xl border border-border/80 bg-surface-elevated/20" />
      </div>
    </div>
  );
}
