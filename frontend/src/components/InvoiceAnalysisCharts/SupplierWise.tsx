import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart, 
  Line,
  LabelList
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import ChartSwitcher from "@/components/ChartSwitcher";

interface InvoiceDataPoint {
  supplierName: string;
  SA?: number;
  UK?: number;
  US?: number;
  AU?: number;
}

const countries = ["AU", "US", "SA", "UK"];
const COLORS = ["hsl(var(--primary))","hsl(var(--success))","hsl(var(--warning))", "hsl(var(--destructive))"];

const chartData: InvoiceDataPoint[] = [
  { supplierName: "AGS", SA: 0, UK: 0, US: 0, AU: 33 },
  { supplierName: "AVN LOGISTICS (PTY) LTD", SA: 0, UK: 189, US: 0, AU: 320 },
  { supplierName: "CNS", SA: 0, UK: 0, US: 2077, AU: 0 },
  { supplierName: "CP TRANSPORTATION SERVI.", SA: 3, UK: 313, US: 0, AU: 0 },
  { supplierName: "DHL Aviation", SA: 0, UK: 275, US: 9, AU: 0 },
  { supplierName: "Douane", SA: 0, UK: 11, US: 1853, AU: 0 },
  { supplierName: "Fastra", SA: 0, UK: 166, US: 1526, AU: 0 },
  { supplierName: "Fryers Transport", SA: 10, UK: 55, US: 0, AU: 0 },
  { supplierName: "Hapag", SA: 11, UK: 454, US: 0, AU: 0 },
  { supplierName: "JG Hauliers (Pty) Ltd", SA: 206, UK: 61, US: 0, AU: 0 },
  { supplierName: "KSN LOGISTICS CC", SA: 386, UK: 0, US: 0, AU: 0 },
  { supplierName: "MAERSK", SA: 0, UK: 2, US: 0, AU: 0 },
  { supplierName: "Maritime Cargo Processing plc", SA: 0, UK: 542, US: 1840, AU: 0 },
  { supplierName: "MILLTRANS", SA: 0, UK: 301, US: 17, AU: 0 },
  { supplierName: "NVO Consolidation B.V.", SA: 0, UK: 42, US: 760, AU: 0 },
  { supplierName: "OOCL", SA: 0, UK: 231, US: 196, AU: 0 },
  { supplierName: "P Marijnissen Transport B.V.", SA: 0, UK: 5, US: 59, AU: 0 },
  { supplierName: "PV Bevrachting B.V.", SA: 0, UK: 81, US: 136, AU: 0 },
  { supplierName: "Port of Felixstowe", SA: 0, UK: 324, US: 1, AU: 0 },
  { supplierName: "SANTOVA EXPRESS SA (PTY)L.", SA: 0, UK: 1078, US: 0, AU: 0 },
  { supplierName: "SEALAND TRANSPORT SERVL.", SA: 0, UK: 448, US: 27821, AU: 0 },
  { supplierName: "Swissport Cargo Services Neth.", SA: 0, UK: 940, US: 7807, AU: 0 },
  { supplierName: "TPT Freight B.V.", SA: 0, UK: 10217, US: 0, AU: 0 },
  { supplierName: "UCH Logistics Ltd", SA: 0, UK: 1077, US: 68, AU: 0 },
  { supplierName: "WESTBANK TRANSPORT SE..", SA: 0, UK: 763, US: 0, AU: 0 },
  { supplierName: "dnata B.V.", SA: 0, UK: 47, US: 196, AU: 0 },
];



const CustomXAxisTick = ({ x, y, payload }: any) => {
  const MAX_CHAR_PER_LINE = 10;
  const words = payload.value.split(' ');
  let line: string[] = [];
  let lines: string[] = [];

  words.forEach((word: string) => {
    if (line.join(' ').length + word.length + (line.length > 0 ? 1 : 0) > MAX_CHAR_PER_LINE) {
      lines.push(line.join(' '));
      line = [word];
    } else {
      line.push(word);
    }
  });
  lines.push(line.join(' '));

  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((lineContent, index) => (
        <text
          key={index}
          x={0}
          y={index * 12}
          dy={10} // Adjust this value to control line spacing
          textAnchor="middle"
          fill="hsl(var(--muted-foreground))"
          fontSize={10}
        >
          {lineContent}
        </text>
      ))}
    </g>
  );
};

export { chartData, countries };
export type { InvoiceDataPoint };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const supplierName = label;
    return (
      <div className="custom-tooltip p-3 rounded-lg border border-border bg-card shadow-lg">
        <p className="label text-muted-foreground text-xs mb-1">Supplier: {supplierName}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} className="intro text-sm text-muted-foreground flex justify-between items-center">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.stroke }}></span>
              {entry.dataKey}
            </span>
            <span className="font-semibold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface SupplierWiseProps { countryCode?: string; supplierName?: string; chartType?: "default" | "bar" | "line" | "area" | "pie" }

const SupplierWise: React.FC<SupplierWiseProps> = ({ countryCode = "all", supplierName = "all", chartType = "default" }) => {
  const effectiveCountryCode = !countryCode || countryCode === "" ? "all" : countryCode;
  const filteredChartData = chartData.filter((item) => {
    const supplierMatch = !supplierName || supplierName === "all" || item.supplierName === supplierName;
    const countryMatch = effectiveCountryCode === "all" || 
      (item[effectiveCountryCode.toUpperCase() as keyof InvoiceDataPoint] !== undefined);
    return supplierMatch && countryMatch;
  });

  console.log("Filtered Chart Data:", filteredChartData);

  return (
    <Card className="bg-gradient-card shadow-card">
      <CardContent>
        {filteredChartData.length === 0 ? (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            No data available for the selected supplier.
          </div>
        ) : (
          chartType !== "default" ? (
            <ChartSwitcher
              data={filteredChartData}
              dataKeys={countries}
              xKey="supplierName"
              showSelector={false}
              type={chartType as any}
            />
          ) : (
            <ResponsiveContainer width="100%" height={500}>
              <LineChart
                data={filteredChartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
                <XAxis
                  dataKey="supplierName"
                  interval={0}
                  angle={0}
                  textAnchor="middle"
                  height={100}
                  stroke="hsl(var(--muted-foreground))"
                  tick={<CustomXAxisTick />}
                />
                <YAxis
                  label={{ value: "", angle: 0, position: "insideLeft" }}
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <Tooltip cursor={false} content={<CustomTooltip />} />
                <Legend />
                {countries.map((country, index) => (
                  <Line
                    key={country}
                    type="monotone"
                    dataKey={country}
                    stroke={COLORS[index % COLORS.length]}
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                    {...(effectiveCountryCode !== "all" && country !== effectiveCountryCode.toUpperCase() ? { strokeOpacity: 0 } : { strokeOpacity: 1 })}
                  >
                    <LabelList dataKey={country} position="top" offset={10} fill="hsl(var(--foreground))" fontSize={10} />
                  </Line>
                ))}
              </LineChart>
            </ResponsiveContainer>
          )
        )}
      </CardContent>
    </Card>
  );
};

export default SupplierWise;
