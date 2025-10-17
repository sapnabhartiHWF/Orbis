import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Bot } from "lucide-react";
import ChartSwitcher from "@/components/ChartSwitcher";

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
}) => {
  if (active && payload && payload.length) {
    const country = label;
    const rangeColors: { [key: string]: string } = {
      "2000 and below": "#1f77b4",
      "4001 to 6000": "#17a2b8",
      "6001 to 11000": "#28a745",
      "11001 to 16000": "#ffc107",
      "16001 to 21000": "#fd7e14",
      "above 21000": "#dc3545",
    };

    const totalInvoiceCount = payload.reduce(
      (sum, entry) => sum + entry.value,
      0
    ); // Calculate total

    return (
      <div
        className="custom-tooltip p-3 border rounded-lg shadow-sm"
        style={{
          backgroundColor: "hsl(var(--card))",
          borderColor: "hsl(var(--border))",
        }}
      >
        <p className="label text-sm font-semibold mb-1">{country}</p>
        {/* Add total invoice line count */}
        <p className="text-sm text-muted-foreground mb-2">
          Total InvoiceLine Count: {totalInvoiceCount}
        </p>
        {payload.map((entry, index) => {
          if (entry.value > 0) { // Only show ranges with values greater than 0
            return (
              <p
                key={`item-${index}`}
                className="text-sm"
                style={{
                  color: rangeColors[entry.name as keyof typeof rangeColors],
                }}
              >
                {`${entry.name}: ${entry.value}`}
              </p>
            );
          }
          return null;
        })}
      </div>
    );
  }

  return null;
};

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
    totalInvoices: 5500,
    zozbot: "Zozbot-Alpha",
    lastInvoiceDate: "2024-07-15",
    supplierName: "Supplier A",
    status: "paid",
  },
  {
    companyName: "Santova Logistics UK",
    totalInvoices: 17800,
    zozbot: "Zozbot-Beta",
    lastInvoiceDate: "2024-07-20",
    supplierName: "Supplier B",
    status: "pending",
  },
  {
    companyName: "Santova Logistics US",
    totalInvoices: 8500,
    zozbot: "Zozbot-Alpha",
    lastInvoiceDate: "2024-08-18",
    supplierName: "Supplier A",
    status: "paid",
  },
  {
    companyName: "Santova Logistics AU",
    totalInvoices: 11500,
    zozbot: "Zozbot-Gamma",
    lastInvoiceDate: "2024-08-10",
    supplierName: "Supplier C",
    status: "overdue",
  },
];

interface AggregatedData {
  country: string;
  "2000 and below": number;
  "4001 to 6000": number;
  "6001 to 11000": number;
  "11001 to 16000": number;
  "16001 to 21000": number;
  "above 21000": number;
}

const aggregateInvoiceData = (data: InvoiceData[]): AggregatedData[] => {
  const ranges = [
    { name: "2000 and below", min: 0, max: 2000 },
    { name: "4001 to 6000", min: 4001, max: 6000 },
    { name: "6001 to 11000", min: 6001, max: 11000 },
    { name: "11001 to 16000", min: 11001, max: 16000 },
    { name: "16001 to 21000", min: 16001, max: 21000 },
    { name: "above 21000", min: 21001, max: Infinity },
  ];

  const aggregatedMap = new Map<
    string,
    {
      "2000 and below": number;
      "4001 to 6000": number;
      "6001 to 11000": number;
      "11001 to 16000": number;
      "16001 to 21000": number;
      "above 21000": number;
    }
  >();

  data.forEach((item) => {
    const countryMatch = item.companyName.match(
      /Santova Logistics (SA|UK|US|AU|DE|NL)/
    );
    const country = countryMatch ? countryMatch[1] : "Unknown";

    if (!aggregatedMap.has(country)) {
      aggregatedMap.set(country, {
        "2000 and below": 0,
        "4001 to 6000": 0,
        "6001 to 11000": 0,
        "11001 to 16000": 0,
        "16001 to 21000": 0,
        "above 21000": 0,
      });
    }
    const countryData = aggregatedMap.get(country)!;

    for (const range of ranges) {
      if (item.totalInvoices >= range.min && item.totalInvoices <= range.max) {
        countryData[range.name as keyof typeof countryData] +=
          item.totalInvoices;
        break;
      }
    }
  });

  const result: AggregatedData[] = Array.from(aggregatedMap.entries()).map(
    ([country, values]) => ({
      country,
      ...values,
    })
  );

  // Sort the result to match the image's X-axis order: SA, NL, UK, AUS, DE
  const order = ["SA", "UK", "US", "AU"];
  result.sort((a, b) => order.indexOf(a.country) - order.indexOf(b.country));

  return result;
};

interface InvoiceLineByZozbotProps {
  countryCode?: string;
  chartType?: "default" | "line" | "area" | "pie"
}

const InvoiceLineByZozbot = ({
  countryCode = "all" ,chartType = "default"
}: InvoiceLineByZozbotProps) => {
  let dataToFilter = [...sampleInvoiceData];

  const effectiveCountryCode = countryCode === "--SELECT--" || countryCode === "all" || !countryCode ? "all" : countryCode.toUpperCase();

  if (effectiveCountryCode !== "all") {
    dataToFilter = dataToFilter.filter((item) => {
      const itemCountryMatch = item.companyName.match(
        /Santova Logistics (SA|UK|US|AU|DE|NL)/
      );
      const itemCountry = itemCountryMatch ? itemCountryMatch[1] : "Unknown";
      return itemCountry === effectiveCountryCode;
    });
  }

  const chartData = aggregateInvoiceData(dataToFilter);

  const rangeNames = [
    "2000 and below",
    "4001 to 6000",
    "6001 to 11000",
    "11001 to 16000",
    "16001 to 21000",
    "above 21000",
  ];

  const rangeColors = {
    "2000 and below": "#1f77b4",
    "4001 to 6000": "#17a2b8",
    "6001 to 11000": "#28a745",
    "11001 to 16000": "#ffc107",
    "16001 to 21000": "#fd7e14",
    "above 21000": "#dc3545",
  };

  const gradientIdFor = (name: string) =>
    `grad-${name.replace(/[^a-zA-Z0-9]/g, "-")}`;

  const uniqueCountries = Array.from(
    new Set(
      sampleInvoiceData.map((item) => {
        const match = item.companyName.match(
          /Santova Logistics (SA|UK|US|AU|DE|NL)/
        );
        return match ? match[1] : "Unknown";
      })
    )
  ).sort();

  return (
    <Card className="bg-gradient-card shadow-card">
      <CardContent>
        {dataToFilter.length === 0 ? (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            No data available for the selected country.
          </div>
          ) : (
            chartType !== "default" ? (
              <ChartSwitcher
                data={chartData}
                dataKeys={rangeNames}
                xKey="supplierName"
                showSelector={false}
                type={chartType}
              />
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={chartData}
              barCategoryGap="10%" // Adjusted for better spacing when selecting single bar
              margin={{
                top: 50,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <defs>
                {Object.entries(rangeColors).map(([name, color]) => (
                  <linearGradient
                    key={name}
                    id={gradientIdFor(name)}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="10%" stopColor={color} stopOpacity={0.85} />
                    <stop offset="90%" stopColor={color} stopOpacity={0.25} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis dataKey="country" stroke="hsl(var(--muted-foreground))" />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                label={{
                  value: "InvoiceLine Count",
                  angle: -90,
                  position: "insideLeft",
                  fill: "hsl(var(--muted-foreground))",
                  offset: -15,
                }}
                ticks={[0, 7500, 15000, 22500, 30000]} // Explicitly set ticks
              />
              <Tooltip cursor={false} content={<CustomTooltip />} />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
              />
              {rangeNames.map((range) => (
                <Bar
                  key={range}
                  dataKey={range}
                  stackId="a"
                  fill={`url(#${gradientIdFor(range)})`}
                  stroke={rangeColors[range as keyof typeof rangeColors]}
                  barSize={effectiveCountryCode !== "all" ? 300 : undefined} // Dynamic bar size: 100 if specific country, undefined for all
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


export default InvoiceLineByZozbot;