import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader, Plane, AlertCircle } from "lucide-react";
import { apiGet, parseJsonResponse } from "@/services/api";
import { Badge } from "@/components/ui/badge";

interface AirlineDetail {
    "Flight Number": string;
    "Flight Status": string;
    "Airline Status": string;
}

export function AirlineDetailsTable({ botId }: { botId?: string | number }) {
    const [data, setData] = useState<AirlineDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const queryParams = new URLSearchParams();
                if (botId) {
                    queryParams.append("bot_id", botId.toString());
                }

                const response = await apiGet(`/api/operations/airline-details?${queryParams.toString()}`);
                const result = await parseJsonResponse(response);

                if (result.success && Array.isArray(result.data)) {
                    setData(result.data);
                } else {
                    setData([]);
                }
            } catch (err: any) {
                console.error("Error fetching airline details:", err);
                setError(err.message || "Failed to load airline details");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const getStatusBadge = (status: string) => {
        const s = status?.toLowerCase() || "";
        if (s === "done" || s === "success" || s === "completed") {
            return (
                <Badge className="bg-success/20 text-success border-success/30 hover:bg-success/30">
                    {status}
                </Badge>
            );
        }
        if (s === "exception" || s === "failed" || s === "error") {
            return (
                <Badge variant="destructive" className="bg-destructive/20 text-destructive border-destructive/30 hover:bg-destructive/30">
                    {status}
                </Badge>
            );
        }
        return <Badge variant="secondary">{status}</Badge>;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-xl border border-dashed">
                <Loader className="w-8 h-8 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground font-medium text-lg">Fetching Airline Operations Data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-destructive/5 rounded-xl border border-destructive/20 border-dashed">
                <AlertCircle className="w-8 h-8 text-destructive mb-4" />
                <p className="text-destructive font-medium text-lg">{error}</p>
            </div>
        );
    }

    return (
        <Card className="shadow-lg border-primary/10 bg-gradient-to-br from-white to-blue-50/30 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Plane className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-800">
                        Airline Flight Status Tracker
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="max-h-[60vh] overflow-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/80 sticky top-0 z-10">
                            <TableRow>
                                <TableHead className="font-bold text-slate-700">Flight Number</TableHead>
                                <TableHead className="font-bold text-slate-700">Flight Status</TableHead>
                                <TableHead className="font-bold text-slate-700">Airline Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-32 text-center text-muted-foreground text-lg">
                                        No flight records found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((item, idx) => (
                                    <TableRow key={idx} className="hover:bg-primary/5 transition-colors">
                                        <TableCell className="font-semibold text-slate-700">
                                            {item["Flight Number"]}
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(item["Flight Status"])}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-slate-600 font-medium">
                                                {item["Airline Status"]}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
