import React, { useState } from "react";
import {
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ChartSwitcher from "@/components/ChartSwitcher";
import { BarChart3 } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface InvoiceData {
  year: number;
  countryCode: string;
  totalInvoiceTotal: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

interface InvoiceByYearProps {
  countryCode?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const year = dataPoint.year;
    const countryCode = dataPoint.countryCode;
    const totalInvoiceTotal = dataPoint.totalInvoiceTotal;

    return (
      <div
        className="custom-tooltip p-3 border rounded-lg shadow-sm"
        style={{
          backgroundColor: "hsl(var(--card))",
          borderColor: "hsl(var(--border))",
        }}
      >
        <p className="label text-sm font-semibold mb-1">{`Year: ${year}`}</p>
        <p className="label text-sm text-muted-foreground mb-1">{`Country: ${countryCode}`}</p>
        <p className="text-sm" style={{ color: countryColors[countryCode] }}>
          {`Invoice Total Cost: ${totalInvoiceTotal.toLocaleString()}`}
        </p>
      </div>
    );
  }

  return null;
};

const mockData: InvoiceData[] = [
  { year: 2016, countryCode: "SA", totalInvoiceTotal: 50000 },
  { year: 2016, countryCode: "UK", totalInvoiceTotal: 10000 },
  { year: 2016, countryCode: "US", totalInvoiceTotal: 20000 },
  { year: 2016, countryCode: "AU", totalInvoiceTotal: 30000 },

  { year: 2017, countryCode: "SA", totalInvoiceTotal: 90000 },
  { year: 2017, countryCode: "UK", totalInvoiceTotal: 30000 },
  { year: 2017, countryCode: "US", totalInvoiceTotal: 60000 },
  { year: 2017, countryCode: "AU", totalInvoiceTotal: 50000 },

  { year: 2018, countryCode: "SA", totalInvoiceTotal: 75000 },
  { year: 2018, countryCode: "UK", totalInvoiceTotal: 45000 },
  { year: 2018, countryCode: "US", totalInvoiceTotal: 80000 },
  { year: 2018, countryCode: "AU", totalInvoiceTotal: 10000 },

  { year: 2019, countryCode: "SA", totalInvoiceTotal: 60000 },
  { year: 2019, countryCode: "UK", totalInvoiceTotal: 25000 },
  { year: 2019, countryCode: "US", totalInvoiceTotal: 70000 },
  { year: 2019, countryCode: "AU", totalInvoiceTotal: 20000 },

  { year: 2020, countryCode: "SA", totalInvoiceTotal: 85000 },
  { year: 2020, countryCode: "UK", totalInvoiceTotal: 35000 },
  { year: 2020, countryCode: "US", totalInvoiceTotal: 95000 },
  { year: 2020, countryCode: "AU", totalInvoiceTotal: 40000 },

  { year: 2021, countryCode: "SA", totalInvoiceTotal: 70000 },
  { year: 2021, countryCode: "UK", totalInvoiceTotal: 20000 },
  { year: 2021, countryCode: "US", totalInvoiceTotal: 50000 },
  { year: 2021, countryCode: "AU", totalInvoiceTotal: 15000 },

  { year: 2022, countryCode: "SA", totalInvoiceTotal: 95000 },
  { year: 2022, countryCode: "UK", totalInvoiceTotal: 40000 },
  { year: 2022, countryCode: "US", totalInvoiceTotal: 85000 },
  { year: 2022, countryCode: "AU", totalInvoiceTotal: 60000 },

  { year: 2023, countryCode: "SA", totalInvoiceTotal: 80000 },
  { year: 2023, countryCode: "UK", totalInvoiceTotal: 50000 },
  { year: 2023, countryCode: "US", totalInvoiceTotal: 70000 },
  { year: 2023, countryCode: "AU", totalInvoiceTotal: 35000 },

  { year: 2024, countryCode: "SA", totalInvoiceTotal: 55000 },
  { year: 2024, countryCode: "UK", totalInvoiceTotal: 15000 },
  { year: 2024, countryCode: "US", totalInvoiceTotal: 40000 },
  { year: 2024, countryCode: "AU", totalInvoiceTotal: 25000 },

  { year: 2025, countryCode: "SA", totalInvoiceTotal: 100000 },
  { year: 2025, countryCode: "UK", totalInvoiceTotal: 60000 },
  { year: 2025, countryCode: "US", totalInvoiceTotal: 90000 },
  { year: 2025, countryCode: "AU", totalInvoiceTotal: 70000 },
];

// helper to reshape flat data -> wide format
const reshapeData = (data: InvoiceData[]) => {
  const grouped: { [year: number]: any } = {};
  data.forEach((d) => {
    if (!grouped[d.year]) {
      grouped[d.year] = { year: d.year };
    }
    grouped[d.year][d.countryCode] = d.totalInvoiceTotal;
  });
  return Object.values(grouped);
};

const countryColors: { [key: string]: string } = {
  SA: "#FF6347", // Tomato (vibrant red)
  UK: "#32CD32", // LimeGreen (vibrant green)
  US: "#FFD700", // Gold (vibrant yellow)
  AU: "#1E90FF", // DodgerBlue (vibrant blue)
};

const transformData = (
  data: InvoiceData[],
  selectedCountry: string,
  countryCode?: string
): InvoiceData[] => {
  const effectiveCountryCode =
    countryCode === "all" || !countryCode
      ? selectedCountry
      : countryCode.toUpperCase();
  if (effectiveCountryCode === "All") {
    return data;
  } else {
    return data.filter((item) => item.countryCode === effectiveCountryCode);
  }
};

const countries = Array.from(new Set(mockData.map((item) => item.countryCode)));
const years = Array.from(new Set(mockData.map((item) => item.year))).sort(
  (a, b) => a - b
);

interface InvoiceByYearWithTypeProps extends InvoiceByYearProps {
  chartType?: "default" | "bar" | "line" | "area" | "pie";
}

const InvoiceByYear: React.FC<InvoiceByYearWithTypeProps> = ({
  countryCode = "all",
  chartType = "default",
}) => {
  const [selectedCountry, setSelectedCountry] = useState<string>("All");
  const [selectedYear, setSelectedYear] = useState<string>("All");
  let chartData = transformData(mockData, selectedCountry, countryCode);
  const reshapedData = reshapeData(chartData);

  // Filter by year if a specific year is selected
  if (selectedYear !== "All") {
    chartData = chartData.filter(
      (item) => item.year === parseInt(selectedYear)
    );
  }

  return (
    <Card className="bg-gradient-card shadow-card">
      <CardContent>
        <div className="my-4 flex gap-4 justify-end">
          {/* New Year Filter */}
          <Select onValueChange={setSelectedYear} value={selectedYear}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Years</SelectItem>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            No data available for the selected country or year.
          </div>
        ) : chartType !== "default" ? (
          <ChartSwitcher
            data={reshapedData}
            dataKeys={countries} // ["SA","UK","US","AU"]
            xKey="year"
            showSelector={false}
            type={chartType}
          />
        ) : (
          <ResponsiveContainer width="100%" height={500}>
            <ScatterChart
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="year"
                type="number"
                name="Year"
                tickCount={10}
                tickFormatter={(tick) => Math.round(tick).toString()}
                stroke="hsl(var(--muted-foreground))"
                label={{
                  value: "Year of InvoiceDate",
                  position: "insideBottom",
                  offset: -5,
                }}
                domain={["dataMin", "dataMax"]}
              />
              <YAxis
                dataKey="totalInvoiceTotal"
                type="number"
                name="Invoice Total Cost"
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                stroke="hsl(var(--muted-foreground))"
                label={{
                  value: "Invoice Total Cost",
                  angle: -90,
                  position: "insideLeft",
                }}
                domain={[0, 100000]}
              />
              <ZAxis
                dataKey="totalInvoiceTotal"
                type="number"
                range={[100, 1000]}
                name="Total Invoice"
              />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={<CustomTooltip />}
              />
              <Legend wrapperStyle={{ paddingTop: 20 }} />
              {countries.map((country) => (
                <Scatter
                  key={country}
                  name={country}
                  data={chartData.filter(
                    (item) => item.countryCode === country
                  )}
                  fill={countryColors[country]}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceByYear;
