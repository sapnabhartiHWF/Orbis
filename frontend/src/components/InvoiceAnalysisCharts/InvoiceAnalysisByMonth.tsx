import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useMemo } from "react";
import ChartSwitcher from "@/components/ChartSwitcher";

interface MonthlyInvoiceData {
  month: string;
  year: number;
  [key: string]: number | string; // Dynamic keys for countries like 'AUS', 'DE', 'NL', 'SA', 'UK'
}

const generateMockMonthlyData = (): MonthlyInvoiceData[] => {
  const data: MonthlyInvoiceData[] = [];
  const countries = ["US", "UK", "AU", "SA"];
  const currentDate = new Date("2025-09-26T04:32:00Z");

  const currentYear = currentDate.getFullYear();
  for (let i = 0; i < 12; i++) {
    const date = new Date(currentYear, i, 1);
    const month = date.toLocaleString("en-us", { month: "short" });
    const year = date.getFullYear();
    const monthYear = `${month} ${year}`;

    const monthData: MonthlyInvoiceData = { month: monthYear, year: year };

    countries.forEach((country) => {
      monthData[country] = Math.floor(Math.random() * 500) + 50;
    });
    data.push(monthData);
  }

  return data;
};

const CustomMonthlyTooltip = ({
  active,
  payload,
  label,
  countries,
  COLORS,
}: any) => {
  if (active && payload && payload.length) {
    const totalInvoices = payload.reduce(
      (sum: number, entry: any) => sum + entry.value,
      0
    );
    return (
      <div className="custom-tooltip p-3 rounded-lg border border-border bg-card shadow-lg">
        <p className="label text-muted-foreground text-xs mb-1">{label}</p>
        <p className="intro text-foreground text-base font-bold mb-2">
          Total Invoices: {totalInvoices}
        </p>
        {payload.map((entry: any, index: number) => (
          <p
            key={`item-${index}`}
            className="intro text-sm text-muted-foreground flex justify-between items-center"
          >
            <span className="flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              ></span>
              {entry.name}
            </span>
            <span className="font-semibold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }

  return null;
};

interface InvoiceAnalysisByMonthProps {
  countryCode?: string;
  chartType?: "default" | "bar" | "line" | "area" | "pie";
}

const InvoiceAnalysisByMonth: React.FC<InvoiceAnalysisByMonthProps> = ({
  countryCode = "all",
  chartType = "default",
}) => {
  const allMonthlyData = generateMockMonthlyData();
  const allCountries = ["US", "UK", "AU", "SA"];

  const countryColors = {
    US: "hsl(var(--primary))",
    UK: "hsl(var(--success))",
    AU: "hsl(var(--warning))",
    SA: "hsl(var(--destructive))",
  };

  const [selectedMonth, setSelectedMonth] = useState("all");

  const displayCountries = useMemo(() => {
    return countryCode && countryCode !== "all"
      ? [countryCode.toUpperCase()]
      : allCountries;
  }, [countryCode]);

  const monthlyData = useMemo(() => {
    return selectedMonth === "all"
      ? allMonthlyData
      : allMonthlyData.filter((data) => data.month === selectedMonth);
  }, [selectedMonth, allMonthlyData]);

  return (
    <Card className="bg-gradient-card shadow-card">
      <CardHeader className="flex flex-row items-center justify-end space-y-0 pb-2">
        <Select onValueChange={setSelectedMonth} value={selectedMonth}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Months" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            {allMonthlyData.map((dataItem) => (
              <SelectItem key={dataItem.month} value={dataItem.month}>
                {dataItem.month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {chartType === "default" ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={monthlyData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
              barSize={selectedMonth === "all" ? 100 : 200}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                interval={monthlyData.length > 1 ? 0 : 0}
                angle={0}
                textAnchor="middle"
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                domain={[0, 2200]}
                label={{
                  value: "Invoice Count",
                  angle: -90,
                  position: "insideLeft",
                  fill: "hsl(var(--muted-foreground))",
                }}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <Tooltip
                cursor={false}
                content={<CustomMonthlyTooltip countries={displayCountries} />}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend
                formatter={(value) => {
                  const countryLabels = {
                    US: "US",
                    UK: "UK",
                    AU: "AU",
                    SA: "SA",
                  };
                  return countryLabels[value] || value;
                }}
              />
              {displayCountries.map((country) => (
                <Bar
                  key={country}
                  dataKey={country}
                  stackId="a"
                  fill={countryColors[country]}
                  radius={[4, 4, 0, 0]}
                  name={country}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ChartSwitcher
            key={`ms-${chartType}-${selectedMonth}-${displayCountries.join('-')}`}
            data={monthlyData}
            dataKeys={displayCountries}
            xKey="month"
            colors={countryColors}
            tooltipContent={<CustomMonthlyTooltip countries={displayCountries} />}
            showSelector={false}
            type={chartType}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceAnalysisByMonth;