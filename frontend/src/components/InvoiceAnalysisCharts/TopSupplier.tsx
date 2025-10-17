import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import ChartSwitcher from "@/components/ChartSwitcher";

interface SupplierInvoiceData {
  supplierName: string;
  invoiceCount: number;
  countryCode: string;
}

interface AggregatedSupplierData {
  supplierName: string;
  totalInvoiceCount: number;
}

interface CustomXAxisTickProps {
  x?: number;
  y?: number;
  payload?: { value: string };
}

const CustomXAxisTick: React.FC<CustomXAxisTickProps> = ({
  x, y, payload
}) => {
  const MAX_CHARS_PER_LINE = 10; // Adjust as needed
  const text = payload?.value || '';
  const words = text.split(' ');
  let lines: string[] = [];
  let currentLine = '';

  words.forEach(word => {
    if ((currentLine + word).length <= MAX_CHARS_PER_LINE) {
      currentLine += (currentLine === '' ? '' : ' ') + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  });
  lines.push(currentLine); // Push the last line

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={20} dy={15} textAnchor="middle" fill="hsl(var(--muted-foreground))">
        {lines.map((line, index) => (
          <tspan key={index} x={0} dy={index === 0 ? 0 : 15} fontSize="12px">
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
};

const mockData: SupplierInvoiceData[] = [
  { supplierName: "Transnet Natio..", invoiceCount: 10500, countryCode: "NL" },
  { supplierName: "South African Inland Logis..", invoiceCount: 7800, countryCode: "SA" },
  { supplierName: "Fastra", invoiceCount: 7300, countryCode: "NL" },
  { supplierName: "UCH Logistics Ltd", invoiceCount: 6900, countryCode: "UK" },
  { supplierName: "WESTBANK TRANSPORT..", invoiceCount: 5500, countryCode: "SA" },
  { supplierName: "SANTOVA EXPRESS SA (P-", invoiceCount: 10200, countryCode: "UK" },
  { supplierName: "RNagel", invoiceCount: 6600, countryCode: "NL" },
  { supplierName: "CP TRANSPORTATION S..", invoiceCount: 4500, countryCode: "SA" },
  { supplierName: "Niek Dijkstra", invoiceCount: 1250, countryCode: "UK" },
  { supplierName: "POD LOGISTICS", invoiceCount: 1000, countryCode: "NL" },
];

const aggregatedData: AggregatedSupplierData[] = mockData.reduce((acc, current) => {
  const existingSupplier = acc.find(item => item.supplierName === current.supplierName);
  if (existingSupplier) {
    existingSupplier.totalInvoiceCount += current.invoiceCount;
  } else {
    acc.push({ supplierName: current.supplierName, totalInvoiceCount: current.invoiceCount });
  }
  return acc;
}, [] as AggregatedSupplierData[]);

const countryColors: { [key: string]: string } = {
  SA: "#FF6347", // Tomato (vibrant red)
  UK: "#32CD32",  // LimeGreen (vibrant green)
  US: "#FFD700",  // Gold (vibrant yellow)
  AU: "#1E90FF",  // DodgerBlue (vibrant blue)
};

const countries = Array.from(new Set(mockData.map(item => item.countryCode)));

const transformData = (data: AggregatedSupplierData[], supplierName: string): AggregatedSupplierData[] => {
  const effectiveSupplierName = supplierName === "--SELECT--" || supplierName === "all" || !supplierName ? "All" : supplierName;
  if (effectiveSupplierName === "All") {
    return data;
  } else {
    return data.filter(item => item.supplierName === effectiveSupplierName);
  }
};

interface TopSupplierProps {
  supplierName?: string;
  chartType?: "default" | "bar" | "line" | "area" | "pie"
}

const TopSupplier: React.FC<TopSupplierProps> = ({ supplierName = "--SELECT-- " ,chartType = "default"}) => {
  const chartData = transformData(aggregatedData, supplierName);

  return (
    <Card className="bg-gradient-card shadow-card">
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            No data available for the selected supplier.
          </div>
          ) : (
            chartType !== "default" ? (
              <ChartSwitcher
                data={chartData}
                dataKeys={["totalInvoiceCount"]}
                xKey="supplierName"
                showSelector={false}
                type={chartType}
              />
        ) : (
          <ResponsiveContainer width="100%" height={500}>
            <AreaChart
              data={chartData} // Use aggregated data
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} stroke="grey" />
              <XAxis
                dataKey="supplierName"
                type="category"
                interval={0}
                tick={<CustomXAxisTick />} // Keep custom tick for wrapping
                height={100} // Increase height to accommodate multi-line labels
                stroke="hsl(var(--muted-foreground))"
                label={{ value: "SupplierName", position: "insideBottom", offset: -5 }}
              />
              <YAxis
                type="number"
                stroke="hsl(var(--muted-foreground))"
                label={{ value: "InvoiceNo Count", angle: -90, position: "insideLeft" }}
              />
              <Tooltip
                cursor={{ fill: "transparent" }}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))", // Assuming border should match --card
                  color: "hsl(var(--foreground))", // Assuming text should be readable foreground color
                  borderRadius: "8px", // Add rounded corners
                }}
              />
              <Legend
                wrapperStyle={{
                  paddingTop: 20,
                  paddingBottom: 0,
                  height: 50,
                }}
                align="center"
                verticalAlign="bottom"
              />
              <Area
                type="monotone"
                dataKey="totalInvoiceCount" // Use aggregated data key
                stroke="#FF8C00" // DarkOrange (vibrant orange)
                fill="#FF8C00"
                activeDot={{ r: 9 }}
                // strokeWidth={supplierName ? 18 : 1}
              />
            </AreaChart>
          </ResponsiveContainer>
        )
        )}
      </CardContent>
    </Card>
  );
};

export default TopSupplier;