import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Import Card components
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"; // Import Select components
import ChartSwitcher from "@/components/ChartSwitcher";
import { ResponsiveContainer } from 'recharts'; // Import ResponsiveContainer

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

interface SupplierExceptionData {
  country: string;
  exceptionType: 'Value by Chargecode is Invalid' | 'Job Not Found' | 'Charge Code Not Found'; // Restrict exception types
  count: number;
}

interface InvoiceLineExceptionRatioProps {
  countryCode?: string;
  chartType?: "default" | "line" | "area" | "bar" | "pie"
}

const InvoiceLineExceptionRatio: React.FC<InvoiceLineExceptionRatioProps> = ({ countryCode = "all", chartType = "default" }) => {
  const [selectedExceptionType, setSelectedExceptionType] = React.useState<string>("all");

  const effectiveCountryCode = countryCode === "--SELECT--" || countryCode === "all" || !countryCode ? "all" : countryCode.toUpperCase();

  // Raw mock data from the original scatter chart
  const rawMockInvoiceLineExceptionData: SupplierExceptionData[] = [
    { country: 'AUS', exceptionType: 'Value by Chargecode is Invalid', count: 15 },
    { country: 'DE', exceptionType: 'Job Not Found', count: 10 },
    { country: 'NL', exceptionType: 'Charge Code Not Found', count: 8 },
    { country: 'SA', exceptionType: 'Value by Chargecode is Invalid', count: 7 },
    { country: 'UK', exceptionType: 'Job Not Found', count: 12 },
    { country: 'AUS', exceptionType: 'Charge Code Not Found', count: 6 },
    { country: 'DE', exceptionType: 'Value by Chargecode is Invalid', count: 9 },
    { country: 'NL', exceptionType: 'Job Not Found', count: 4 },
    { country: 'SA', exceptionType: 'Charge Code Not Found', count: 11 },
    { country: 'UK', exceptionType: 'Value by Chargecode is Invalid', count: 5 },
    { country: 'AUS', exceptionType: 'Job Not Found', count: 3 },
    { country: 'DE', exceptionType: 'Charge Code Not Found', count: 13 },
  ];

  const filteredData = effectiveCountryCode === "all" 
    ? rawMockInvoiceLineExceptionData 
    : rawMockInvoiceLineExceptionData.filter(item => item.country === effectiveCountryCode);

  // Aggregation logic: Compute exception counts by country dynamically
  const aggregatedData = filteredData.reduce((acc: { [country: string]: { totalCount: number; exceptions: { [type: string]: number } } }, item) => {
    const country = item.country;
    if (!acc[country]) {
      acc[country] = { totalCount: 0, exceptions: {} };
    }
    if (selectedExceptionType === "all" || item.exceptionType === selectedExceptionType) {
      acc[country].totalCount += item.count;
      if (!acc[country].exceptions[item.exceptionType]) {
        acc[country].exceptions[item.exceptionType] = 0;
      }
      acc[country].exceptions[item.exceptionType] += item.count;
    }
    return acc;
  }, {});

  // Sort countries by count descending for better visualization
  const sortedCountries = Object.entries(aggregatedData)
    .sort(([, a], [, b]) => b.totalCount - a.totalCount)
    .reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {} as { [country: string]: { totalCount: number; exceptions: { [type: string]: number } } });

  // Dynamic colors: Generate an array of colors based on number of countries
  const generateColors = (num: number): string[] => {
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];
    return Array.from({ length: num }, (_, i) => colors[i % colors.length]);
  };

  const countries = Object.keys(sortedCountries);
  const values = Object.values(sortedCountries).map(item => item.totalCount); // Use totalCount for chart values
  const backgroundColors = generateColors(countries.length);

  // Chart data configuration (dynamically updated based on aggregated data)
  const chartData = {
    labels: countries,
    datasets: [
      {
        data: values,
        backgroundColor: backgroundColors,
        borderColor: Array(countries.length).fill('#FFFFFF'),
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for ChartSwitcher (array of objects with all keys filled)
  const chartSwitcherData = countries.map((country, index) => {
    const obj: { [key: string]: string | number } = { country };
    countries.forEach((key, k) => {
      obj[key] = (key === country) ? values[index] : 0;
    });
    return obj;
  });

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false, // Ensure chart resizes to fit container without maintaining aspect ratio
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'grey' as const,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const country = context.label;
            const countryData = sortedCountries[country];
            if (countryData) {
              let tooltipText = [`${country}: ${countryData.totalCount} exceptions`];
              for (const exceptionType in countryData.exceptions) {
                tooltipText.push(`  ${exceptionType}: ${countryData.exceptions[exceptionType]}`);
              }
              return tooltipText;
            }
            return `${context.label}: ${context.raw} exceptions`;
          },
        },
      },
    },
  };

  return (
    <Card className="bg-gradient-card shadow-card">
      <CardHeader>
        <div className="flex justify-end mb-4">
          <Select onValueChange={setSelectedExceptionType} value={selectedExceptionType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by Exception Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Exceptions</SelectItem>
              <SelectItem value="Value by Chargecode is Invalid">VALUE BY CHARGECODE IS INVALID</SelectItem>
              <SelectItem value="Job Not Found">JOB NOT FOUND</SelectItem>
              <SelectItem value="Charge Code Not Found">CHARGE CODE NOT FOUND</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent style={{ height: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {countries.length === 0 ? (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            No data available for the selected country.
          </div>
        ) : (
          chartType !== "default" ? (
            <ResponsiveContainer width="100%" height="100%">
              <ChartSwitcher
                data={chartSwitcherData}
                dataKeys={countries}
                xKey="country"
                showSelector={false}
                type={chartType}
              />
            </ResponsiveContainer>
        ) : (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {/* {console.log("Chart Data:", chartData)}
            {console.log("Chart Options:", options)} */}
            <Doughnut data={chartData} options={options} />
          </div>
        )
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceLineExceptionRatio;