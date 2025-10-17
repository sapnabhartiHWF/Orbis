import React, { useState } from "react";
import {
  LineChart, // Changed from AreaChart
  Line,      // Changed from Area
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components
import ChartSwitcher from "@/components/ChartSwitcher";

interface MonthlyInvoiceData {
  monthYear: string;
  [key: string]: number | string; // Country codes will be keys for counts
}

// Mock data for Invoice Lines Processed by Month by Country
const mockMonthlyInvoiceData: MonthlyInvoiceData[] = [
  { monthYear: 'Jan 2024', AU: 200, US: 300, SA: 3500, UK: 4500 },
  { monthYear: 'Feb 2024', AU: 220, US: 320, SA: 3800, UK: 4800 },
  { monthYear: 'Mar 2024', AU: 250, US: 350, SA: 4000, UK: 5000 },
  { monthYear: 'Apr 2024', AU: 280, US: 380, SA: 4300, UK: 8000 },
  { monthYear: 'May 2024', AU: 230, US: 330, SA: 3700, UK: 7500 },
  { monthYear: 'Jun 2024', AU: 210, US: 310, SA: 3500, UK: 7200 },
  { monthYear: 'Jul 2024', AU: 300, US: 400, SA: 5000, UK: 8500 },
  { monthYear: 'Aug 2024', AU: 190, US: 290, SA: 3200, UK: 5000 },
  { monthYear: 'Sep 2024', AU: 220, US: 320, SA: 3500, UK: 5200 },
  { monthYear: 'Oct 2024', AU: 210, US: 310, SA: 3400, UK: 4800 },
  { monthYear: 'Nov 2024', AU: 180, US: 270, SA: 2900, UK: 4000 },
  { monthYear: 'Dec 2024', AU: 250, US: 350, SA: 4000, UK: 6000 },
  { monthYear: 'Jan 2025', AU: 260, US: 360, SA: 4200, UK: 5500 },
  { monthYear: 'Feb 2025', AU: 230, US: 330, SA: 3700, UK: 4800 },
  { monthYear: 'Mar 2025', AU: 200, US: 300, SA: 3300, UK: 4000 },
  { monthYear: 'Apr 2025', AU: 280, US: 380, SA: 4300, UK: 5500 },
  { monthYear: 'May 2025', AU: 190, US: 290, SA: 3200, UK: 3800 },
  { monthYear: 'Jun 2025', AU: 5550, US: 2320, SA: 10110, UK: 11110 },
];

const countryColors: { [key: string]: string } = {
  AU: '#A5D6A7', // Lighter Green
  US: '#90CAF9',  // Lighter Blue
  SA: '#FF8A80',  // Lighter Red
  UK: '#CE93D8',  // Lighter Purple
};

interface InvoiceLineByMonthProps {
  countryCode?: string;
  chartType?: "default" | "line" | "area" | "pie"
}

const InvoiceLineByMonth: React.FC<InvoiceLineByMonthProps> = ({ countryCode = "all", chartType = "default" }) => {
  const [checkedCountries, setCheckedCountries] = useState<string[]>(Object.keys(countryColors));
  const [selectedMonth, setSelectedMonth] = useState<string>("All"); // New state for selected month

  const effectiveCountryCode = countryCode === "--SELECT--" || countryCode === "all" || !countryCode ? "all" : countryCode.toUpperCase();

  const handleCheckboxChange = (country: string) => {
    setCheckedCountries(prev =>
      prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]
    );
  };

  let filteredCheckedCountries = checkedCountries;
  if (effectiveCountryCode !== "all") {
    filteredCheckedCountries = checkedCountries.filter(country => country === effectiveCountryCode);
  }

  const filteredData = mockMonthlyInvoiceData
    .filter(monthData => selectedMonth === "All" || monthData.monthYear === selectedMonth) // Filter by selected month
    .map(monthData => {
      const newMonthData: MonthlyInvoiceData = { monthYear: monthData.monthYear };
      for (const country of filteredCheckedCountries) {
        if (typeof monthData[country] === 'number') {
          newMonthData[country] = monthData[country];
        }
      }
      return newMonthData;
    });

  // Get unique months for the filter dropdown
  const uniqueMonths = Array.from(new Set(mockMonthlyInvoiceData.map(item => item.monthYear))).sort((a, b) => {
    // Custom sort for monthYear in 'Mon YYYY' format
    const [monthA, yearA] = a.split(' ');
    const [monthB, yearB] = b.split(' ');
    const dateA = new Date(`${monthA} 1, ${yearA}`);
    const dateB = new Date(`${monthB} 1, ${yearB}`);
    return dateA.getTime() - dateB.getTime();
  });

  // Custom Legend component for checkboxes
  const CustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap justify-center gap-4 p-2">
        <div className="flex items-center space-x-2 mr-4">
          <Checkbox
            id="countryCodeAll"
            checked={filteredCheckedCountries.length === Object.keys(countryColors).length}
            onCheckedChange={() => setCheckedCountries(prev => 
              prev.length === Object.keys(countryColors).length ? [] : Object.keys(countryColors)
            )}
          />
          <label
            htmlFor="countryCodeAll"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            CountryCode
          </label>
        </div>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center space-x-2">
            <Checkbox
              id={entry.value}
              checked={filteredCheckedCountries.includes(entry.value)}
              onCheckedChange={() => handleCheckboxChange(entry.value)}
              style={{ backgroundColor: countryColors[entry.value] }}
            />
            <label
              htmlFor={entry.value}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {entry.value}
            </label>
          </div>
        ))}
      </div>
    );
  };

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 border rounded-lg shadow-sm"
          style={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
          <p className="text-sm font-semibold mb-1">{`Month: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="text-sm"
              style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-gradient-card shadow-card">
      <CardContent>
        <div className="my-4 flex gap-4 justify-end">
          <Select onValueChange={setSelectedMonth} value={selectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Months</SelectItem>
              {uniqueMonths.map((month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {filteredData.length === 0 || filteredCheckedCountries.length === 0 ? (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            No data available for the selected filters.
          </div>
          ) : (
            chartType !== "default" ? (
              <ChartSwitcher
                data={filteredData}  // Fixed: Use the actual data variable
                dataKeys={Object.keys(countryColors)}  // Fixed: Use country codes as data keys
                xKey="monthYear"  // Fixed: Use the correct x-axis key
                showSelector={false}
                type={chartType}
              />
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="monthYear" angle={-45} textAnchor="end" height={80} stroke="hsl(var(--muted-foreground))" />
              <YAxis
                label={{ value: 'InvoiceLineId Count', angle: -90, position: 'insideLeft', fill: "hsl(var(--muted-foreground))", offset: -20 }}
                stroke="hsl(var(--muted-foreground))"
                ticks={[0, 2000, 4000, 6000, 8000, 10000, 12000]} // Adjusted ticks to cover full data range
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Legend content={<CustomLegend />} wrapperStyle={{ paddingTop: '10px' }} />
              {Object.keys(countryColors).map(country => (
                <Line
                  key={country}
                  type="monotone"
                  dataKey={country}
                  stroke={countryColors[country]}
                  strokeWidth={2} // Added strokeWidth for better visibility
                  dot={false} // Remove dots on the line
                  hide={!filteredCheckedCountries.includes(country)}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceLineByMonth;