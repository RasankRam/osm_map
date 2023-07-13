import * as L from 'leaflet';
import {getRandomColorSmart} from '../utils';
import {selectionPicket} from './selectionPicket';
import type { PolylineOptions } from "leaflet";

function getPickets({ pickets, stdPickets }: { pickets, stdPickets }) {
  const polygonGroup = L.featureGroup();

  for (const picket of pickets) {
    const coords = picket.geometry.coordinates.map((item) => {
      const res = [];
      res.push(item[1], item[0]);
      return res;
    })

    const color = getRandomColorSmart();

    const plgn  = L.polyline(coords, { color, weight: 6, pane: 'pickets', road_name: picket.road_name,
      road_num: picket.road_num, picket_id: picket.picket_id, init_color: color } as PolylineOptions);

    plgn.on('click', (e) => {
      e.originalEvent.preventDefault();
      e.originalEvent.stopPropagation();

      L.DomEvent.disableClickPropagation(e.sourceTarget);

      selectionPicket({ pln: e.sourceTarget, stdPickets});
    })

    polygonGroup.addLayer(plgn);
  }
  return polygonGroup;
}

export { getPickets };
