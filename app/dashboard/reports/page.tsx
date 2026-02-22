import BarBox from "@/components/dashboard/chart/BarBox";
import BigChartBox from "@/components/dashboard/chart/BigChartBox";
import ChartBox from "@/components/dashboard/chart/ChartBox";
import DailyTrendChart from "@/components/dashboard/chart/DailyTrendChart";
import PieChartBox from "@/components/dashboard/chart/PieChartBox";
import { fetchIncomesTotal, totalOutcometest } from "@/lib/data/alldata";

export default async function ChartPage() {
  // ✅ DB totals
  const incomeTotalRaw = await fetchIncomesTotal();
  const outcomeTotalRaw = await totalOutcometest();

  const incomeTotal = Number(incomeTotalRaw ?? 0);
  const outcomeTotal = Number(outcomeTotalRaw ?? 0);
  const profitTotal = incomeTotal - outcomeTotal;

  // ✅ small sparkline data (demo)
  // မင်းအနေနဲ့ နောက်ပိုင်း DB daily aggregate နဲ့ ပြောင်းနိုင်
  const incomeSpark = [
    { name: "Sun", income: Math.round(incomeTotal * 0.12) },
    { name: "Mon", income: Math.round(incomeTotal * 0.14) },
    { name: "Tue", income: Math.round(incomeTotal * 0.13) },
    { name: "Wed", income: Math.round(incomeTotal * 0.16) },
    { name: "Thu", income: Math.round(incomeTotal * 0.15) },
    { name: "Fri", income: Math.round(incomeTotal * 0.17) },
    { name: "Sat", income: Math.round(incomeTotal * 0.13) },
  ];

  const outcomeSpark = [
    { name: "Sun", outcome: Math.round(outcomeTotal * 0.12) },
    { name: "Mon", outcome: Math.round(outcomeTotal * 0.14) },
    { name: "Tue", outcome: Math.round(outcomeTotal * 0.13) },
    { name: "Wed", outcome: Math.round(outcomeTotal * 0.16) },
    { name: "Thu", outcome: Math.round(outcomeTotal * 0.15) },
    { name: "Fri", outcome: Math.round(outcomeTotal * 0.17) },
    { name: "Sat", outcome: Math.round(outcomeTotal * 0.13) },
  ];

  // ✅ ChartBox props (ChartBoxConfig)
  const chartBoxIncome = {
    title: "Total Income",
    subtitle: "From DB (Mongo)",
    number: `¥ ${incomeTotal.toLocaleString()}`,
    percentage: 0, // (optional) မင်း daily compare ရရင် % ထည့်
    dataKey: "income",
    chartData: incomeSpark,
  };

  const chartBoxOutcome = {
    title: "Total Outcome",
    subtitle: "From DB (Mongo)",
    number: `¥ ${outcomeTotal.toLocaleString()}`,
    percentage: 0,
    dataKey: "outcome",
    chartData: outcomeSpark,
  };

  const chartBoxProfit = {
    title: "Profit",
    subtitle: "Income - Outcome",
    number: `¥ ${profitTotal.toLocaleString()}`,
    percentage: 0,
    dataKey: "profit",
    chartData: [
      { name: "Sun", profit: Math.round(profitTotal * 0.12) },
      { name: "Mon", profit: Math.round(profitTotal * 0.14) },
      { name: "Tue", profit: Math.round(profitTotal * 0.13) },
      { name: "Wed", profit: Math.round(profitTotal * 0.16) },
      { name: "Thu", profit: Math.round(profitTotal * 0.15) },
      { name: "Fri", profit: Math.round(profitTotal * 0.17) },
      { name: "Sat", profit: Math.round(profitTotal * 0.13) },
    ],
  };

  // demo bars
  const barVisit = [
    { name: "Jan", visit: 120 },
    { name: "Feb", visit: 210 },
    { name: "Mar", visit: 170 },
    { name: "Apr", visit: 260 },
    { name: "May", visit: 240 },
  ];
  const barRevenue = [
    { name: "Jan", rev: 80 },
    { name: "Feb", rev: 140 },
    { name: "Mar", rev: 120 },
    { name: "Apr", rev: 200 },
    { name: "May", rev: 190 },
  ];

  const barVisitMini = barVisit.map((x) => ({
    name: x.name,
    visitsMini: x.visit, // rename key
  }));

  return (
    <div className="p-4 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-[200px]">
        {/* ✅ row 1: Income + Outcome + Pie */}
        <div className="md:col-span-3">
          <ChartBox props={chartBoxIncome} />
        </div>

        <div className="md:col-span-3">
          <ChartBox props={chartBoxOutcome} />
        </div>

        <div className="md:col-span-6 md:row-span-2">
          <PieChartBox />
        </div>

        {/* ✅ row 2: Profit + bar */}
        <div className="md:col-span-3">
          <ChartBox props={chartBoxProfit} />
        </div>

        <div className="md:col-span-12 md:row-span-2">
          <DailyTrendChart days={30} />
        </div>
      </div>
    </div>
  );
}
