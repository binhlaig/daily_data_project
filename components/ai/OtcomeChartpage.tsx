"use client"

// Charts
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    BarChart,
    Bar,
  } from "recharts";
const OutcomeChartsCard = ({
    series,
  }: {
    series: {
      trend?: { x: string; y: number }[];
      byShop?: { name: string; value: number }[];
      byCategory?: { name: string; value: number }[];
      byBank?: { name: string; value: number }[];
    };
  }) => {

    const trend = Array.isArray(series?.trend) ? series.trend : [];
    const byShop = Array.isArray(series?.byShop) ? series.byShop : [];
    const byCategory = Array.isArray(series?.byCategory) ? series.byCategory : [];
    const byBank = Array.isArray(series?.byBank) ? series.byBank : [];
  
    const totalTrend = trend.reduce((s, p) => s + (Number(p?.y) || 0), 0);
    return (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border bg-background px-2 py-1">
              Points: <span className="tabular-nums">{trend.length}</span>
            </span>
            <span className="rounded-full border bg-background px-2 py-1">
              Total(trend):{" "}
              <span className="tabular-nums">¥{totalTrend.toLocaleString()}</span>
            </span>
          </div>
    
          <div className="rounded-3xl border bg-background p-3">
            <div className="mb-2 text-xs font-semibold text-muted-foreground">
              Trend (Day/Month)
            </div>
    
            <div className="h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="x" hide />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="y" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
    
          <div className="grid gap-3 lg:grid-cols-4">
            <div className="rounded-3xl border bg-background p-3">
              <div className="mb-2 text-xs font-semibold text-muted-foreground">
                Top Shops
              </div>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byShop}>
                    <defs>
                      <linearGradient id="shopGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.9} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.9} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" hide />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: "rgba(0,0,0,0.05)" }}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e5e7eb",
                        background: "#fff",
                      }}
                    />
                    <Bar
                      dataKey="value"
                      radius={[10, 10, 0, 0]}
                      fill="url(#shopGradient)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
    
            <div className="rounded-3xl border bg-background p-10">
              <div className="mb-2 text-xs font-semibold text-muted-foreground">
                Top Categories
              </div>
              <div className="h-[286px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byCategory}>
                    <defs>
                      <linearGradient
                        id="categoryGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.9} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.9} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" hide />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: "rgba(0,0,0,0.05)" }}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e5e7eb",
                        background: "#fff",
                      }}
                    />
                    <Bar
                      dataKey="value"
                      radius={[10, 10, 0, 0]}
                      fill="url(#categoryGradient)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
    
            <div className="rounded-3xl border bg-background p-3">
              <div className="mb-2 text-xs font-semibold text-muted-foreground">
                Bank Breakdown
              </div>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byBank}>
                    <defs>
                      <linearGradient id="bankGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.9} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.9} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" hide />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: "rgba(0,0,0,0.05)" }}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e5e7eb",
                        background: "#fff",
                      }}
                    />
                    <Bar
                      dataKey="value"
                      radius={[10, 10, 0, 0]}
                      fill="url(#bankGradient)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      );
  
}

export default OutcomeChartsCard 


