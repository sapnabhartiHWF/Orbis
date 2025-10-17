import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  X,
} from "lucide-react";

// Sample data structure - replace with your actual data
interface InvoiceData {
  companyId: string;
  companyName: string;
  totalInvoices: number;
  totalAmount: number;
  currency: string;
  status: "paid" | "pending" | "overdue";
  lastInvoiceDate: string;
}

interface ChartData {
  name: string;
  totalInvoices: number;
  totalAmount: number;
  companyId: string;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-800">{label}</p>
        <p className="text-sm text-gray-600">
          Total Invoices:{" "}
          <span className="font-medium">{data.totalInvoices}</span>
        </p>
        <p className="text-sm text-gray-600">
          Total Amount:{" "}
          <span className="font-medium text-green-600">
            ${data.totalAmount.toLocaleString()}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Badge className={`${getStatusColor(status)} border`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

interface InvoiceProcessChartProps {
  data: InvoiceData[];
}

const InvoiceProcessChart: React.FC<InvoiceProcessChartProps> = ({ data }) => {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InvoiceData | null>(null);

  // Transform data for the chart
  const chartData: ChartData[] = data.map((item) => ({
    name: item.companyName,
    totalInvoices: item.totalInvoices,
    totalAmount: item.totalAmount,
    companyId: item.companyId,
  }));

  // Calculate summary statistics
  //   const totalInvoices = data.reduce((sum, item) => sum + item.totalInvoices, 0);
  //   const totalAmount = data.reduce((sum, item) => sum + item.totalAmount, 0);
  //   const paidInvoices = data.filter((item) => item.status === "paid").length;
  //   const pendingInvoices = data.filter((item) => item.status === "pending").length;
  //   const overdueInvoices = data.filter((item) => item.status === "overdue").length;

  // Color palette for bars
  const colors = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"];

  const handleViewDetails = (item: InvoiceData) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  return (
    <>
      {/* INVOICE DETAILS BY COMPANY NAME AND ITS AMOUNT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Total Invoices by Company</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    // strokeDasharray="3 3"
                    stroke="#1f2937"
                  />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                  <Bar
                    dataKey="totalInvoices"
                    // fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    onClick={(data) => setSelectedCompany(data.companyId)}
                    barSize={60}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={colors[index % colors.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Table */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details by Company</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Total Invoices</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Invoice Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow
                    key={item.companyId}
                    className={`cursor-pointer hover:bg-gray-800 ${
                      selectedCompany === item.companyId ? "bg-gray-800" : ""
                    }`}
                    onClick={() => setSelectedCompany(item.companyId)}
                  >
                    <TableCell className="font-medium">
                      {item.companyName}
                    </TableCell>
                    <TableCell>{item.totalInvoices}</TableCell>
                    <TableCell className="font-medium text-green-600">
                      ${item.totalAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>
                    <TableCell>
                      {new Date(item.lastInvoiceDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <button
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(item);
                        }}
                      >
                        View Details
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Modal Popup */}
        {showModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 max-w-lg w-full mx-4 shadow-2xl">
              {/* Header */}
              <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                <h3 className="text-xl font-bold text-white">
                  Company Details
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content Grid */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Company Name
                    </label>
                    <p className="text-white font-medium">
                      {selectedItem.companyName}
                    </p>
                  </div>

                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Total Invoices
                    </label>
                    <p className="text-white font-medium text-2xl">
                      {selectedItem.totalInvoices}
                    </p>
                  </div>

                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Status
                    </label>
                    <div className="mt-1">
                      <StatusBadge status={selectedItem.status} />
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Total Amount
                    </label>
                    <p className="text-green-400 font-bold text-2xl">
                      ${selectedItem.totalAmount.toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Last Invoice Date
                    </label>
                    <p className="text-white font-medium">
                      {new Date(
                        selectedItem.lastInvoiceDate
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Currency
                    </label>
                    <p className="text-white font-medium">
                      {selectedItem.currency}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end pt-4 border-t border-gray-700">
                <button
                  onClick={closeModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* INVOICE SUCCESS AND EXCEPTION CHART AND DETAILS */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Success and Exception Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <div className="flex items-center justify-center h-full text-gray-500">
                  <BarChart
                    width={500}
                    height={300}
                    data={data}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="pv" fill="#8884d8" minPointSize={5}>
                      <LabelList
                        dataKey="name"
                        // content={renderCustomizedLabel}
                      />
                    </Bar>
                    <Bar dataKey="uv" fill="#82ca9d" minPointSize={10} />
                  </BarChart>
                </div>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div> */}
    </>
  );
};

export default InvoiceProcessChart;
