import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ChartSwitcherProps {
  data: any[];
  dataKeys: string[]; // the series (like zozbots or statuses)
  xKey: string; // x-axis key (e.g. "country" or "month")
  pieNameKey?: string; // nameKey for PieChart
  colors?: Record<string, string>; // optional color map per series key
  tooltipContent?: any; // optional custom tooltip component for recharts
  showSelector?: boolean; // show internal chart-type selector
  type?: "bar" | "line" | "area" | "pie"; // external control of chart type
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "hsl(var(--accent))",
];

const ChartSwitcher: React.FC<ChartSwitcherProps> = ({
  data,
  dataKeys,
  xKey,
  pieNameKey = "name",
  colors = {},
  tooltipContent,
  showSelector = true,
  type,
}) => {
  const [chartType, setChartType] = useState<"bar" | "pie" | "line" | "area">(
    "bar"
  );
  const allowedTypes = ["bar", "line", "area", "pie"] as const;
  const renderType = type && (allowedTypes as readonly string[]).includes(type)
    ? (type as typeof allowedTypes[number])
    : chartType;

  const colorFor = (key: string, index: number) => {
    return colors[key] ?? COLORS[index % COLORS.length];
  };

  const pieData = useMemo(() => {
    return dataKeys.map((key) => ({
      [pieNameKey]: key,
      value: (data || []).reduce((sum, d) => sum + (Number(d?.[key]) || 0), 0),
      key,
    }));
  }, [data, dataKeys, pieNameKey]);

  return (
    <div>
      {showSelector && (
        <div className="flex justify-end mb-2">
          <Select
            value={chartType}
            onValueChange={(val) => setChartType(val as any)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select chart type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">Bar Chart</SelectItem>
              <SelectItem value="pie">Pie Chart</SelectItem>
              <SelectItem value="line">Line Chart</SelectItem>
              <SelectItem value="area">Area Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <ResponsiveContainer width="100%" height={300}>
        {
          renderType === "bar" ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey={xKey}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                content={tooltipContent}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              {dataKeys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId="a"
                  fill={colorFor(key, index)}
                  radius={[4, 4, 0, 0]}
                  name={key}
                />
              ))}
            </BarChart>
          ) : renderType === "pie" ? (
            <PieChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Pie
                data={pieData}
                dataKey="value"
                nameKey={pieNameKey}
                cx="50%"
                cy="50%"
                outerRadius={110}
                innerRadius={60}
                paddingAngle={2}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colorFor(entry.key, index)} />
                ))}
              </Pie>
            </PieChart>
          ) : renderType === "line" ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey={xKey}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              {dataKeys.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colorFor(key, index)}
                  strokeWidth={3}
                  dot={{ r: 3, strokeWidth: 2 }}
                  name={key}
                />
              ))}
            </LineChart>
          ) : (
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey={xKey}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              {dataKeys.map((key, index) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stackId="1"
                  stroke={colorFor(key, index)}
                  fill={colorFor(key, index)}
                  fillOpacity={0.8}
                  name={key}
                />
              ))}
            </AreaChart>
          )
        }
      </ResponsiveContainer>
    </div>
  );
};

export default ChartSwitcher;
