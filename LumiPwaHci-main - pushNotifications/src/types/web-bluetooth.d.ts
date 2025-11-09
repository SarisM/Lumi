// Minimal ambient declarations for Web Bluetooth to satisfy TypeScript
// Add more detailed typings or install @types/web-bluetooth for full coverage.

declare interface BluetoothRemoteGATTCharacteristic {
  writeValue(value: BufferSource): Promise<void>;
}

declare interface BluetoothRemoteGATTServer {
  connect(): Promise<BluetoothRemoteGATTServer>;
  getPrimaryService(uuid: string): Promise<any>;
}

declare interface BluetoothDevice extends EventTarget {
  gatt?: BluetoothRemoteGATTServer;
  name?: string | null;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

declare interface Navigator {
  bluetooth?: any;
}
