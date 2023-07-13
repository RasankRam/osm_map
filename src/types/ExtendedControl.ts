import {Control} from "leaflet";

interface ExtendedControl extends Control {
  show(): void;
  hide(): void;
  setContent(content: string): void;
}

export default ExtendedControl;
