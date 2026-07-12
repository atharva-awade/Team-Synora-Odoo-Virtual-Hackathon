-- CreateTable
CREATE TABLE "VehicleInspection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "inspectorId" TEXT NOT NULL,
    "tirePressureFl" INTEGER,
    "tirePressureFr" INTEGER,
    "tirePressureRl" INTEGER,
    "tirePressureRr" INTEGER,
    "fuelLevelPct" INTEGER,
    "odometerReading" INTEGER,
    "damageItems" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "overallStatus" TEXT NOT NULL DEFAULT 'OK',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VehicleInspection_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VehicleArTarget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "pngData" BLOB NOT NULL,
    "mindData" BLOB,
    "targetGeneratedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VehicleArTarget_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "VehicleArTarget_vehicleId_key" ON "VehicleArTarget"("vehicleId");
