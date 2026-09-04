/**
 * OceanVis-3D Argo Float Observations Dataset
 * Real-world format with Quality Controlled (D-Mode) flags
 * Distributed across Bay of Bengal & Northern Indian Ocean
 */

export const ARGO_PROFILES = [
  {
    id: "ARGO-2902142",
    wmo: "2902142",
    platform: "Apex Profiling Float",
    region: "North Bay of Bengal",
    locationDesc: "Ganges Plume Boundary Zone",
    latitude: 18.4,
    longitude: 89.2,
    timestamp: "2026-08-12 04:30 UTC",
    cycle: 142,
    quality: "Quality Controlled (D-Mode)",
    sensor: "Seabird SBE-41CP CTD",
    status: "Active - Delayed Mode QC",
    temperature: [
      { depth: 0, value: 28.35 },
      { depth: 10, value: 28.12 },
      { depth: 50, value: 26.20 },
      { depth: 100, value: 19.85 },
      { depth: 200, value: 13.40 },
      { depth: 500, value: 8.65 },
      { depth: 1000, value: 5.80 },
      { depth: 2000, value: 2.85 }
    ],
    salinity: [
      { depth: 0, value: 31.20 },
      { depth: 10, value: 32.10 },
      { depth: 50, value: 34.35 },
      { depth: 100, value: 35.08 },
      { depth: 200, value: 35.00 },
      { depth: 500, value: 34.85 },
      { depth: 1000, value: 34.76 },
      { depth: 2000, value: 34.70 }
    ]
  },
  {
    id: "ARGO-2901844",
    wmo: "2901844",
    platform: "Provor-CTS4 Bio-Argo",
    region: "Central Bay of Bengal",
    locationDesc: "Anticyclonic Warm-Core Eddy Center",
    latitude: 15.2,
    longitude: 88.4,
    timestamp: "2026-08-12 09:15 UTC",
    cycle: 87,
    quality: "Quality Controlled (D-Mode)",
    sensor: "SBE-41CP + DO + Fluorometer",
    status: "Active - Real-Time Passed",
    temperature: [
      { depth: 0, value: 29.80 },
      { depth: 10, value: 29.62 },
      { depth: 50, value: 28.40 },
      { depth: 100, value: 24.10 },
      { depth: 200, value: 15.90 },
      { depth: 500, value: 9.60 },
      { depth: 1000, value: 6.25 },
      { depth: 2000, value: 3.10 }
    ],
    salinity: [
      { depth: 0, value: 33.40 },
      { depth: 10, value: 33.70 },
      { depth: 50, value: 34.40 },
      { depth: 100, value: 35.25 },
      { depth: 200, value: 35.10 },
      { depth: 500, value: 34.89 },
      { depth: 1000, value: 34.79 },
      { depth: 2000, value: 34.72 }
    ]
  },
  {
    id: "ARGO-1042",
    wmo: "1042001",
    platform: "Apex Profiling Float",
    region: "Southwest Bay of Bengal",
    locationDesc: "Sri Lanka Dome Upwelling Margin",
    latitude: 11.2,
    longitude: 83.6,
    timestamp: "2026-08-12 11:45 UTC",
    cycle: 215,
    quality: "Quality Controlled (D-Mode)",
    sensor: "Seabird SBE-41CP",
    status: "Active - Validated",
    temperature: [
      { depth: 0, value: 28.10 },
      { depth: 10, value: 27.20 },
      { depth: 50, value: 23.40 },
      { depth: 100, value: 18.20 },
      { depth: 200, value: 12.80 },
      { depth: 500, value: 8.10 },
      { depth: 1000, value: 5.75 },
      { depth: 2000, value: 2.80 }
    ],
    salinity: [
      { depth: 0, value: 33.95 },
      { depth: 10, value: 34.25 },
      { depth: 50, value: 34.70 },
      { depth: 100, value: 35.15 },
      { depth: 200, value: 35.02 },
      { depth: 500, value: 34.86 },
      { depth: 1000, value: 34.77 },
      { depth: 2000, value: 34.71 }
    ]
  },
  {
    id: "ARGO-2903310",
    wmo: "2903310",
    platform: "Navis-BGC Auto Float",
    region: "Andaman Sea Basin",
    locationDesc: "Sub-surface Trench Profile",
    latitude: 12.1,
    longitude: 93.4,
    timestamp: "2026-08-11 18:20 UTC",
    cycle: 64,
    quality: "Quality Controlled (D-Mode)",
    sensor: "SBE-41N CTD + Radiometer",
    status: "Active - Validated",
    temperature: [
      { depth: 0, value: 29.40 },
      { depth: 10, value: 29.10 },
      { depth: 50, value: 27.50 },
      { depth: 100, value: 21.80 },
      { depth: 200, value: 14.50 },
      { depth: 500, value: 9.10 },
      { depth: 1000, value: 6.30 },
      { depth: 2000, value: 3.20 }
    ],
    salinity: [
      { depth: 0, value: 32.80 },
      { depth: 10, value: 33.30 },
      { depth: 50, value: 34.30 },
      { depth: 100, value: 35.05 },
      { depth: 200, value: 34.98 },
      { depth: 500, value: 34.84 },
      { depth: 1000, value: 34.78 },
      { depth: 2000, value: 34.72 }
    ]
  },
  {
    id: "ARGO-2902890",
    wmo: "2902890",
    platform: "Provor-CTS3 Profiler",
    region: "Western Boundary",
    locationDesc: "East India Coastal Current (EICC)",
    latitude: 16.5,
    longitude: 82.8,
    timestamp: "2026-08-12 02:10 UTC",
    cycle: 108,
    quality: "Quality Controlled (D-Mode)",
    sensor: "Seabird SBE-41CP",
    status: "Active - Validated",
    temperature: [
      { depth: 0, value: 27.90 },
      { depth: 10, value: 27.50 },
      { depth: 50, value: 24.10 },
      { depth: 100, value: 18.90 },
      { depth: 200, value: 13.10 },
      { depth: 500, value: 8.40 },
      { depth: 1000, value: 5.65 },
      { depth: 2000, value: 2.75 }
    ],
    salinity: [
      { depth: 0, value: 33.10 },
      { depth: 10, value: 33.60 },
      { depth: 50, value: 34.50 },
      { depth: 100, value: 35.18 },
      { depth: 200, value: 35.04 },
      { depth: 500, value: 34.87 },
      { depth: 1000, value: 34.77 },
      { depth: 2000, value: 34.70 }
    ]
  },
  {
    id: "ARGO-2901995",
    wmo: "2901995",
    platform: "Apex Profiling Float",
    region: "Southern Bay of Bengal",
    locationDesc: "Equatorial Inflow Zone",
    latitude: 8.8,
    longitude: 86.4,
    timestamp: "2026-08-11 23:05 UTC",
    cycle: 191,
    quality: "Quality Controlled (D-Mode)",
    sensor: "Seabird SBE-41CP",
    status: "Active - Validated",
    temperature: [
      { depth: 0, value: 29.60 },
      { depth: 10, value: 29.35 },
      { depth: 50, value: 27.90 },
      { depth: 100, value: 22.30 },
      { depth: 200, value: 14.80 },
      { depth: 500, value: 9.30 },
      { depth: 1000, value: 6.40 },
      { depth: 2000, value: 3.30 }
    ],
    salinity: [
      { depth: 0, value: 34.10 },
      { depth: 10, value: 34.35 },
      { depth: 50, value: 34.65 },
      { depth: 100, value: 35.22 },
      { depth: 200, value: 35.08 },
      { depth: 500, value: 34.88 },
      { depth: 1000, value: 34.79 },
      { depth: 2000, value: 34.73 }
    ]
  },
  {
    id: "ARGO-2902450",
    wmo: "2902450",
    platform: "Apex Deep Float (4000m)",
    region: "Central Abyssal Basin",
    locationDesc: "Central Deep Water Mooring Line",
    latitude: 13.8,
    longitude: 90.2,
    timestamp: "2026-08-12 14:00 UTC",
    cycle: 79,
    quality: "Quality Controlled (D-Mode)",
    sensor: "SBE-61 Deep CTD (Accuracy ±0.001°C)",
    status: "Active - Validated",
    temperature: [
      { depth: 0, value: 29.20 },
      { depth: 10, value: 28.95 },
      { depth: 50, value: 26.80 },
      { depth: 100, value: 20.70 },
      { depth: 200, value: 14.10 },
      { depth: 500, value: 8.85 },
      { depth: 1000, value: 6.05 },
      { depth: 2000, value: 2.95 }
    ],
    salinity: [
      { depth: 0, value: 33.60 },
      { depth: 10, value: 33.90 },
      { depth: 50, value: 34.55 },
      { depth: 100, value: 35.20 },
      { depth: 200, value: 35.05 },
      { depth: 500, value: 34.87 },
      { depth: 1000, value: 34.78 },
      { depth: 2000, value: 34.71 }
    ]
  },
  {
    id: "ARGO-2903120",
    wmo: "2903120",
    platform: "Provor-CTS4 Bio-Argo",
    region: "Off Visakhapatnam Shelf",
    locationDesc: "Continental Slope Transition",
    latitude: 17.2,
    longitude: 84.1,
    timestamp: "2026-08-12 07:50 UTC",
    cycle: 52,
    quality: "Quality Controlled (D-Mode)",
    sensor: "Seabird SBE-41CP + Chl-a",
    status: "Active - Validated",
    temperature: [
      { depth: 0, value: 28.60 },
      { depth: 10, value: 28.25 },
      { depth: 50, value: 25.40 },
      { depth: 100, value: 19.30 },
      { depth: 200, value: 13.50 },
      { depth: 500, value: 8.55 },
      { depth: 1000, value: 5.75 },
      { depth: 2000, value: 2.80 }
    ],
    salinity: [
      { depth: 0, value: 32.70 },
      { depth: 10, value: 33.15 },
      { depth: 50, value: 34.40 },
      { depth: 100, value: 35.12 },
      { depth: 200, value: 35.02 },
      { depth: 500, value: 34.86 },
      { depth: 1000, value: 34.77 },
      { depth: 2000, value: 34.71 }
    ]
  },
  {
    id: "ARGO-2904012",
    wmo: "2904012",
    platform: "Apex Profiler",
    region: "Northern Bay Shelf",
    locationDesc: "Off Odisha Coast",
    latitude: 19.5,
    longitude: 87.1,
    timestamp: "2026-08-12 01:20 UTC",
    cycle: 116,
    quality: "Quality Controlled (D-Mode)",
    sensor: "Seabird SBE-41CP",
    status: "Active - Validated",
    temperature: [
      { depth: 0, value: 28.15 },
      { depth: 10, value: 27.90 },
      { depth: 50, value: 25.80 },
      { depth: 100, value: 19.10 },
      { depth: 200, value: 13.20 },
      { depth: 500, value: 8.50 },
      { depth: 1000, value: 5.70 },
      { depth: 2000, value: 2.80 }
    ],
    salinity: [
      { depth: 0, value: 30.90 },
      { depth: 10, value: 31.85 },
      { depth: 50, value: 34.10 },
      { depth: 100, value: 35.02 },
      { depth: 200, value: 34.98 },
      { depth: 500, value: 34.84 },
      { depth: 1000, value: 34.76 },
      { depth: 2000, value: 34.70 }
    ]
  },
  {
    id: "ARGO-2903780",
    wmo: "2903780",
    platform: "Provor Profiler",
    region: "Off Chennai Coast",
    locationDesc: "Southern Western Boundary",
    latitude: 13.1,
    longitude: 81.8,
    timestamp: "2026-08-11 15:40 UTC",
    cycle: 163,
    quality: "Quality Controlled (D-Mode)",
    sensor: "Seabird SBE-41CP",
    status: "Active - Validated",
    temperature: [
      { depth: 0, value: 28.90 },
      { depth: 10, value: 28.50 },
      { depth: 50, value: 25.10 },
      { depth: 100, value: 19.60 },
      { depth: 200, value: 13.80 },
      { depth: 500, value: 8.70 },
      { depth: 1000, value: 5.90 },
      { depth: 2000, value: 2.90 }
    ],
    salinity: [
      { depth: 0, value: 33.70 },
      { depth: 10, value: 34.10 },
      { depth: 50, value: 34.60 },
      { depth: 100, value: 35.18 },
      { depth: 200, value: 35.04 },
      { depth: 500, value: 34.87 },
      { depth: 1000, value: 34.78 },
      { depth: 2000, value: 34.71 }
    ]
  }
];

export function getArgoById(id) {
  return ARGO_PROFILES.find(p => p.id === id) || ARGO_PROFILES[0];
}
