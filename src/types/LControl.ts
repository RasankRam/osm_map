import { Control as MyControl } from "leaflet";

interface ExtendedControl extends MyControl {
  show(): void;
  hide(): void;
  setContent(content: string): void;
}

interface LControl {
  value?: ExtendedControl;
}

export type { LControl }
