import * as L from 'leaflet';
import { LControl } from "../types/LControl.ts";
import type { Map } from 'leaflet';

function registerMsgBox(variable: LControl, { map }: { map: Map }) {
  // @ts-ignore
  const msgBox = L.control(({ position: 'bottomleft' }));

  msgBox.onAdd = function () {
    const container = L.DomUtil.create('div', 'msg-box-wrap');

    const mainContent = L.DomUtil.create('div', 'msg-box msg-box_dataBox', container);

    mainContent.innerHTML = 'asdf';

    container.style.display = 'none';

    this._container = container;
    this._mainContent = mainContent;

    return container;
  }

  msgBox.setContent = function(content) {
    if (this._container) {
      this._mainContent.innerHTML = content;
    }
  }

  msgBox.show = function() {
    this._container.style.display = '';
  }

  msgBox.hide = function () {
    this._container.style.display = 'none';
  }

  variable.value = msgBox;

  msgBox.addTo(map);
}

export { registerMsgBox };
