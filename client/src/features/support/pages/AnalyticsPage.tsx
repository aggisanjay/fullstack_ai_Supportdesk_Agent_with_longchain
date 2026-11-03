import { Loader2 } from "lucide-react";
import { ConfidenceDonut, IssuesChart, TrendChart } from "@/components/charts/dashboard-charts";
import { useSupport } from "../supportCtx";

export default function AnalyticsPage() {
  const {
    analytics, analyticsLoading, } = useSupport();
  return (
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 max-w-5xl mx-auto w-full">
        <div className="border-b border-[#242838] pb-5">
          <h1 className="text-2xl font-extrabold text-[#f4f1ea] tracking-tight">Support Operations Analytics</h1>
          <p className="text-xs text-[#a3a8bb] mt-1">
            Volume metrics, resolution rate, escalation distribution, and trending issues.
          </p>
        </div>

        {analyticsLoading || !analytics ? (
          <div className="p-12 text-center text-xs text-[#a3a8bb]">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-[#FF6B0A]" />
            Aggregating analytics data...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="saas-card rounded-2xl p-5 space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#767c92]">Total Incidents</div>
                <div className="text-3xl font-extrabold text-[#f4f1ea]">{analytics.totalTickets}</div>
                <div className="text-xs text-[#a3a8bb]">Lifetime ingested</div>
              </div>

              <div className="saas-card rounded-2xl p-5 space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#767c92]">Resolved SLA</div>
                <div className="text-3xl font-extrabold text-[#5be3a8]">{analytics.resolvedTickets}</div>
                <div className="text-xs text-[#a3a8bb]">
                  {analytics.totalTickets > 0 ? Math.round((analytics.resolvedTickets / analytics.totalTickets) * 100) : 0}% Deflection
                </div>
              </div>

              <div className="saas-card rounded-2xl p-5 space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#767c92]">Escalated Volume</div>
                <div className="text-3xl font-extrabold text-[#ff8a7e]">{analytics.escalatedTickets}</div>
                <div className="text-xs text-[#a3a8bb]">Human triage required</div>
              </div>

              <div className="saas-card rounded-2xl p-5 space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#767c92]">Average Confidence</div>
                <div className="text-3xl font-extrabold text-[#FF6B0A]">{Math.round(analytics.averageConfidence * 100)}%</div>
                <div className="text-xs text-[#a3a8bb]">Grounded calibration</div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="saas-card rounded-2xl p-6 space-y-3 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#f4f1ea] uppercase tracking-wider">Weekly Activity</h3>
                  <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-wider text-[#a3a8bb]">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#5be3a8]" />Resolved</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#ff6b0a]" />Escalated</span>
                  </div>
                </div>
                <TrendChart data={analytics.resolutionTrends} />
              </div>
              <div className="saas-card rounded-2xl p-6 space-y-3">
                <h3 className="text-xs font-bold text-[#f4f1ea] uppercase tracking-wider">Blended Confidence</h3>
                <ConfidenceDonut value={analytics.averageConfidence} label="average" threshold={0.7} />
              </div>
              <div className="saas-card rounded-2xl p-6 space-y-3 lg:col-span-3">
                <h3 className="text-xs font-bold text-[#f4f1ea] uppercase tracking-wider">Top Inbound Issue Topics</h3>
                <IssuesChart data={analytics.topIssues} />
              </div>
            </div>
          </>
        )}
      </div>
  );
}
