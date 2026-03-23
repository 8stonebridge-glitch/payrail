"use client";

import { cn } from "@/lib/utils";
import { Check, X, Clock, Circle } from "lucide-react";

interface StepData {
  stepOrder: number;
  label: string;
  requiredRole: string;
  status: string;
  decidedByName?: string | null;
  decidedAt?: number | null;
  rejectionReason?: string | null;
}

interface ApprovalStepperProps {
  steps: StepData[];
  orientation?: "horizontal" | "vertical";
}

const STEP_ICONS: Record<string, typeof Check> = {
  approved: Check,
  rejected: X,
  waiting: Clock,
  pending: Circle,
  skipped: Circle,
};

const STEP_COLORS: Record<string, string> = {
  approved: "bg-green-500 text-white border-green-500",
  rejected: "bg-red-500 text-white border-red-500",
  waiting: "bg-amber-500 text-white border-amber-500 animate-pulse",
  pending: "bg-slate-800 text-slate-500 border-slate-600",
  skipped: "bg-slate-700 text-slate-400 border-slate-600",
};

const LINE_COLORS: Record<string, string> = {
  approved: "bg-green-500",
  rejected: "bg-red-500",
  waiting: "bg-amber-500",
  pending: "bg-slate-700",
  skipped: "bg-slate-700",
};

export function ApprovalStepper({
  steps,
  orientation = "horizontal",
}: ApprovalStepperProps) {
  if (steps.length === 0) {
    return (
      <div className="text-sm text-slate-500 italic">
        No approval steps generated
      </div>
    );
  }

  if (orientation === "vertical") {
    return <VerticalStepper steps={steps} />;
  }

  return <HorizontalStepper steps={steps} />;
}

function HorizontalStepper({ steps }: { steps: StepData[] }) {
  return (
    <div className="flex items-start gap-0 overflow-x-auto pb-2">
      {steps.map((step, index) => {
        const Icon = STEP_ICONS[step.status] ?? Circle;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.stepOrder} className="flex items-start flex-shrink-0">
            {/* Step node */}
            <div className="flex flex-col items-center min-w-[100px]">
              <div
                className={cn(
                  "w-8 h-8 rounded-full border-2 flex items-center justify-center",
                  STEP_COLORS[step.status]
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="mt-2 text-center">
                <div className="text-xs font-medium text-slate-200 max-w-[90px] truncate">
                  {step.label}
                </div>
                {step.decidedByName && (
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {step.decidedByName}
                  </div>
                )}
                {step.rejectionReason && (
                  <div className="text-[10px] text-red-400 mt-0.5 max-w-[90px] truncate">
                    {step.rejectionReason}
                  </div>
                )}
              </div>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div className="flex items-center pt-4 px-1">
                <div
                  className={cn(
                    "h-0.5 w-8",
                    LINE_COLORS[step.status]
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function VerticalStepper({ steps }: { steps: StepData[] }) {
  return (
    <div className="flex flex-col gap-0">
      {steps.map((step, index) => {
        const Icon = STEP_ICONS[step.status] ?? Circle;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.stepOrder}>
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                    STEP_COLORS[step.status]
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {!isLast && (
                  <div
                    className={cn("w-0.5 h-8", LINE_COLORS[step.status])}
                  />
                )}
              </div>
              <div className="pt-1">
                <div className="text-sm font-medium text-slate-200">
                  {step.label}
                </div>
                <div className="text-xs text-slate-400">{step.requiredRole}</div>
                {step.decidedByName && (
                  <div className="text-xs text-slate-400">
                    by {step.decidedByName}
                  </div>
                )}
                {step.rejectionReason && (
                  <div className="text-xs text-red-400 mt-1">
                    &quot;{step.rejectionReason}&quot;
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
