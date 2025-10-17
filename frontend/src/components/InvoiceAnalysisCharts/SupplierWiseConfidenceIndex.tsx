import React from "react";
import {
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import ChartSwitcher from "@/components/ChartSwitcher";

interface FlatConfidenceData {
  supplierName: string;
  countryCode: string;
  confidenceIndex: "Unknown" | "High" | "Low" | "Medium";
  value: number;
}

interface ChartDataPoint {
  supplierName: string;
  countryCode: string;
  confidenceIndex: "Unknown" | "High" | "Low" | "Medium";
  value: number;
  yAxisLabel: string;
  supplierNameIndex: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

interface CustomXAxisTickProps {
  x?: number;
  y?: number;
  payload?: { value: number };
}

const mockData: FlatConfidenceData[] = [
  { supplierName: "AGS", countryCode: "AU", confidenceIndex: "Low", value: 33 },
  { supplierName: "AVN LOGISTICS (PTY) L.", countryCode: "AU", confidenceIndex: "Low", value: 320 },
  { supplierName: "AVN LOGISTICS (PTY) L.", countryCode: "UK", confidenceIndex: "High", value: 189 },
  { supplierName: "CNS", countryCode: "US", confidenceIndex: "Medium", value: 2077 },
  { supplierName: "CP TRANSPORTATION SE..", countryCode: "SA", confidenceIndex: "Low", value: 3 },
  { supplierName: "CP TRANSPORTATION SE..", countryCode: "UK", confidenceIndex: "High", value: 313 },
  { supplierName: "DHL Aviation", countryCode: "US", confidenceIndex: "Medium", value: 9 },
  { supplierName: "DHL Aviation", countryCode: "UK", confidenceIndex: "High", value: 275 },
  { supplierName: "Douane", countryCode: "US", confidenceIndex: "Medium", value: 1853 },
  { supplierName: "Douane", countryCode: "UK", confidenceIndex: "Low", value: 11 },
  { supplierName: "Fastra", countryCode: "US", confidenceIndex: "High", value: 1526 },
  { supplierName: "Fastra", countryCode: "UK", confidenceIndex: "Low", value: 166 },
  { supplierName: "Fryers Transport", countryCode: "SA", confidenceIndex: "Low", value: 10 },
  { supplierName: "Fryers Transport", countryCode: "UK", confidenceIndex: "Medium", value: 55 },
  { supplierName: "Hapag", countryCode: "SA", confidenceIndex: "Unknown", value: 11 },
  { supplierName: "Hapag", countryCode: "UK", confidenceIndex: "High", value: 454 },
  { supplierName: "JG Hauliers (Pty) Ltd", countryCode: "SA", confidenceIndex: "Medium", value: 206 },
  { supplierName: "JG Hauliers (Pty) Ltd", countryCode: "UK", confidenceIndex: "Low", value: 61 },
  { supplierName: "KSN LOGISTICS CC", countryCode: "SA", confidenceIndex: "High", value: 386 },
  { supplierName: "MAERSK", countryCode: "AU", confidenceIndex: "Unknown", value: 75 },
  { supplierName: "MILLTRANS", countryCode: "SA", confidenceIndex: "Medium", value: 120 },
];

const confidenceColors = {
  High: "#34D399",
  Medium: "#FBBF24",
  Low: "#EF4444",
  Unknown: "#9CA3AF",
};

const uniqueSupplierNames = Array.from(new Set(mockData.map(item => item.supplierName)));
const countries = Array.from(new Set(mockData.map(item => item.countryCode))).sort();

const transformDataForChart = (data: FlatConfidenceData[], countryCode: string, supplierName: string): ChartDataPoint[] => {
  const effectiveCountryCode = countryCode === "--SELECT--" || countryCode === "all" || !countryCode ? "all" : countryCode.toLowerCase();
  const effectiveSupplierName = supplierName === "--SELECT--" || supplierName === "all" || !supplierName ? "all" : supplierName.toLowerCase();
  const filteredData = data.filter(item => {
    const countryMatch = effectiveCountryCode === "all" || item.countryCode.toLowerCase() === effectiveCountryCode;
    const supplierMatch = effectiveSupplierName === "all" || item.supplierName.toLowerCase() === effectiveSupplierName;
    return countryMatch && supplierMatch;
  });

  if (filteredData.length === 0) {
    return [];
  }

  const invoiceValues = filteredData.map(item => item.value).sort((a, b) => a - b);
  const q1 = invoiceValues[Math.floor(invoiceValues.length * 0.25)] || 0;
  const q3 = invoiceValues[Math.floor(invoiceValues.length * 0.75)] || 0;

  return filteredData.map(item => {
    let confidenceIndex: "Unknown" | "High" | "Low" | "Medium" = item.confidenceIndex;
    if (item.value <= q1) {
      confidenceIndex = "Low";
    } else if (item.value > q1 && item.value <= q3) {
      confidenceIndex = "Medium";
    } else if (item.value > q3) {
      confidenceIndex = "High";
    }

    return {
      ...item,
      confidenceIndex,
      yAxisLabel: item.countryCode,
      supplierNameIndex: uniqueSupplierNames.indexOf(item.supplierName),
    };
  });
};

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const countryCode = dataPoint.yAxisLabel;
    const supplierName = dataPoint.supplierName;
    const confidenceIndex = dataPoint.confidenceIndex;
    const value = dataPoint.value;

    return (
      <div
        className="custom-tooltip p-3 border rounded-lg shadow-sm"
        style={{
          backgroundColor: "hsl(var(--card))",
          borderColor: "hsl(var(--border))",
        }}
      >
        <p className="label text-sm font-semibold mb-1">{`Country: ${countryCode}`}</p>
        <p className="label text-sm text-muted-foreground mb-1">{`Supplier: ${supplierName}`}</p>
        <p
          className="text-sm"
          style={{ color: confidenceColors[confidenceIndex as keyof typeof confidenceColors] }}
        >
          {`${confidenceIndex} Confidence: ${value}`}
        </p>
      </div>
    );
  }

  return null;
};

const reshapeData = (data: ChartDataPoint[]) => {
  const result: any[] = [];
  const suppliers = Array.from(new Set(data.map(d => d.supplierName)));

  suppliers.forEach(supplier => {
    const entry: any = { supplierName: supplier };
    data.filter(d => d.supplierName === supplier).forEach(d => {
      entry[d.countryCode] = d.value;
    });
    result.push(entry);
  });

  return result;
};


const CustomXAxisTick: React.FC<CustomXAxisTickProps> = ({ x, y, payload }) => {
  const MAX_CHARS_PER_LINE = 10;
  const text = uniqueSupplierNames[payload?.value || 0] || '';
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
  lines.push(currentLine);

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={20} dy={15} textAnchor="middle" fill="hsl(var(--muted-foreground))">
        {lines.map((line, index) => (
          <tspan key={index} x={0} dy={index === 0 ? 0 : 15} fontSize="10px">
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
};

interface SupplierWiseConfidenceIndexProps { countryCode?: string; supplierName?: string; chartType?: "default" | "bar" | "line" | "area" | "pie" }

const SupplierWiseConfidenceIndex: React.FC<SupplierWiseConfidenceIndexProps> = ({ countryCode = "--SELECT--", supplierName = "--SELECT--", chartType = "default" }) => {
  const chartData = transformDataForChart(mockData, countryCode, supplierName);
  const uniqueCountryCodesInChart = Array.from(new Set(chartData.map(item => item.countryCode))).sort();

  console.log("chartData", chartData);
console.log("dataKeys", uniqueCountryCodesInChart);

  const xAxisTicks = uniqueSupplierNames.map((_, index) => index);
  const reshapedData = reshapeData(chartData);

  return (
    <Card className="bg-gradient-card shadow-card">
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            No data available for the selected country or supplier.
          </div>
        ) : (
          chartType !== "default" ? (
            <ChartSwitcher
              data={reshapedData}
              dataKeys={uniqueCountryCodesInChart}
              // dataKeys={["value"]}
              xKey="supplierName"
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
                  dataKey="supplierNameIndex"
                  type="number"
                  interval={0}
                  tick={<CustomXAxisTick />}
                  height={100}
                  stroke="hsl(var(--muted-foreground))"
                  label={{ value: "Supplier Name", position: "insideBottom", offset: 10 }}
                  tickFormatter={(value) => uniqueSupplierNames[value]}
                  ticks={xAxisTicks}
                />
                <YAxis
                  dataKey="yAxisLabel"
                  type="category"
                  label={{ value: "Country Code", angle: -90, position: "insideLeft" }}
                  stroke="hsl(var(--muted-foreground))"
                  domain={uniqueCountryCodesInChart}
                  tickFormatter={(value) => String(value)}
                />
                <ZAxis dataKey="value" type="number" range={[10, 500]} name="Invoice Count" />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={<CustomTooltip />}
                />
                <Legend />
                {Object.keys(confidenceColors).map((confidenceKey) => (
                  <Scatter
                    key={confidenceKey}
                    name={confidenceKey + " Confidence"}
                    data={chartData.filter(item => item.confidenceIndex === confidenceKey)}
                    fill={confidenceColors[confidenceKey as keyof typeof confidenceColors]}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          )
        )}
      </CardContent>
    </Card>
  );
};

export default SupplierWiseConfidenceIndex;