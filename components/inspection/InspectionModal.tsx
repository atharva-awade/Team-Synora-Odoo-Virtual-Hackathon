"use client";

import { useState, useEffect } from "react";
import { X, Loader2, CheckCircle, AlertTriangle, Minus, Plus, AlertCircle } from "lucide-react";

interface Vehicle {
  vehicleId: string;
  regNo: string;
  name: string;
  status: string;
}

interface InspectionModalProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  onSubmit: (data: InspectionData) => Promise<void>;
}

interface InspectionData {
  tirePressureFl: number | null;
  tirePressureFr: number | null;
  tirePressureRl: number | null;
  tirePressureRr: number | null;
  fuelLevelPct: number | null;
  odometerReading: number | null;
  damageItems: DamageItem[];
  notes: string;
  overallStatus: "OK" | "ISSUES_FOUND" | "REQUIRES_MAINTENANCE";
}

interface DamageItem {
  id: string;
  location: string;
  severity: "MINOR" | "MODERATE" | "SEVERE";
  description: string;
}

const TIRE_POSITIONS = [
  { key: "tirePressureFl", label: "Front Left", icon: "FL" },
  { key: "tirePressureFr", label: "Front Right", icon: "FR" },
  { key: "tirePressureRl", label: "Rear Left", icon: "RL" },
  { key: "tirePressureRr", label: "Rear Right", icon: "RR" },
];

const SEVERITY_OPTIONS = [
  { value: "MINOR", label: "Minor", color: "bg-green-500/20 text-green-400" },
  { value: "MODERATE", label: "Moderate", color: "bg-yellow-500/20 text-yellow-400" },
  { value: "SEVERE", label: "Severe", color: "bg-red-500/20 text-red-400" },
];

export function InspectionModal({ vehicle, onClose, onSubmit }: InspectionModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<InspectionData>({
    tirePressureFl: null,
    tirePressureFr: null,
    tirePressureRl: null,
    tirePressureRr: null,
    fuelLevelPct: null,
    odometerReading: null,
    damageItems: [],
    notes: "",
    overallStatus: "OK",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (vehicle) {
      setFormData({
        tirePressureFl: null,
        tirePressureFr: null,
        tirePressureRl: null,
        tirePressureRr: null,
        fuelLevelPct: null,
        odometerReading: null,
        damageItems: [],
        notes: "",
        overallStatus: "OK",
      });
    }
  }, [vehicle]);

  const updateField = (key: keyof InspectionData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const addDamage = () => {
    setFormData((prev) => ({
      ...prev,
      damageItems: [
        ...prev.damageItems,
        { id: crypto.randomUUID(), location: "", severity: "MINOR", description: "" },
      ],
    }));
  };

  const removeDamage = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      damageItems: prev.damageItems.filter((d) => d.id !== id),
    }));
  };

  const updateDamage = (id: string, field: keyof DamageItem, value: any) => {
    setFormData((prev) => ({
      ...prev,
      damageItems: prev.damageItems.map((d) =>
        d.id === id ? { ...d, [field]: value } : d
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await onSubmit(formData);
      onClose();
    } catch (e: any) {
      setError(e.message || "Failed to submit inspection");
    } finally {
      setSubmitting(false);
    }
  };

  if (!vehicle) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <h2 className="text-xl font-semibold text-white">Log Inspection</h2>
            <p className="text-sm text-gray-400">
              {vehicle.regNo} - {vehicle.name} ({vehicle.status})
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-5">
          {/* Tire Pressures */}
          <fieldset className="border border-white/10 rounded-lg p-4">
            <legend className="text-sm font-medium text-gray-300 mb-3">Tire Pressures (PSI)</legend>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {TIRE_POSITIONS.map(({ key, label, icon }) => (
                <div key={key} className="bg-white/5 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500 mb-1">{label}</div>
                  <div className="text-lg font-mono font-bold text-blue-400">{icon}</div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={formData[key as keyof InspectionData] ?? ""}
                    onChange={(e) => updateField(key as keyof InspectionData, e.value ? parseFloat(e.value) : null)}
                    className="mt-2 w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="PSI"
                  />
                </div>
              ))}
            </div>
          </fieldset>

          {/* Fuel Level */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Fuel Level (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.fuelLevelPct ?? ""}
                onChange={(e) => updateField("fuelLevelPct", e.value ? parseInt(e.value) : null)}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0-100"
              />
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Odometer Reading (km)</label>
              <input
                type="number"
                min="0"
                value={formData.odometerReading ?? ""}
                onChange={(e) => updateField("odometerReading", e.value ? parseInt(e.value) : null)}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Current odometer"
              />
            </div>
          </div>

          {/* Damage Items */}
          <fieldset className="border border-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <legend className="text-sm font-medium text-gray-300">Damage / Issues</legend>
              <button type="button" onClick={addDamage} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                <Plus className="h-3 w-3" /> Add Item
              </button>
            </div>
            {formData.damageItems.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm bg-white/5 rounded-lg">
                No damage items recorded. Click "Add Item" to log any issues.
              </div>
            )}
            {formData.damageItems.map((item, index) => (
              <div key={item.id} className="bg-white/5 rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-gray-400">Item #{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeDamage(item.id)}
                    className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-gray-500 mb-1 block">Location</label>
                    <input
                      type="text"
                      value={item.location}
                      onChange={(e) => updateDamage(item.id, "location", e.target.value)}
                      placeholder="e.g., Rear bumper, Front left tire"
                      className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-500 mb-1 block">Severity</label>
                    <select
                      value={item.severity}
                      onChange={(e) => updateDamage(item.id, "severity", e.target.value as any)}
                      className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {SEVERITY_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 mb-1 block">Description</label>
                  <textarea
                    value={item.description}
                    onChange={(e) => updateDamage(item.id, "description", e.target.value)}
                    placeholder="Details about the damage..."
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
          </fieldset>

          {/* Notes */}
          <div>
            <label className="text-sm text-gray-300 mb-1 block">Additional Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Any other observations..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Overall Status */}
          <fieldset className="border border-white/10 rounded-lg p-4">
            <legend className="text-sm font-medium text-gray-300 mb-3">Overall Status</legend>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: "OK", label: "OK", icon: CheckCircle, color: "text-green-400 bg-green-500/20" },
                { value: "ISSUES_FOUND", label: "Issues Found", icon: AlertTriangle, color: "text-yellow-400 bg-yellow-500/20" },
                { value: "REQUIRES_MAINTENANCE", label: "Requires Maintenance", icon: AlertTriangle, color: "text-red-400 bg-red-500/20" },
              ]).map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => updateField("overallStatus", opt.value as any)}
                    className={`p-3 rounded-lg text-center transition-all flex flex-col items-center gap-1 ${
                      formData.overallStatus === opt.value
                        ? `ring-2 ${opt.color.replace("bg-", "ring-").replace("text-", "")}`
                        : "bg-white/5 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${opt.color.split(" ")[0]}`} />
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Error */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/5 text-gray-300 hover:bg-white/10 py-2.5 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Save Inspection
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}