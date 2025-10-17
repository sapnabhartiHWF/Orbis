import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { Card, CardContent } from "@/components/ui/card";
import ChartSwitcher from "@/components/ChartSwitcher";

// Interface for raw mock data
interface RawSupplierWiseInvoiceLineData {
  supplierName: string;
  countryCode: 'UK' | 'SA' | 'US' | 'AU';
  invoiceLineCount: number;
}

// Interface for transformed data (used for default chart)
interface TransformedSupplierWiseInvoiceLineData {
  supplierName: string;
  countryCodeValue: number; // Numerical representation of countryCode
  countryCode: 'UK' | 'SA' | 'US' | 'AU';
  invoiceLineCount: number;
  chartType?: "default" | "line" | "area" | "pie";
}

// Map country codes to numerical values for Y-axis
const countryCodeMapping: { [key in RawSupplierWiseInvoiceLineData['countryCode']]: number } = {
  AU: 0,
  US: 1,
  SA: 2,
  UK: 3,
};

// Mock data
const rawMockSupplierWiseInvoiceLineData: RawSupplierWiseInvoiceLineData[] = [
  { supplierName: 'AGS', countryCode: 'AU', invoiceLineCount: 132 },
  { supplierName: 'AVN LOGISTICS (PTY) LTD', countryCode: 'AU', invoiceLineCount: 3903 },
  { supplierName: 'CP TRANSPORTATION SERVI.', countryCode: 'UK', invoiceLineCount: 320 },
  { supplierName: 'CNS', countryCode: 'UK', invoiceLineCount: 653 },
  { supplierName: 'CP TRANSPORTATION SERVL', countryCode: 'UK', invoiceLineCount: 532 },
  { supplierName: 'DHL Aviation', countryCode: 'UK', invoiceLineCount: 640 },
  { supplierName: 'Douane', countryCode: 'US', invoiceLineCount: 3578 },
  { supplierName: 'Fastra', countryCode: 'US', invoiceLineCount: 3560 },
  { supplierName: 'Fryers Transport', countryCode: 'US', invoiceLineCount: 2183 },
  { supplierName: 'Hapag', countryCode: 'UK', invoiceLineCount: 27 },
  { supplierName: 'JG Hauliers (Pty) Ltd', countryCode: 'UK', invoiceLineCount: 21 },
  { supplierName: 'KSN LOGISTICS CC', countryCode: 'US', invoiceLineCount: 226 },
  { supplierName: 'MAERSK', countryCode: 'US', invoiceLineCount: 1007 },
  { supplierName: 'Maritime Cargo Processing plc', countryCode: 'UK', invoiceLineCount: 796 },
  { supplierName: 'NVO Consolidation B.V.', countryCode: 'UK', invoiceLineCount: 3661 },
  { supplierName: 'OOCL', countryCode: 'UK', invoiceLineCount: 6302 },
  { supplierName: 'P.Marijnissen Transport B.V.', countryCode: 'UK', invoiceLineCount: 1938 },
];

// Reshape data for ChartSwitcher (all suppliers have all country keys)
const reshapeDataForChartSwitcher = (data: RawSupplierWiseInvoiceLineData[]) => {
  const allCountries: RawSupplierWiseInvoiceLineData['countryCode'][] = ['AU','US','SA','UK'];
  const grouped: { [supplier: string]: any } = {};

  data.forEach(item => {
    if (!grouped[item.supplierName]) {
      grouped[item.supplierName] = { supplierName: item.supplierName };
      allCountries.forEach(c => grouped[item.supplierName][c] = 0); // initialize missing countries
    }
    grouped[item.supplierName][item.countryCode] = item.invoiceLineCount;
  });

  return Object.values(grouped);
};

// Wrap text for X-axis
const wrapText = (text: string, width: number) => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine + ' ' + word;
    if ((testLine.length * 6) < width) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
};

// Custom X-axis tick
const CustomXAxisTick = (props: any) => {
  const { x, y, payload } = props;
  const MAX_WIDTH = 60;
  const FONT_SIZE = 10;
  const lines = wrapText(payload.value, MAX_WIDTH);

  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, index) => (
        <text
          key={index}
          x={0}
          y={10}
          dy={index * FONT_SIZE * 1.2}
          textAnchor="middle"
          fill="hsl(var(--muted-foreground))"
          className="text-[0.6rem]"
        >
          {line}
        </text>
      ))}
    </g>
  );
};

// Custom Tooltip for ChartSwitcher
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const countries: RawSupplierWiseInvoiceLineData['countryCode'][] = ['AU','US','SA','UK'];
    const colorMap: { [key in RawSupplierWiseInvoiceLineData['countryCode']]: string } = {
      AU: '#50D2C2', US: '#FF8C00', SA: '#1E90FF', UK: '#FF4C4C'
    };
    return (
      <div
        className="custom-tooltip p-3 border rounded-lg shadow-sm"
        style={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
      >
        <p className="label text-sm font-semibold mb-1">{`Supplier: ${dataPoint.supplierName}`}</p>
        {countries.map(code => (
          dataPoint[code] > 0 && (
            <p key={code} className="desc text-sm" style={{ color: colorMap[code] }}>
              {`${code}: ${dataPoint[code]}`}
            </p>
          )
        ))}
      </div>
    );
  }
  return null;
};

const SupplierWiseInvoiceLine = ({ countryCode = "all", supplierName = "--SELECT--", chartType = "default" }: { countryCode?: string, supplierName?: string, chartType?: "default" | "line" | "area" | "pie" }) => {
  
  const effectiveSupplierName = supplierName === "--SELECT--" || supplierName === "all" || !supplierName ? "all" : supplierName;
  const effectiveCountryCode = countryCode === "--SELECT--" || countryCode === "all" || !countryCode ? "all" : countryCode.toUpperCase();

  const filteredData = rawMockSupplierWiseInvoiceLineData.filter(item => {
    const supplierMatch = effectiveSupplierName === "all" || item.supplierName === effectiveSupplierName;
    const countryMatch = effectiveCountryCode === "all" || item.countryCode === effectiveCountryCode;
    return supplierMatch && countryMatch;
  });

  // For default chart
  const transformedData: TransformedSupplierWiseInvoiceLineData[] = filteredData.map(item => ({
    ...item,
    countryCodeValue: countryCodeMapping[item.countryCode],
  }));

  // For ChartSwitcher
  const chartSwitcherData = reshapeDataForChartSwitcher(filteredData);

  const uniqueCountryCodes = ['AU','US','SA','UK'].filter(code => filteredData.some(d => d.countryCode === code));

  return (
    <Card className="bg-gradient-card shadow-card">
      <CardContent>
        {filteredData.length === 0 ? (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            No data available for the selected filters.
          </div>
        ) : (
          chartType !== "default" ? (
            <ChartSwitcher
              data={chartSwitcherData}
              dataKeys={uniqueCountryCodes}
              xKey="supplierName"
              showSelector={false}
              type={chartType}
            />
          ) : (
            // DEFAULT CHART UNTOUCHED
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart
                data={transformedData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="supplierName"
                  interval={0}
                  tick={<CustomXAxisTick />}
                  height={100}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  dataKey="countryCodeValue"
                  type="number"
                  ticks={Object.values(countryCodeMapping)}
                  tickFormatter={(value: number) => ['AU','US','SA','UK'][value]}
                  domain={[-0.5, 3.5]}
                  stroke="hsl(var(--muted-foreground))"
                  label={{ value: 'CountryCode', angle: -90, position: 'insideLeft', fill: "hsl(var(--muted-foreground))", offset: -5 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }} />
                <defs>
                  <linearGradient id="colorCountryCode" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#50D2C2" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#50D2C2" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="countryCodeValue"
                  stroke="#50D2C2"
                  fill="url(#colorCountryCode)"
                  fillOpacity={1}
                  dot={{ r: 4, fill: '#50D2C2', stroke: '#50D2C2', strokeWidth: 2 }}
                >
                  <LabelList dataKey="invoiceLineCount" position="top" fill="#50D2C2" offset={10} />
                </Area>
              </AreaChart>
            </ResponsiveContainer>
          )
        )}
      </CardContent>
    </Card>
  );
};

export default SupplierWiseInvoiceLine;
