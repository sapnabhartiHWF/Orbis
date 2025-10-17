import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ChartSwitcher from "@/components/ChartSwitcher";

interface InvoiceLine {
  id: string;
  year: number;
  count: number;
  country: string;
}

interface ChartData {
  year: number;
  [key: string]: number | undefined;
}

interface InvoiceData {
  records: InvoiceLine[];
}

interface YearWiseInvoiceLineProps {
  countryCode?: string;
  chartType?: "default" | "line" | "area" | "pie";
}

const YearWiseInvoiceLine: React.FC<YearWiseInvoiceLineProps> = ({
  countryCode = "all",
  chartType = "default",
}) => {
  const effectiveCountryCode =
    countryCode === "--SELECT--" || countryCode === "all" || !countryCode
      ? "all"
      : countryCode.toUpperCase();

  const data = mockInvoicLineeData;

  // Filter records based on country
  let filteredRecords = data.records;
  if (effectiveCountryCode !== "all") {
    filteredRecords = data.records.filter(
      (item) => item.country === effectiveCountryCode
    );
  }

  const [selectedYear, setSelectedYear] = useState<string>("All");

  // Extract unique countries
  const countries = [...new Set(filteredRecords.map((item) => item.country))];
  const palette = ["#FF6384", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"];

  // Aggregate data by year and country
  const aggregatedData = filteredRecords.reduce(
    (acc: { [year: number]: { [country: string]: number } }, item) => {
      if (!acc[item.year]) acc[item.year] = {};
      acc[item.year][item.country] =
        (acc[item.year][item.country] || 0) + item.count;
      return acc;
    },
    {}
  );

  // Prepare chart data
  const chartData: ChartData[] = Object.entries(aggregatedData)
    .map(([year, countriesData]) => {
      const row: ChartData = { year: Number(year) };
      let total = 0;
      countries.forEach((country) => {
        const count = countriesData[country] || 0;
        row[country] = count;
        total += count;
      });
      row.total = total;
      return row;
    })
    .sort((a, b) => a.year - b.year);

  const filteredData =
    selectedYear === "All"
      ? chartData
      : chartData.filter((item) => item.year === Number(selectedYear));

  // ---- RESHAPE DATA FOR ChartSwitcher ----
  const reshapeDataForChartSwitcher = (data: InvoiceLine[]) => {
    const allCountries = ["AU", "US", "SA", "UK"];
    const grouped: { [year: number]: any } = {};
    data.forEach((item) => {
      if (!grouped[item.year]) {
        grouped[item.year] = { year: item.year };
        allCountries.forEach((c) => (grouped[item.year][c] = 0));
      }
      grouped[item.year][item.country] = item.count;
    });
    return Object.values(grouped);
  };

  const chartSwitcherData = reshapeDataForChartSwitcher(filteredRecords);

  const uniqueCountries = ["AU", "US", "SA", "UK"].filter((code) =>
    filteredRecords.some((d) => d.country === code)
  );

  return (
    <Card className="bg-gradient-card shadow-card w-full">
      <CardHeader>
        <div className="mt-4">
          <Select
            onValueChange={(value) => setSelectedYear(value)}
            value={selectedYear}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              {[...new Set(filteredRecords.map((item) => item.year))]
                .sort((a, b) => b - a)
                .map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {chartType !== "default" ? (
          <ChartSwitcher
            data={
              selectedYear === "All"
                ? chartSwitcherData
                : chartSwitcherData.filter(
                    (item) => item.year === Number(selectedYear)
                  )
            }
            dataKeys={uniqueCountries}
            xKey="year"
            showSelector={false}
            type={chartType}
          />
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart
              data={filteredData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <defs>
                {countries.map((country, index) => (
                  <linearGradient
                    key={`grad-${country}`}
                    id={`grad-${country}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={palette[index % palette.length]}
                      stopOpacity={0.65}
                    />
                    <stop
                      offset="95%"
                      stopColor={palette[index % palette.length]}
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis
                dataKey="year"
                stroke="white"
                tick={{ fill: "grey" }}
                type="number"
                scale="linear"
                domain={["dataMin", "dataMax"]}
                tickCount={10}
                interval={0}
              />
              <YAxis
                stroke="white"
                tick={{ fill: "grey" }}
                domain={[0, "auto"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  color: "#e0e0e0",
                  border: "none",
                  borderRadius: "4px",
                  padding: "4px",
                  fontSize: "0.75rem",
                }}
                itemStyle={{ color: "#e0e0e0", fontSize: "0.75rem" }}
                formatter={(value: number, name: string) => [value, name]}
                labelFormatter={(label: string | number) => {
                  const totalCount =
                    filteredData.find((d) => d.year === Number(label))?.total ??
                    0;
                  return (
                    <div>
                      <div>{`Year: ${label}`}</div>
                      <div>{`Total Invoice Lines: ${totalCount}`}</div>
                    </div>
                  );
                }}
                wrapperStyle={{ outline: "none" }}
              />
              <Legend wrapperStyle={{ color: "white" }} />
              {countries.map((country, index) => (
                <Area
                  key={country}
                  type="monotone"
                  dataKey={country}
                  name={`${country}`}
                  stroke={palette[index % palette.length]}
                  fill={`url(#grad-${country})`}
                  dot={false}
                  strokeWidth={2}
                  stackId="1"
                />
              ))}
              <Area
                type="monotone"
                dataKey="total"
                name="Total Invoice Lines"
                stroke="#36A2EB"
                fill="#36A2EB"
                fillOpacity={0.3}
                strokeWidth={3}
                stackId="2"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

// Example mock data
const mockInvoicLineeData: InvoiceData = {
  records: [
    { id: "1", year: 2023, count: 150, country: "AU" },
    { id: "2", year: 2023, count: 200, country: "UK" },
    { id: "3", year: 2023, count: 120, country: "SA" },
    { id: "4", year: 2024, count: 180, country: "US" },
    { id: "6", year: 2024, count: 190, country: "AU" },
    { id: "7", year: 2025, count: 130, country: "SA" },
    { id: "8", year: 2025, count: 170, country: "UK" },
    { id: "10", year: 2026, count: 210, country: "US" },
    { id: "11", year: 2026, count: 140, country: "AU" },
    { id: "12", year: 2027, count: 175, country: "UK" },
    { id: "13", year: 2027, count: 145, country: "SA" },
    { id: "14", year: 2027, count: 165, country: "US" },
    { id: "16", year: 2028, count: 130, country: "AU" },
    { id: "17", year: 2028, count: 180, country: "UK" },
    { id: "18", year: 2029, count: 150, country: "SA" },
    { id: "19", year: 2029, count: 190, country: "US" },
    { id: "21", year: 2030, count: 140, country: "AU" },
    { id: "22", year: 2030, count: 210, country: "UK" },
    { id: "23", year: 2030, count: 170, country: "SA" },
    { id: "24", year: 2031, count: 185, country: "US" },
    { id: "26", year: 2031, count: 200, country: "AU" },
    { id: "27", year: 2032, count: 165, country: "UK" },
    { id: "28", year: 2032, count: 135, country: "SA" },
    { id: "29", year: 2032, count: 195, country: "US" },
  ],
};

export default YearWiseInvoiceLine;
