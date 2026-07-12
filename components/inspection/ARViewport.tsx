"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Truck } from "lucide-react";

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

interface ARViewportProps {
  vehicles: Vehicle[];
  selectedVehicleId: string | null;
  onInspect: () => void;
}

export function ARViewport({ vehicles, selectedVehicleId, onInspect }: ARViewportProps) {
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [targetFound, setTargetFound] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);
  const selectedVehicle = vehicles.find((v) => v.vehicleId === selectedVehicleId);

  // Load AR.js + A-Frame script
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

  // Build A-Frame scene when scripts are loaded and vehicle selected
  useEffect(() => {
    if (!scriptsLoaded || !sceneRef.current || !selectedVehicle) return;

    const container = sceneRef.current;
    container.innerHTML = "";

    // Service due calculation
    const nextServiceOdo = selectedVehicle.lastServiceOdo + selectedVehicle.serviceIntervalKm;
    const serviceDue = nextServiceOdo - selectedVehicle.odometer;
    const serviceStatus = serviceDue <= 0 ? "OVERDUE" : `${serviceDue.toLocaleString()} km`;

    const statusColors: Record<string, string> = {
      AVAILABLE: "#10b981",
      ON_TRIP: "#f59e0b",
      IN_SHOP: "#ef4444",
      RETIRED: "#6b7280",
    };

    // Create A-Frame scene with AR.js Pattern (Hiro marker - built-in)
    const scene = document.createElement("a-scene");
    scene.setAttribute(
      "arjs",
      "trackingMethod: best; sourceType: webcam; debugUIEnabled: false; detectionMode: mono; patternRatio: 0.5;"
    );
    scene.setAttribute("embedded", "");
    scene.setAttribute("renderer", "colorManagement: true; physicallyCorrectLights: true;");
    scene.setAttribute("vr-mode-ui", "enabled: false;");
    scene.style.width = "100%";
    scene.style.height = "100%";
    scene.style.position = "absolute";
    scene.style.top = "0";
    scene.style.left = "0";

    // Camera
    const camera = document.createElement("a-camera");
    camera.setAttribute("position", "0 0 0");
    camera.setAttribute("look-controls", "enabled: false;");
    scene.appendChild(camera);

    // Pattern marker entity (Hiro - built-in)
    const target = document.createElement("a-marker");
    target.setAttribute("type", "pattern");
    target.setAttribute("url", "https://raw.githack.com/AR-js-org/AR.js/master/aframe/examples/marker-training/examples/pattern-files/pattern-hiro.patt");
    target.setAttribute("smooth", "true");
    target.setAttribute("smoothCount", "10");
    target.setAttribute("smoothTolerance", "0.01");
    target.setAttribute("smoothThreshold", "5");

    // Background panel
    const panel = document.createElement("a-plane");
    panel.setAttribute("position", "0 0.3 0");
    panel.setAttribute("width", "1.8");
    panel.setAttribute("height", "1.5");
    panel.setAttribute("color", "#0f172a");
    panel.setAttribute("opacity", "0.92");
    panel.setAttribute("material", "side: double;");
    panel.setAttribute("visible", "false");
    target.appendChild(panel);

    // Registration text
    const regText = document.createElement("a-text");
    regText.setAttribute("value", selectedVehicle.regNo);
    regText.setAttribute("position", "0 0.65 0.02");
    regText.setAttribute("align", "center");
    regText.setAttribute("color", "#fff");
    regText.setAttribute("width", "3");
    regText.setAttribute("font", "https://cdn.aframe.io/fonts/Roboto-msdf.json");
    regText.setAttribute("visible", "false");
    target.appendChild(regText);

    // Status text
    const statusText = document.createElement("a-text");
    statusText.setAttribute("value", `Status: ${selectedVehicle.status}`);
    statusText.setAttribute("position", "0 0.3 0.02");
    statusText.setAttribute("align", "center");
    statusText.setAttribute("color", statusColors[selectedVehicle.status] || "#fff");
    statusText.setAttribute("width", "3");
    statusText.setAttribute("font", "https://cdn.aframe.io/fonts/Roboto-msdf.json");
    statusText.setAttribute("visible", "false");
    target.appendChild(statusText);

    // Odometer text
    const odoText = document.createElement("a-text");
    odoText.setAttribute("value", `Odometer: ${selectedVehicle.odometer.toLocaleString()} km`);
    odoText.setAttribute("position", "0 0.0 0.02");
    odoText.setAttribute("align", "center");
    odoText.setAttribute("color", "#94a3b8");
    odoText.setAttribute("width", "3");
    odoText.setAttribute("font", "https://cdn.aframe.io/fonts/Roboto-msdf.json");
    odoText.setAttribute("visible", "false");
    target.appendChild(odoText);

    // Service due text
    const serviceText = document.createElement("a-text");
    serviceText.setAttribute("value", `Next Service: ${serviceStatus}`);
    serviceText.setAttribute("position", "0 -0.3 0.02");
    serviceText.setAttribute("align", "center");
    serviceText.setAttribute("color", serviceDue <= 0 ? "#ef4444" : "#f59e0b");
    serviceText.setAttribute("width", "3");
    serviceText.setAttribute("font", "https://cdn.aframe.io/fonts/Roboto-msdf.json");
    serviceText.setAttribute("visible", "false");
    target.appendChild(serviceText);

    // Inspect button (transparent plane that triggers click)
    const inspectBtn = document.createElement("a-plane");
    inspectBtn.setAttribute("position", "0 -0.6 0.02");
    inspectBtn.setAttribute("width", "1.8");
    inspectBtn.setAttribute("height", "0.4");
    inspectBtn.setAttribute("color", "#3b82f6");
    inspectBtn.setAttribute("opacity", "0.9");
    inspectBtn.setAttribute("visible", "false");
    target.appendChild(inspectBtn);

    const btnText = document.createElement("a-text");
    btnText.setAttribute("value", "LOG INSPECTION");
    btnText.setAttribute("position", "0 -0.6 0.03");
    btnText.setAttribute("align", "center");
    btnText.setAttribute("color", "#fff");
    btnText.setAttribute("width", "2");
    btnText.setAttribute("font", "https://cdn.aframe.io/fonts/Roboto-msdf.json");
    btnText.setAttribute("visible", "false");
    target.appendChild(btnText);

    // Click handler for inspect button
    const handleClick = () => {
      if (onInspect) onInspect();
    };
    inspectBtn.addEventListener("click", handleClick);
    btnText.addEventListener("click", handleClick);

    // Pattern marker found/lost events
    target.addEventListener("markerFound", () => {
      setTargetFound(true);
      [panel, regText, statusText, odoText, inspectBtn].forEach((el) => {
        el.setAttribute("visible", "true");
      });
    });

    target.addEventListener("markerLost", () => {
      setTargetFound(false);
      [panel, regText, odoText, inspectBtn].forEach((el) => {
        el.setAttribute("visible", "false");
      });
    });

    scene.appendChild(target);
    container.appendChild(scene);

    return () => {
      if (scene.parentNode) scene.remove();
    };
  }, [scriptsLoaded, selectedVehicle, selectedVehicleId, onInspect]);

  if (!scriptsLoaded) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
        <div className="text-center text-white">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-400 mb-4" />
          <p>Loading AR engine...</p>
        </div>
      </div>
    );
  }

  if (!selectedVehicle) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
        <div className="text-center text-white p-8">
          <Truck className="mx-auto h-16 w-16 text-gray-500 mb-4" />
          <h3 className="text-xl font-medium mb-2">Select a Vehicle</h3>
          <p className="text-gray-400">Choose a vehicle from the panel below to start AR inspection</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={sceneRef} className="absolute inset-0" style={{ zIndex: 1 }} />
  );
}