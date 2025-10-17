import React from "react";
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
import ChartSwitcher from "@/components/ChartSwitcher";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PieChart as PieChartIcon,
  BarChart3 as BarChartIcon,
} from "lucide-react";
import { useState } from "react";
// Chart switching is handled at parent level; keep default chart only here
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InvoiceData {
  companyName: string;
  totalInvoices: number;
  zozbot: string;
  lastInvoiceDate: string;
  supplierName: string;
  status: "paid" | "pending" | "overdue";
}

const sampleInvoiceData: InvoiceData[] = [
  {
    companyName: "Santova Logistics SA",
    totalInvoices: 45,
    zozbot: "Zozbot-Alpha",
    lastInvoiceDate: "2024-07-15",
    supplierName: "Supplier A",
    status: "paid",
  },
  {
    companyName: "Santova Logistics UK",
    totalInvoices: 32,
    zozbot: "Zozbot-Beta",
    lastInvoiceDate: "2024-07-20",
    supplierName: "Supplier B",
    status: "pending",
  },
  {
    companyName: "Santova Logistics US",
    totalInvoices: 67,
    zozbot: "Zozbot-Alpha",
    lastInvoiceDate: "2024-08-18",
    supplierName: "Supplier A",
    status: "paid",
  },
  {
    companyName: "Santova Logistics AU",
    totalInvoices: 28,
    zozbot: "Zozbot-Gamma",
    lastInvoiceDate: "2024-08-10",
    supplierName: "Supplier C",
    status: "overdue",
  },
  {
    companyName: "Santova Logistics SA",
    totalInvoices: 15,
    zozbot: "Zozbot-Beta",
    lastInvoiceDate: "2024-09-01",
    supplierName: "Supplier B",
    status: "pending",
  },
  {
    companyName: "Santova Logistics UK",
    totalInvoices: 20,
    zozbot: "Zozbot-Alpha",
    lastInvoiceDate: "2024-09-05",
    supplierName: "Supplier C",
    status: "paid",
  },
  {
    companyName: "Santova Logistics US",
    totalInvoices: 50,
    zozbot: "Zozbot-Gamma",
    lastInvoiceDate: "2024-09-10",
    supplierName: "Supplier A",
    status: "paid",
  },
  {
    companyName: "Santova Logistics AU",
    totalInvoices: 10,
    zozbot: "Zozbot-Beta",
    lastInvoiceDate: "2024-09-12",
    supplierName: "Supplier B",
    status: "overdue",
  },
];

interface AggregatedData {
  country: string;
  [key: string]: string | number; // For dynamic zozbot keys
}

const aggregateInvoiceData = (data: InvoiceData[]): AggregatedData[] => {
  const aggregatedMap = new Map<string, Map<string, number>>();

  data.forEach((item) => {
    const countryMatch = item.companyName.match(
      /Santova Logistics (SA|UK|US|AU)/
    );
    const country = countryMatch ? countryMatch[1] : "Unknown";

    if (!aggregatedMap.has(country)) {
      aggregatedMap.set(country, new Map<string, number>());
    }
    const zozbotMap = aggregatedMap.get(country)!;
    zozbotMap.set(
      item.zozbot,
      (zozbotMap.get(item.zozbot) || 0) + item.totalInvoices
    );
  });

  const result: AggregatedData[] = [];
  aggregatedMap.forEach((zozbotMap, country) => {
    const entry: AggregatedData = { country };
    zozbotMap.forEach((count, zozbot) => {
      entry[zozbot] = count;
    });
    result.push(entry);
  });

  return result;
};

interface PieChartData {
  country: string;
  value: number;
  zozbotData: { [key: string]: number }; // Add zozbotData for detailed tooltip
}

const aggregatePieChartData = (data: InvoiceData[]): PieChartData[] => {
  const aggregatedMap = new Map<
    string,
    { total: number; zozbotData: { [key: string]: number } }
  >();

  data.forEach((item) => {
    const countryMatch = item.companyName.match(
      /Santova Logistics (SA|UK|US|AU)/
    );
    const country = countryMatch ? countryMatch[1] : "Unknown";
    if (!aggregatedMap.has(country)) {
      aggregatedMap.set(country, { total: 0, zozbotData: {} });
    }
    const entry = aggregatedMap.get(country)!;
    entry.total += item.totalInvoices;
    entry.zozbotData[item.zozbot] =
      (entry.zozbotData[item.zozbot] || 0) + item.totalInvoices;
  });

  return Array.from(aggregatedMap.entries()).map(
    ([country, { total, zozbotData }]) => ({
      country,
      value: total,
      zozbotData,
    })
  );
};

interface InvoiceByZozbotProps {
  countryCode?: string;
  invoiceDate?: string;
  supplierName?: string;
  confidenceIndex?: "all" | "high" | "medium" | "low";
  chartType?: "default" | "bar" | "line" | "area" | "pie";
}

const InvoiceByZozbot = ({
  countryCode,
  invoiceDate,
  supplierName,
  confidenceIndex,
  chartType = "default",
}: InvoiceByZozbotProps) => {
  let dataToFilter = [...sampleInvoiceData];

  if (countryCode && countryCode !== "all") {
    dataToFilter = dataToFilter.filter((item) => {
      const itemCountryMatch = item.companyName.match(
        /Santova Logistics (SA|UK|US|AU)/
      );
      const itemCountry = itemCountryMatch
        ? itemCountryMatch[1].toLowerCase()
        : "unknown";
      return itemCountry === countryCode.toLowerCase();
    });
  }

  if (invoiceDate) {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const lastQuarter = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);

    dataToFilter = dataToFilter.filter((item) => {
      const itemDate = new Date(item.lastInvoiceDate);
      switch (invoiceDate) {
        case "today":
          return itemDate.toDateString() === today.toDateString();
        case "week":
          return itemDate >= lastWeek;
        case "month":
          return itemDate >= lastMonth;
        case "quarter":
          return itemDate >= lastQuarter;
        default:
          return true;
      }
    });
  }

  if (supplierName) {
    dataToFilter = dataToFilter.filter((item) =>
      item.supplierName.toLowerCase().includes(supplierName.toLowerCase())
    );
  }

  if (confidenceIndex !== "all") {
    dataToFilter = dataToFilter.filter((item) => {
      let confidence = 0;
      if (item.status === "paid") confidence += 40;
      if (item.totalInvoices > 30) confidence += 30; // Adjusted for sample data range
      if (item.totalInvoices > 50) confidence += 30; // Adjusted for sample data range

      switch (confidenceIndex) {
        case "high":
          return confidence >= 90;
        case "medium":
          return confidence >= 70 && confidence < 90;
        case "low":
          return confidence < 70;
        default:
          return true;
      }
    });
  }

  const chartData = aggregateInvoiceData(dataToFilter);

  // Extract all unique zozbots for rendering bars
  const uniqueZozbots = Array.from(
    new Set(dataToFilter.map((item) => item.zozbot))
  );

  const pieChartData = aggregatePieChartData(dataToFilter);

  const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--success))",
    "hsl(var(--warning))",
    "hsl(var(--destructive))",
    "hsl(var(--accent))",
  ];

  const CustomPieTooltip = ({
    active,
    payload,
    uniqueZozbots,
    COLORS,
  }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const country = data.country;
      const zozbotData = data.zozbotData;

      return (
        <div className="custom-tooltip p-3 rounded-lg border border-border bg-card shadow-lg">
          <p className="label text-sm font-semibold mb-1">{country}</p>
          {zozbotData &&
            Object.entries(zozbotData).map(([zozbot, count]: [string, any]) => (
              <p key={zozbot} className="intro text-xs text-muted-foreground">
                <span
                  style={{
                    color:
                      COLORS[uniqueZozbots.indexOf(zozbot) % COLORS.length],
                  }}
                >
                  {zozbot}
                </span>
                : {count}
              </p>
            ))}
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <Card className="bg-gradient-card shadow-card">
        <CardHeader></CardHeader>
        <CardContent>
          {chartType && chartType !== "default" ? (
            <ChartSwitcher
              data={chartData}
              dataKeys={uniqueZozbots}
              xKey="country"
              showSelector={false}
              type={chartType as any}
            />
          ) : (
          <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="country"
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  domain={[0, 120]}
                />
                <Tooltip
                  cursor={false}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                {uniqueZozbots.map((zozbot, index) => (
                  <Bar
                    key={zozbot}
                    dataKey={zozbot}
                    stackId="a"
                    fill={COLORS[index % COLORS.length]}
                    barSize={220}
                  />
                ))}
              </BarChart>
          </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default InvoiceByZozbot;
