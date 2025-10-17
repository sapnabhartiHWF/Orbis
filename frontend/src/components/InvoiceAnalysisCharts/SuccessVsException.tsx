import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList } from 'recharts';
import { Card, CardContent } from "@/components/ui/card";
import ChartSwitcher from "@/components/ChartSwitcher";
import { BarChart3 } from "lucide-react";

interface InvoiceStatusData {
  status: string;
  country: string;
  count: number;
}

// Updated AggregatedStatusData interface to allow 'status' as string and dynamic numeric keys
interface AggregatedStatusData {
  status: string;
  [key: string]: number | string; // Allow string for 'status' and number for country counts
}

const rawInvoiceStatusData: InvoiceStatusData[] = [
  // Completed
  { status: "Completed", country: "AU", count: 121 },
  { status: "Completed", country: "US", count: 1881 },
  { status: "Completed", country: "SA", count: 1543 },
  { status: "Completed", country: "UK", count: 30 },

  // Received
  { status: "Received", country: "AU", count: 10 },
  { status: "Received", country: "US", count: 1706 },
  { status: "Received", country: "SA", count: 319 },
  { status: "Received", country: "UK", count: 15 },

  // Partially Completed
  { status: "Partially_Completed", country: "AU", count: 52 },
  { status: "Partially_Completed", country: "US", count: 953 },
  { status: "Partially_Completed", country: "SA", count: 737 },
  { status: "Partially_Completed", country: "UK", count: 92 },

  // Cancel Invoice
  { status: "Cancel_Invoice", country: "AU", count: 102 },
  { status: "Cancel_Invoice", country: "US", count: 85 },
  { status: "Cancel_Invoice", country: "SA", count: 0 },
  { status: "Cancel_Invoice", country: "UK", count: 5 },
];

const aggregateStatusData = (data: InvoiceStatusData[], countryCode: string): AggregatedStatusData[] => {
  const effectiveCountryCode = countryCode === "--SELECT--" || countryCode === "all" || !countryCode ? "all" : countryCode.toUpperCase();
  const filteredData = effectiveCountryCode === "all" ? data : data.filter(item => item.country === effectiveCountryCode);

  const aggregatedMap = new Map<string, AggregatedStatusData>();

  filteredData.forEach(item => {
    if (!aggregatedMap.has(item.status)) {
      aggregatedMap.set(item.status, { status: item.status });
    }
    const entry = aggregatedMap.get(item.status)!;
    entry[item.country] = (entry[item.country] as number ?? 0) + item.count;
  });

  return Array.from(aggregatedMap.values());
};

const CustomStatusTooltip = ({ active, payload, label, countries, COLORS }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip p-3 rounded-lg border border-border bg-card shadow-lg">
        <p className="label text-muted-foreground text-xs mb-1">Status: {label.replace(/_/g, ' ')}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} className="intro text-sm text-muted-foreground flex justify-between items-center">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
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

interface SuccessVsExceptionProps { countryCode?: string; chartType?: "default" | "bar" | "line" | "area" | "pie" }

const SuccessVsException = ({ countryCode = "--SELECT--", chartType = "default" }: SuccessVsExceptionProps) => {
  const aggregatedData = aggregateStatusData(rawInvoiceStatusData, countryCode);
  const countries = ["AU", "US", "SA", "UK"];
  const COLORS = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))"]; // Example colors

  return (
    <Card className="bg-gradient-card shadow-card">
      <CardContent>
        {aggregatedData.length === 0 ? (
          <div className="flex items-center justify-center h-[350px] text-muted-foreground">
            No data available for the selected country.
          </div>
        ) : (
          chartType !== "default" ? (
            <ChartSwitcher
              data={aggregatedData}
              dataKeys={countries}
              xKey="status"
              showSelector={false}
              type={chartType}
            />
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={aggregatedData}
                margin={{
                  top: 40,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
                barCategoryGap="20%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="status" stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} angle={0} textAnchor="middle" height={30} />
                <YAxis stroke="hsl(var(--muted-foreground))" label={{ value: 'Invoice Count', angle: -90, position: 'insideLeft', fill: "hsl(var(--muted-foreground))" }} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip cursor={false} content={<CustomStatusTooltip countries={countries} COLORS={COLORS} />} />
                <Legend />
                {countries.map((country, index) => (
                  <Bar key={country} dataKey={country} fill={COLORS[index % COLORS.length]}>
                    <LabelList dataKey={country} position="top" fill="hsl(var(--foreground))" fontSize={10} />
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          )
        )}
      </CardContent>
    </Card>
  );
};

export default SuccessVsException;