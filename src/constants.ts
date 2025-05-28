
export interface FirmwareOption {
  name: string;
  url: string;
  flash_address: number;
}

export function findFirmwareKeyByName(name: string): string {
  let res = Object.entries(firmwareOptions).find(
    ([_, option]) => option.name === name
  );
  if (res===undefined){
    throw new Error(`Unable to find firmware for: ${name}`);
  }
  return res[0]
}

export const firmwareOptions: Record<string, FirmwareOption> = {
  'auto': {
    name: 'Auto detection',
    url: '',
    flash_address: 0x0
  },
  'esp32': {
    name: 'ESP32',
    url: '../files/binaries/ESP32_GENERIC-20250415-v1.25.0.bin',
    flash_address: 0x1000
  },
  'esp32-s2': {
    name: 'ESP32-S2',
    url: '../files/binaries/ESP32_GENERIC_S2-20250415-v1.25.0.bin',
    flash_address: 0x1000
  },
  'esp32-s3': {
    name: 'ESP32-S3',
    url: '../files/binaries/ESP32_GENERIC_S3-20250415-v1.25.0.bin',
    flash_address: 0x0
  },
  'esp32-c3': {
    name: 'ESP32-C3',
    url: '../files/binaries/ESP32_GENERIC_C3-20241129-v1.24.1.bin',
    flash_address: 0x0
  },
  'esp32-c6': {
    name: 'ESP32-C6',
    url: '../files/binaries/ESP32_GENERIC_C6-20250415-v1.25.0.bin',
    flash_address: 0x0
  }
};

