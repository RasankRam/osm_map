import * as L from 'leaflet';
import { renderLayerModePane } from './renderLayerModePane';

function registerChgModeBtn(workMode, { roadPane, picketsPane, picketsLayer, map, stdRoads }) {
  // @ts-ignore
  const chgBtn = L.control({ position: 'topright' });

  chgBtn.onAdd = function () {
    const container = L.DomUtil.create('button', 'msg-box-wrap msg-box-wrap_chgMode');

    const mainContent = L.DomUtil.create('div', 'msg-box', container);

    const button = L.DomUtil.create('span', '', mainContent);

    renderLayerModePane({ button, workMode,
      roadPaneStyle: roadPane.style, picketPaneStyle: picketsPane.style, picketsLayer, stdRoads });

    L.DomEvent.on(container, 'click', function(e) {
      renderLayerModePane({ button, workMode,
        roadPaneStyle: roadPane.style, picketPaneStyle: picketsPane.style, picketsLayer, stdRoads })

      e.preventDefault();
      e.stopPropagation();

      L.DomEvent.disableClickPropagation(container);
    });

    return container;
  }

  chgBtn.addTo(map);
}

export { registerChgModeBtn };
