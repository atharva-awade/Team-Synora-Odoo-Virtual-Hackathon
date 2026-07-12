"use client";

import { useState, useCallback, useEffect } from "react";
import { Camera, Loader2 } from "lucide-react";
import { ARViewport } from "./ARViewport";
import { VehicleSelector } from "./VehicleSelector";
import { InspectionModal } from "./InspectionModal";

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

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function ARInspectionClient({ vehicles: initialVehicles, user }: { vehicles: Vehicle[]; user: User }) {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [modalVehicle, setModalVehicle] = useState<Vehicle | null>(null);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);

  useEffect(() => {
    const loadScript = (src: string, id: string) => {
      return new Promise<void>((resolve, reject) => {
        if (document.getElementById(id)) return resolve();
        const script = document.createElement("script");
        script.src = src;
        script.id = id;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
      });
    };

    Promise.all([
      loadScript("https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar-nft.js", "arjs"),
    ])
      .then(() => setScriptsLoaded(true))
      .catch((e) => console.error(e));
  }, []);

  const handleInspect = useCallback(() => {
    if (selectedVehicleId) {
      const v = vehicles.find((veh) => veh.vehicleId === selectedVehicleId);
      if (v) setModalVehicle(v);
    }
  }, [selectedVehicleId, vehicles]);

  const handleInspectionSubmit = async (data: any) => {
    const res = await fetch("/api/ar/inspections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicleId: modalVehicle?.vehicleId, ...data }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to save inspection");
    }
    // Refresh vehicle list
    const freshRes = await fetch("/api/vehicles?status=AVAILABLE,ON_TRIP,IN_SHOP");
    const freshData = await freshRes.json();
    if (freshData.vehicles) setVehicles(freshData.vehicles);
  };

  useEffect(() => {
    if (!selectedVehicleId && vehicles.length > 0) {
      setSelectedVehicleId(vehicles[0].vehicleId);
    }
  }, [vehicles, selectedVehicleId]);

  const selectedVehicle = vehicles.find((v) => v.vehicleId === selectedVehicleId);

  if (!scriptsLoaded) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black z-50">
        <div className="text-center text-white">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-400 mb-4" />
          <p>Loading AR engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-black">
      <ARViewport
        vehicles={vehicles}
        selectedVehicleId={selectedVehicleId}
        onInspect={handleInspect}
      />

      <div className="relative z-10 h-full flex flex-col">
        <header className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm border-b border-white/10">
          <div className="flex items-center gap-3">
            <Camera className="h-5 w-5 text-blue-400" />
            <h1 className="text-xl font-semibold text-white">AR Vehicle Inspection</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-300 hidden sm:block">{user.name} ({user.role})</span>
          </div>
        </header>

        <div className="flex-1 flex flex-col justify-end p-4">
          <VehicleSelector
            vehicles={vehicles}
            selectedVehicleId={selectedVehicleId}
            onSelect={setSelectedVehicleId}
          />
        </div>
      </div>

      {modalVehicle && (
        <InspectionModal
          vehicle={modalVehicle}
          onClose={() => setModalVehicle(null)}
          onSubmit={handleInspectionSubmit}
        />
      )}
    </div>
  );
}