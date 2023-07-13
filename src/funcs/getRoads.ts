import * as L from 'leaflet';
import { getRandomColorSmart } from '../utils';
import { selectionRoad } from './selectionRoad';
import "leaflet-arrowheads/src/index";

function getRoads({ roads, stdRoads }) {
  const polylineGroup = L.layerGroup();
  for (const road of roads) {
    const coords = road.geometry.coordinates.map((item) => {
      const res = [];
      res.push(item[1], item[0]);
      return res;
    });

    const color = getRandomColorSmart();

    // @ts-ignore - кастомное свойство для удобства взаимодействия с элементом
    const pln = L.polyline(coords,{ color, weight: 6, pane: 'roads', road_num: road.number, road_name: road.name, init_color: color })
        .arrowheads({ size: '12px', frequency: 'endonly', color })

    pln.bindTooltip(`<span style="font-weight:bold">${road.number}</span>`, { permanent: true, className: 'leaflet-tooltip-own', pane: 'roads' }).openTooltip();

    pln.on('click', (e) => {
      e.originalEvent.preventDefault();
      e.originalEvent.stopPropagation();

      L.DomEvent.disableClickPropagation(e.sourceTarget);

      selectionRoad({ pln, stdRoads });
    });

    polylineGroup.addLayer(pln);
  }
  return polylineGroup;
}

export { getRoads };
