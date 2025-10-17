import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent } from "@/components/ui/card";

// Interface for raw mock data
interface RawInvoiceLineExceptionData {
  supplierName: string;
  exceptionType: 'CHARGE CODE NOT FOUND' | 'JOB NOT FOUND' | 'VALUE BY CHARGECODE IS INVALID';
  count: number; // Count of exceptions
}

// Interface for transformed data
interface InvoiceLineExceptionData {
  supplierName: string;
  exceptionType: 'CHARGE CODE NOT FOUND' | 'JOB NOT FOUND' | 'VALUE BY CHARGECODE IS INVALID';
  value: number; // Numerical representation of exceptionType for Y-axis
  count: number; // Add count of exceptions
  x?: number; // Add x property for numerical representation of supplierName
}

// Map exception types to numerical values for the Y-axis
const exceptionTypeMapping = {
  'CHARGE CODE NOT FOUND': 0,
  'JOB NOT FOUND': 1,
  'VALUE BY CHARGECODE IS INVALID': 2,
};

// Map numerical values back to exception types for Y-axis tick formatter
const exceptionTypeReverseMapping: { [key: number]: string } = {
  0: 'CHARGE CODE NOT FOUND',
  1: 'JOB NOT FOUND',
  2: 'VALUE BY CHARGECODE IS INVALID',
};

const rawMockInvoiceLineExceptionData: RawInvoiceLineExceptionData[] = [
  { supplierName: 'AGS', exceptionType: 'JOB NOT FOUND', count: 5 },
  { supplierName: 'AUSTRALIAN BORDER FO.', exceptionType: 'JOB NOT FOUND', count: 3 },
  { supplierName: 'AVN LOGISTICS (PTY) LTD', exceptionType: 'JOB NOT FOUND', count: 8 },
  { supplierName: 'BOS Logistic B.V.', exceptionType: 'JOB NOT FOUND', count: 2 },
  { supplierName: 'COSCO SHIPPING LINES', exceptionType: 'JOB NOT FOUND', count: 7 },
  { supplierName: 'CP TRANSPORTATION SE.', exceptionType: 'JOB NOT FOUND', count: 4 },
  { supplierName: 'ECU WORLDWIDE (NETH.', exceptionType: 'JOB NOT FOUND', count: 6 },
  { supplierName: 'Fastra', exceptionType: 'JOB NOT FOUND', count: 1 },
  { supplierName: 'IATA', exceptionType: 'VALUE BY CHARGECODE IS INVALID', count: 10 },
  { supplierName: 'JG Hauliers (Pty) Ltd', exceptionType: 'JOB NOT FOUND', count: 5 },
  { supplierName: 'KSN LOGISTICS CC', exceptionType: 'JOB NOT FOUND', count: 3 },
  { supplierName: 'LISTE', exceptionType: 'JOB NOT FOUND', count: 9 },
  { supplierName: 'MAERSK - TRADEWAY', exceptionType: 'JOB NOT FOUND', count: 2 },
  { supplierName: 'MILLTRANS', exceptionType: 'JOB NOT FOUND', count: 7 },
  { supplierName: 'Maritime Cargo Processing', exceptionType: 'JOB NOT FOUND', count: 4 },
  { supplierName: 'NVO Consolidation B.V.', exceptionType: 'JOB NOT FOUND', count: 6 },
  { supplierName: 'OOCL', exceptionType: 'JOB NOT FOUND', count: 1 },
  { supplierName: 'Port of Felixstowe', exceptionType: 'CHARGE CODE NOT FOUND', count: 12 },
  { supplierName: 'RNagel', exceptionType: 'JOB NOT FOUND', count: 8 },
  { supplierName: 'SANTOVA LOGISTICS (PTY.', exceptionType: 'JOB NOT FOUND', count: 3 },
  { supplierName: 'SEALAND TRANSPORT SE.', exceptionType: 'JOB NOT FOUND', count: 5 },
  { supplierName: 'South African Inland Logisti.', exceptionType: 'JOB NOT FOUND', count: 2 },
  { supplierName: 'TDA ROADFREIGHT CC', exceptionType: 'JOB NOT FOUND', count: 7 },
];

interface InvoiceLineSupplierWiseExceptionProps {
  supplierName?: string;
}

const InvoiceLineSupplierWiseException: React.FC<InvoiceLineSupplierWiseExceptionProps> = ({ supplierName = "--SELECT--" }) => {
  const effectiveSupplierName = supplierName === "--SELECT--" || supplierName === "all" || !supplierName ? "all" : supplierName;

  const filteredData = rawMockInvoiceLineExceptionData.filter(item => {
    const supplierMatch = effectiveSupplierName === "all" || item.supplierName === effectiveSupplierName;
    return supplierMatch;
  });

  const allSupplierNames = Array.from(new Set(filteredData.map(item => item.supplierName))).sort();
  const supplierNameToIndex = new Map(allSupplierNames.map((name, index) => [name, index]));

  const transformedData: InvoiceLineExceptionData[] = filteredData
    .sort((a, b) => a.supplierName.localeCompare(b.supplierName))
    .map(item => ({
      ...item,
      value: exceptionTypeMapping[item.exceptionType],
      x: supplierNameToIndex.get(item.supplierName)!,
    }));

  // Group data by exception type for rendering multiple scatters
  const groupedData = transformedData.reduce((acc, item) => {
    (acc[item.exceptionType] = acc[item.exceptionType] || []).push(item);
    return acc;
  }, {} as Record<string, InvoiceLineExceptionData[]>);

  // Helper function to wrap text
  const wrapText = (text: string, width: number, fontSize: number) => {
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

  // Custom Y-Axis Tick component for horizontal exception labels
  const CustomYAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const MAX_WIDTH_Y = 120;
    const FONT_SIZE_Y = 10;
    const formattedValue = exceptionTypeReverseMapping[payload.value] || String(payload.value);
    const lines = wrapText(formattedValue, MAX_WIDTH_Y, FONT_SIZE_Y);

    return (
      <g transform={`translate(${x},${y})`}>
        {lines.map((line, index) => (
          <text
            key={index}
            x={-55}
            y={0}
            dy={index * FONT_SIZE_Y * 1.5} // Vertical spacing for multi-line text
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

  // Custom X-Axis Tick component for rotated labels
  const CustomXAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const MAX_WIDTH = 80;
    const FONT_SIZE = 13;
    const supplierNames = Array.from(supplierNameToIndex.keys());
    const formattedValue = supplierNames[payload.value] || String(payload.value);
    const lines = wrapText(formattedValue, MAX_WIDTH, FONT_SIZE);

    return (
      <g transform={`translate(${x},${y})`}>
        {lines.map((line, index) => (
          <text
            key={index}
            x={0}
            y={10}
            dy={index * FONT_SIZE * 1}
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

  // Custom Tooltip for displaying details
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      const supplierName = Array.from(supplierNameToIndex.keys())[dataPoint.x];
      return (
        <div className="custom-tooltip p-3 border rounded-lg shadow-sm"
          style={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
          <p className="label text-sm font-semibold mb-1">{`Supplier: ${supplierName}`}</p>
          <p className="intro text-sm text-muted-foreground">{`Exception: ${dataPoint.exceptionType}`}</p>
          <p className="intro text-sm text-muted-foreground">{`Invoices Lines: ${dataPoint.count}`}</p>
        </div>
      );
    }
    return null;
  };

  const colors: Record<string, string> = {
    'CHARGE CODE NOT FOUND': '#50D2C2',
    'JOB NOT FOUND': '#8884d8',
    'VALUE BY CHARGECODE IS INVALID': '#FFBB28',
  };

  return (
    <Card className="bg-gradient-card shadow-card">
      <CardContent>
        {transformedData.length === 0 ? (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            No data available for the selected supplier.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart
              margin={{
                top: 20,
                right: 20,
                bottom: 10,
                left: 80, // Increased left margin for horizontal Y-axis labels
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="x"
                type="number"
                interval={0}
                domain={[0, allSupplierNames.length - 1]}
                ticks={allSupplierNames.map((_, index) => index)}
                tick={<CustomXAxisTick />}
                height={100}
                stroke="hsl(var(--muted-foreground))"
                angle={-45}
                textAnchor="end"
              />
              <YAxis
                dataKey="value"
                type="number"
                domain={[-0.5, Object.keys(exceptionTypeMapping).length - 0.6]}
                ticks={Object.values(exceptionTypeMapping)}
                width={120} // Increased width to accommodate horizontal labels
                stroke="hsl(var(--muted-foreground))"
                tick={<CustomYAxisTick />}
                label={{ value: 'Exception Type', angle: -90, position: 'insideLeft', fill: "hsl(var(--muted-foreground))", offset: -10 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '0px', marginTop: '0px', fontSize: '0.75rem' }} />
              {Object.keys(groupedData).map((exceptionType) => (
                <Scatter
                  key={exceptionType}
                  name={exceptionType}
                  data={groupedData[exceptionType]}
                  fill={colors[exceptionType]}
                  shape="circle"
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceLineSupplierWiseException;