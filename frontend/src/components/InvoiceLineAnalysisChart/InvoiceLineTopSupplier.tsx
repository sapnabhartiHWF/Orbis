import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  Tooltip,
  Legend,
  PieChart as RePieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import ChartSwitcher from "@/components/ChartSwitcher";

type SupplierRecord = {
  supplierName: string;
  invoiceLineCount: number;
  country: string;
};

type Props = {
  countryCode?: string;
  supplierName?: string;
  title?: string;
  chartType?: "default" | "bar" | "line" | "area";
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="custom-tooltip"
        style={{
          backgroundColor: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
          borderRadius: 8,
          padding: "10px",
          color: "hsl(var(--foreground))",
        }}
      >
        <p className="label">{`Supplier: ${payload[0].name}`}</p>
        <p className="value">{`Invoice Lines: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

// Mock fallback data
const fallbackData: SupplierRecord[] = [
  { supplierName: "MAERSK TRADEWAY", invoiceLineCount: 1200, country: "AUS" },
  { supplierName: "MAERSK TRADEWAY", invoiceLineCount: 800, country: "UK" },
  { supplierName: "LISTE", invoiceLineCount: 980, country: "SA" },
  { supplierName: "KSN LOGISTICS CC", invoiceLineCount: 860, country: "DE" },
  { supplierName: "KSN LOGISTICS CC", invoiceLineCount: 400, country: "NL" },
  { supplierName: "JG Hauliers (Pty) Ltd", invoiceLineCount: 820, country: "AUS" },
  { supplierName: "IATA", invoiceLineCount: 790, country: "UK" },
  { supplierName: "Fastra", invoiceLineCount: 760, country: "SA" },
  { supplierName: "Fastra", invoiceLineCount: 300, country: "DE" },
  { supplierName: "ECU WORLDWIDE", invoiceLineCount: 740, country: "NL" },
  { supplierName: "CPTRANSPORTATIONSE", invoiceLineCount: 720, country: "AUS" },
  { supplierName: "COSCO SHIPPING LINES", invoiceLineCount: 690, country: "UK" },
  { supplierName: "BOS Logistic B.V.", invoiceLineCount: 670, country: "SA" },
  { supplierName: "AUSTRALIAN BORDER FO.", invoiceLineCount: 650, country: "DE" },
];

const InvoiceLineTopSupplier: React.FC<Props> = ({
  countryCode = "all",
  supplierName = "all",
  title,
  chartType = "default",
}) => {
  const effectiveCountryCode =
    countryCode === "--SELECT--" || countryCode === "all" || !countryCode
      ? "all"
      : countryCode.toUpperCase();

  const effectiveSupplier =
    supplierName === "--SELECT--" || supplierName === "all" || !supplierName
      ? "all"
      : supplierName;

  const source = fallbackData;

  // Filter by country
  let filteredSource =
    effectiveCountryCode === "all"
      ? source
      : source.filter((d) => d.country === effectiveCountryCode);

  // Filter by supplier
  if (effectiveSupplier !== "all") {
    filteredSource = filteredSource.filter(
      (d) => d.supplierName === effectiveSupplier
    );
  }

  // Aggregate by supplier
  const aggregated = filteredSource.reduce(
    (acc: Record<string, number>, curr) => {
      if (!acc[curr.supplierName]) {
        acc[curr.supplierName] = 0;
      }
      acc[curr.supplierName] += curr.invoiceLineCount;
      return acc;
    },
    {}
  );

  // Sort top 10
  const prepared = useMemo(() => {
    const allTop = Object.entries(aggregated)
      .map(([supplierName, invoiceLineCount]) => ({
        supplierName,
        invoiceLineCount,
      }))
      .sort((a, b) => b.invoiceLineCount - a.invoiceLineCount)
      .slice(0, 10);

    return allTop.map((d) => ({
      ...d,
      supplierLabel:
        d.supplierName.length > 18
          ? `${d.supplierName.slice(0, 16)}…`
          : d.supplierName,
    }));
  }, [aggregated]);

  // Color palette
  const colors = [
    "#4F46E5",
    "#22C55E",
    "#F59E0B",
    "#EF4444",
    "#06B6D4",
    "#8B5CF6",
    "#10B981",
    "#F97316",
    "#3B82F6",
    "#84CC16",
  ];

  // Map supplier → color
  const colorMap: Record<string, string> = {};
  prepared.forEach((d, i) => {
    colorMap[d.supplierName] = colors[i % colors.length];
  });

  // Transform data for ChartSwitcher
  const chartData = prepared.map((d) => ({
    supplierLabel: d.supplierLabel,
    [d.supplierName]: d.invoiceLineCount,
  }));

  return (
    <Card className="bg-gradient-card shadow-card w-full">
      <CardContent>
        {prepared.length === 0 ? (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            No data available for the selected country.
          </div>
        ) : chartType !== "default" ? (
          <ChartSwitcher
            data={chartData}
            dataKeys={prepared.map((d) => d.supplierName)}
            xKey="supplierLabel"
            showSelector={false}
            type={chartType}
            colors={colorMap} // pass color map
          />
        ) : (
          <ResponsiveContainer width="100%" height={420}>
            <RePieChart>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ color: "hsl(var(--muted-foreground))" }}
              />
              <Pie
                data={prepared}
                dataKey="invoiceLineCount"
                nameKey="supplierLabel"
                cx="50%"
                cy="50%"
                innerRadius={90}
                outerRadius={140}
                paddingAngle={2}
                label
              >
                {prepared.map((slice, i) => (
                  <Cell
                    key={i}
                    fill={colorMap[slice.supplierName]}
                  />
                ))}
              </Pie>
            </RePieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceLineTopSupplier;
