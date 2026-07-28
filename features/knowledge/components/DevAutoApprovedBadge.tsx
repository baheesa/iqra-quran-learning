import {
  DEV_AUTO_APPROVE_BADGE,
  DEV_AUTO_APPROVER,
} from "@/features/knowledge/providers/auto-approve-enabled";

type Props = {
  approvedBy?: string | null;
  className?: string;
};

/**
 * Shows when a page/book was approved by development auto-approval
 * (not a manual human review).
 */
export function DevAutoApprovedBadge({ approvedBy, className }: Props) {
  if (approvedBy !== DEV_AUTO_APPROVER) {
    return null;
  }

  return (
    <span
      className={
        className ??
        "inline-flex items-center rounded-lg border border-amber-600/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-800"
      }
      title="Not manually reviewed — development auto-approval only"
    >
      {DEV_AUTO_APPROVE_BADGE}
    </span>
  );
}
