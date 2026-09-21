import React from "react";
import { GraduationCap, Flame } from "lucide-react";

const TopHeader = ({
  track = "General Learner",
  streak = 0,
  dailyGoal = 10,
  dailyProgress = 0,
}) => {
  const progressPercent =
    dailyGoal > 0 ? Math.min((dailyProgress / dailyGoal) * 100, 100) : 0;

  return (
    <header
      id="top-header-section"
      className="sticky top-0 z-20 bg-neutral-bg/95 backdrop-blur-sm flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 pt-2 border-b border-neutral-border/80 transition-all"
    >
      {/* Left badges: Status & Streak */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Track / Level Badge */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-primary text-xs font-medium">
          <GraduationCap className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>{track}</span>
        </div>

        {/* Streak Badge */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700 text-xs font-medium">
          <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500 shrink-0" />
          <span>{streak} day streak</span>
          <span className="text-xs">🔥</span>
        </div>
      </div>

      {/* Right side: Daily Goal */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 text-neutral-muted text-xs font-medium">
          <div className="w-4 h-4 rounded-full border-2 border-primary/40 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          </div>
          <span>Daily goal</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Progress bar */}
          <div className="w-20 sm:w-28 h-1.5 bg-neutral-200/70 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[11px] font-semibold text-neutral-muted">
            {dailyProgress}/{dailyGoal}
          </span>
        </div>
      </div>
    </header>
  );
};

export default TopHeader;