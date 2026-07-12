"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle, AlertCircle, XCircle, Circle } from "lucide-react";
import { useRouter } from "next/navigation";

interface Vehicle {
  id: string;
  vehicleId: string;
  regNo: string;
  name: string;
  type: string;
  status: string;
  odometer: number;
  lastServiceOdo: number;
  serviceIntervalKm: number;
}

interface VehicleSelectorProps {
  vehicles: Vehicle[];
  selectedVehicleId: string | null;
  onSelect: (vehicleId: string | null) => void;
}

export function VehicleSelector({ vehicles, selectedVehicleId, onSelect }: VehicleSelectorProps) {
  const [filter, setFilter] = useState<"all" | "AVAILABLE" | "ON_TRIP" | "IN_SHOP">("all");

  const filteredVehicles = vehicles.filter((v) =>
    filter === "all" ? true : v.status === filter
  );

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return { icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/20", label: "Available" };
      case "ON_TRIP":
        return { icon: AlertCircle, color: "text-yellow-400", bg: "bg-yellow-500/20", label: "On Trip" };
      case "IN_SHOP":
        return { icon: XCircle, color: "text-red-400", bg: "bg-red-500/20", label: "In Shop" };
      default:
        return { icon: Circle, color: "text-gray-400", bg: "bg-gray-500/20", label: "Unknown" };
    }
  };

  const serviceDue = (v: Vehicle) => {
    const nextService = v.lastServiceOdo + v.serviceIntervalKm;
    const due = nextService - v.odometer;
    return due <= 0 ? "OVERDUE" : `${due.toLocaleString()} km`;
  };

  return (
    <div className="bg-black/70 backdrop-blur rounded-xl p-4 border border-white/10 max-h-64 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-medium">Select Vehicle to Inspect</h2>
        <div className="flex gap-1">
          {["all", "AVAILABLE", "ON_TRIP", "IN_SHOP"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-2 py-1 text-xs rounded transition-all ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {filteredVehicles.map((v) => {
          const statusConfig = getStatusConfig(v.status);
          const due = serviceDue(v);
          const isOverdue = due === "OVERDUE";
          const StatusIcon = statusConfig.icon;

          return (
            <button
              key={v.id}
              onClick={() => onSelect(selectedVehicleId === v.vehicleId ? null : v.vehicleId)}
              className={`p-3 rounded-lg text-left text-sm transition-all relative ${
                selectedVehicleId === v.vehicleId
                  ? "bg-blue-600 text-white ring-2 ring-blue-400"
                  : "bg-white/5 text-gray-200 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-mono font-bold">{v.regNo}</div>
                <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
              </div>
              <div className="text-xs text-gray-400 mb-2">{v.name}</div>
              <div className="flex items-center gap-2 text-[10px] mb-1">
                <span className={`px-1.5 py-0.5 rounded ${statusConfig.bg} ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
                <span className={`px-1.5 py-0.5 rounded ${isOverdue ? "bg-red-500/20 text-red-400" : "bg-gray-500/20 text-gray-400"}`}>
                  {due}
                </span>
              </div>
              <div className="text-[10px] text-gray-500">{v.odometer.toLocaleString()} km</div>
            </button>
          );
        })}
      </div>

      {filteredVehicles.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No vehicles match the selected filter
        </div>
      )}
    </div>
  );
}

function StatusIcon({ className }: { className: string }) {
  return <CheckCircle className={className} />;
}