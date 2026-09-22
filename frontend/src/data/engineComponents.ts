export interface EngineComponentDef {
  id: string;
  name: string;
  category: 'combustion' | 'cooling' | 'lubrication' | 'fuel' | 'air' | 'electrical' | 'mechanical';
  description: string;
  telemetryKeys: string[];
  nominalRange: string;
  position3D: [number, number, number]; // [x, y, z] for 3D model positioning
  scale3D: [number, number, number];
}

export const ENGINE_COMPONENTS: EngineComponentDef[] = [
  {
    id: 'cylinders',
    name: 'Cylinder Heads (1-4)',
    category: 'combustion',
    description: 'Opposed 4-cylinder architecture with dual ignition and ram-air cooling',
    telemetryKeys: ['cht_celsius', 'rpm'],
    nominalRange: '80 - 120 °C',
    position3D: [0, 0.4, 0],
    scale3D: [2.2, 0.8, 1.2],
  },
  {
    id: 'crankcase',
    name: 'Crankcase & Rotating Assembly',
    category: 'mechanical',
    description: 'Dry sump lubrication casing and forged crankshaft with reduction gearbox',
    telemetryKeys: ['vibration', 'rpm'],
    nominalRange: '< 0.05 g RMS',
    position3D: [0, 0, 0],
    scale3D: [1.8, 1.0, 1.4],
  },
  {
    id: 'cooling',
    name: 'Liquid/Air Cooling Radiator',
    category: 'cooling',
    description: 'Cylinder head liquid cooling jacket and fuselage ram-air ducting',
    telemetryKeys: ['cht_celsius', 'airspeed_kts'],
    nominalRange: 'Max 135 °C Limit',
    position3D: [0, 0.6, 1.2],
    scale3D: [1.4, 0.6, 0.3],
  },
  {
    id: 'lubrication',
    name: 'Oil Sump & Pressure Circuit',
    category: 'lubrication',
    description: 'Engine dry-sump oil pump, external tank, and thermostatic bypass',
    telemetryKeys: ['oil_pressure_bar', 'oil_temp_celsius'],
    nominalRange: '2.0 - 5.0 bar / 90 - 110 °C',
    position3D: [0, -0.6, -0.2],
    scale3D: [1.2, 0.5, 1.0],
  },
  {
    id: 'fuel',
    name: 'Fuel Injection Rail & Injectors',
    category: 'fuel',
    description: 'Dual fuel rail with electronic port injectors and dynamic pulse-width timing',
    telemetryKeys: ['fuel_flow', 'injection_timing_deg'],
    nominalRange: '15 - 18 L/hr (Cruise)',
    position3D: [0, 0.8, -0.4],
    scale3D: [1.6, 0.2, 0.4],
  },
  {
    id: 'exhaust',
    name: 'Exhaust Header & Collectors',
    category: 'combustion',
    description: '4-into-1 stainless steel exhaust collector with EGT thermocouple probes',
    telemetryKeys: ['egt_celsius'],
    nominalRange: '650 - 800 °C',
    position3D: [0, -0.3, 0.9],
    scale3D: [1.5, 0.4, 0.8],
  },
  {
    id: 'intake',
    name: 'Air Intake & MAP Manifold',
    category: 'air',
    description: 'Air filter plenum, throttle body, and manifold pressure sensor port',
    telemetryKeys: ['map_inhg', 'throttle_position'],
    nominalRange: '24 - 29 inHg',
    position3D: [0, 0.7, 0.5],
    scale3D: [0.8, 0.4, 0.6],
  },
  {
    id: 'electrical',
    name: 'Alternator & 14V Bus',
    category: 'electrical',
    description: '250W internal generator, regulator/rectifier, and UAV avionics supply',
    telemetryKeys: ['battery_voltage_v'],
    nominalRange: '13.8 - 14.2 V',
    position3D: [0, -0.1, -1.0],
    scale3D: [0.6, 0.6, 0.5],
  },
];
