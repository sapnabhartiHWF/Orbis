import React from "react";
import {
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Text,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import ChartSwitcher from "@/components/ChartSwitcher";
import { BarChart3 } from "lucide-react";

interface ExceptionData {
  supplierName: string;
  exceptionCode: "INVOICES NOT MATCH" | "DUPLICATE INVOICE";
  value: number; // e.g., count of exceptions
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
    const dataPoint = payload[0].payload;
    // The label for BarChart tooltip is the XAxis dataKey, which is supplierName
    const supplierName = label;
    const exceptionType1 = payload[0].name;
    const value1 = payload[0].value;
    const exceptionType2 = payload[1] ? payload[1].name : undefined;
    const value2 = payload[1] ? payload[1].value : undefined;

    return (
      <div className="custom-tooltip p-3 border rounded-lg shadow-sm"
        style={{
          backgroundColor: "hsl(var(--card))",
          borderColor: "hsl(var(--border))",
        }}>
        <p className="label text-sm font-semibold mb-1">{`Supplier: ${supplierName}`}</p>
        <p className="text-sm" style={{ color: exceptionColors[exceptionType1 as keyof typeof exceptionColors] }}>
          {`${exceptionType1}: ${value1}`}
        </p>
        {exceptionType2 && value2 !== undefined && (
          <p className="text-sm" style={{ color: exceptionColors[exceptionType2 as keyof typeof exceptionColors] }}>
            {`${exceptionType2}: ${value2}`}
          </p>
        )}
      </div>
    );
  }

  return null;
};

interface CustomXAxisTickProps {
  x?: number;
  y?: number;
  payload?: { value: string };
}

const CustomXAxisTick: React.FC<CustomXAxisTickProps> = ({ x, y, payload }) => {
  const MAX_CHARS_PER_LINE = 15; // Adjust as needed
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

const mockData: ExceptionData[] = [
  { supplierName: "AGS", exceptionCode: "INVOICES NOT MATCH", value: 5 },
  { supplierName: "AGS", exceptionCode: "DUPLICATE INVOICE", value: 2 },
  { supplierName: "CP TRANSPORTATION SERVICES LTD", exceptionCode: "INVOICES NOT MATCH", value: 10 },
  { supplierName: "CP TRANSPORTATION SERVICES LTD", exceptionCode: "DUPLICATE INVOICE", value: 3 },
  { supplierName: "MILLTRANS", exceptionCode: "INVOICES NOT MATCH", value: 7 },
  { supplierName: "MILLTRANS", exceptionCode: "DUPLICATE INVOICE", value: 4 },
  { supplierName: "AVN LOGISTICS (PTY) LTD", exceptionCode: "INVOICES NOT MATCH", value: 8 },
  { supplierName: "AVN LOGISTICS (PTY) LTD", exceptionCode: "DUPLICATE INVOICE", value: 6 },
  { supplierName: "CNS", exceptionCode: "INVOICES NOT MATCH", value: 8 },
  { supplierName: "CNS", exceptionCode: "DUPLICATE INVOICE", value: 6 },
  { supplierName: "DHL Aviation", exceptionCode: "INVOICES NOT MATCH", value: 8 },
  { supplierName: "DHL Aviation", exceptionCode: "DUPLICATE INVOICE", value: 6 },
  { supplierName: "Douane", exceptionCode: "INVOICES NOT MATCH", value: 8 },
  { supplierName: "Douane", exceptionCode: "DUPLICATE INVOICE", value: 6 },
  { supplierName: "Fastra", exceptionCode: "INVOICES NOT MATCH", value: 8 },
  { supplierName: "Fastra", exceptionCode: "DUPLICATE INVOICE", value: 6 },
  { supplierName: "Fryers Transport", exceptionCode: "INVOICES NOT MATCH", value: 8 },
  { supplierName: "Fryers Transport", exceptionCode: "DUPLICATE INVOICE", value: 6 },
  { supplierName: "Hapag", exceptionCode: "INVOICES NOT MATCH", value: 8 },
  { supplierName: "Hapag", exceptionCode: "DUPLICATE INVOICE", value: 6 },
  { supplierName: "JG Hauliers (Pty) Ltd", exceptionCode: "INVOICES NOT MATCH", value: 8 },
  { supplierName: "JG Hauliers (Pty) Ltd", exceptionCode: "DUPLICATE INVOICE", value: 6 },
  { supplierName: "KSN LOGISTICS CC", exceptionCode: "INVOICES NOT MATCH", value: 8 },
  { supplierName: "KSN LOGISTICS CC", exceptionCode: "DUPLICATE INVOICE", value: 6 },
  { supplierName: "MAERSK", exceptionCode: "INVOICES NOT MATCH", value: 8 },
  { supplierName: "MAERSK", exceptionCode: "DUPLICATE INVOICE", value: 6 },
  { supplierName: "Maritime Cargo Processing plc", exceptionCode: "INVOICES NOT MATCH", value: 8 },
  { supplierName: "Maritime Cargo Processing plc", exceptionCode: "DUPLICATE INVOICE", value: 6 },
];

const exceptionColors = {
  "INVOICES NOT MATCH": "#EF4444", // Red
  "DUPLICATE INVOICE": "#3B82F6", // Blue
};

const transformDataForChart = (data: ExceptionData[], supplierName: string): Record<string, any>[] => {
  const effectiveSupplier = supplierName === "--SELECT--" || supplierName === "all" || !supplierName ? "all" : supplierName.toLowerCase();
  const filteredData = effectiveSupplier === "all" ? data : data.filter(item => item.supplierName.toLowerCase() === effectiveSupplier);

  const groupedData: Record<string, any> = {};

  filteredData.forEach(item => {
    if (!groupedData[item.supplierName]) {
      groupedData[item.supplierName] = { supplierName: item.supplierName };
    }
    groupedData[item.supplierName][item.exceptionCode] = item.value;
  });

  return Object.values(groupedData);
};

interface SupplierWiseExceptionProps { supplierName?: string; company?: string; chartType?: "default" | "bar" | "line" | "area" | "pie" }

const SupplierWiseException: React.FC<SupplierWiseExceptionProps> = ({ supplierName = "--SELECT--", company, chartType = "default" }) => {
  const chartData = transformDataForChart(mockData, supplierName);

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
              dataKeys={["INVOICES NOT MATCH", "DUPLICATE INVOICE"]}
              xKey="supplierName"
              showSelector={false}
              type={chartType}
            />
          ) : (
            <ResponsiveContainer width="100%" height={500}>
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="supplierName"
                  type="category"
                  interval={0}
                  tick={<CustomXAxisTick />}
                  height={100}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  type="number"
                  stroke="hsl(var(--muted-foreground))"
                  label={{ value: "Exception Count", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  content={<CustomTooltip />}
                />
                <Legend />
                <Bar dataKey="INVOICES NOT MATCH" fill={exceptionColors["INVOICES NOT MATCH"]} />
                <Bar dataKey="DUPLICATE INVOICE" fill={exceptionColors["DUPLICATE INVOICE"]} />
              </BarChart>
            </ResponsiveContainer>
          )
        )}
      </CardContent>
    </Card>
  );
};

export default SupplierWiseException;