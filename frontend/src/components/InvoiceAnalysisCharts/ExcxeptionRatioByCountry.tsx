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
  CartesianAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ChartSwitcher from "@/components/ChartSwitcher";
import { BarChart3 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExceptionRatioData {
  exceptionCode: "DUPLICATE INVOICE" | "TOTAL AMOUNT NOT MATCHED";
  countryCode: string;
  totalInvoiceTotal: number;
}

interface TransformedRatioData {
  exceptionCode: "DUPLICATE INVOICE" | "TOTAL AMOUNT NOT MATCHED";
  [key: string]: string | number; // For dynamic country codes
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active, payload, label
}) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((acc, entry) => acc + entry.value, 0);
    return (
      <div className="custom-tooltip p-3 border rounded-lg shadow-sm"
        style={{
          backgroundColor: "hsl(var(--card))",
          borderColor: "hsl(var(--border))",
        }}>
        <p className="label text-sm font-semibold mb-1">{`${label}`}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
            {`${entry.name}: ${(entry.value / total * 100).toFixed(2)}% (${entry.value})`}
          </p>
        ))} 
      </div>
    );
  }
  return null;
};

interface ExceptionRatioProps {
  countryCode?: string;
}

const mockData: ExceptionRatioData[] = [
  { exceptionCode: "DUPLICATE INVOICE", countryCode: "AU", totalInvoiceTotal: 10000 },
  { exceptionCode: "DUPLICATE INVOICE", countryCode: "US", totalInvoiceTotal: 5000 },
  { exceptionCode: "DUPLICATE INVOICE", countryCode: "SA", totalInvoiceTotal: 3000 },
  { exceptionCode: "DUPLICATE INVOICE", countryCode: "UK", totalInvoiceTotal: 8000 },

  { exceptionCode: "TOTAL AMOUNT NOT MATCHED", countryCode: "AU", totalInvoiceTotal: 15000 },
  { exceptionCode: "TOTAL AMOUNT NOT MATCHED", countryCode: "US", totalInvoiceTotal: 7000 },
  { exceptionCode: "TOTAL AMOUNT NOT MATCHED", countryCode: "SA", totalInvoiceTotal: 4000 },
  { exceptionCode: "TOTAL AMOUNT NOT MATCHED", countryCode: "UK", totalInvoiceTotal: 10000 },
];

const countryColors: { [key: string]: string } = {
  AU: "#8884d8", // Purple
  US: "#82ca9d",  // Green
  SA: "#ff8042",  // Red
  UK: "#FFC107",  // warm yellow
};

const transformData = (data: ExceptionRatioData[], selectedExceptionCode: string, countryCode?: string): TransformedRatioData[] => {
  const effectiveCountryCode = countryCode === "all" || !countryCode ? "all" : countryCode.toUpperCase();
  const filteredData = effectiveCountryCode === "all" 
    ? data 
    : data.filter(item => item.countryCode === effectiveCountryCode);

  const grouped: { [key: string]: TransformedRatioData } = {};

  filteredData.forEach(item => {
    if (selectedExceptionCode === "All" || item.exceptionCode === selectedExceptionCode) {
      if (!grouped[item.exceptionCode]) {
        grouped[item.exceptionCode] = { exceptionCode: item.exceptionCode };
      }
      grouped[item.exceptionCode][item.countryCode] = item.totalInvoiceTotal;
    }
  });

  return Object.values(grouped);
};

const exceptionCodes = Array.from(new Set(mockData.map(item => item.exceptionCode)));
const countryCodes = Array.from(new Set(mockData.map(item => item.countryCode)));

interface ExceptionRatioByCountryProps extends ExceptionRatioProps { chartType?: "default" | "bar" | "line" | "area" | "pie" }

const ExceptionRatioByCountry: React.FC<ExceptionRatioByCountryProps> = ({ countryCode = "all", chartType = "default" }) => {
  const [selectedExceptionCode, setSelectedExceptionCode] = useState<string>("All");

  const chartData = transformData(mockData, selectedExceptionCode, countryCode);

  return (
    <Card className="bg-gradient-card shadow-card">
      <CardContent>
        <div className="my-4 flex justify-end">
          <Select
            onValueChange={setSelectedExceptionCode}
            value={selectedExceptionCode}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select Exception Code" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Exception Codes</SelectItem>
              {exceptionCodes.map((code) => (
                <SelectItem key={code} value={code}>
                  {code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            No data available for the selected exception code.
          </div>
        ) : (
          chartType !== "default" ? (
            <ChartSwitcher
              data={chartData}
              dataKeys={countryCodes}
              xKey="exceptionCode"
              showSelector={false}
              type={chartType}
            />
          ) : (
            <ResponsiveContainer width="100%" height={500}>
              <BarChart
                data={chartData}
                barCategoryGap="15%"
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="exceptionCode" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                <YAxis
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                  stroke="hsl(var(--muted-foreground))"
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 'auto']}
                />
                <Tooltip content={<CustomTooltip />} cursor={false}/>
                <Legend
                  wrapperStyle={{
                    paddingTop: 20,
                    paddingBottom: 0,
                    height: 50,
                  }}
                  align="center"
                  verticalAlign="bottom"
                />
                {countryCodes.map((country) => (
                  <Bar
                    key={country}
                    dataKey={country}
                    stackId="a"
                    fill={countryColors[country]}
                    radius={[4, 4, 0, 0]}
                    barSize={300}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )
        )}
      </CardContent>
    </Card>
  );
};

export default ExceptionRatioByCountry;