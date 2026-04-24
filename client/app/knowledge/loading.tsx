import { PageHeaderSkeleton } from "@/components/skeletons/presets";

export default function Loading() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton showKicker />
      <div className="mx-auto h-12 max-w-sm rounded-md border border-border/60 bg-surface-elevated/30" />
    </div>
  );
}
