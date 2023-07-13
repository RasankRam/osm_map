import * as L from 'leaflet';
import {handleRectSelection} from './mouseHandles';


export function getMap({ ctxMenuCoords, mousePosition, stdPickets, stdRoads, roadsLayer, picketsLayer, msgBox, showContextMenu }) {
  const map = L.map('mapid').setView([48.952, 142.181], 14);

  map.on('keydown', (e) => {
    // Get pageX and pageY coordinates of cursor from original mouse event
    if (e.originalEvent.code === 'KeyM') {
      ctxMenuCoords.left = mousePosition.x + 'px';
      ctxMenuCoords.top = mousePosition.y + 'px';

      // Show the context menu
      if (stdPickets.value.length || stdRoads.value.length) {
        showContextMenu.value = true;
      }
    }
  })

  map.on('contextmenu', function(e) {

    if (e.originalEvent.button === 2) {
      e.originalEvent.preventDefault();
      e.originalEvent.stopPropagation();
    }
  });

  map.on('mousedown', (e) => {
    if (e.originalEvent.button === 2) {
      e.originalEvent.preventDefault();
      e.originalEvent.stopPropagation();

      handleRectSelection({ event: e, stdPickets, stdRoads, map, roadsLayer, picketsLayer });
    }
  });

  map.on('click', (e) => {
    const target = e.originalEvent.target as HTMLElement;

    if (!target.closest('.leaflet-roads-pane') && !target.closest('.leaflet-pickets-pane')) {
      if (stdPickets.value.length) {
        stdPickets.value.forEach((pln) => {
          pln.setStyle({ color: pln.options.init_color })
          setTimeout(() => pln.redraw());
        })
      }
      if (stdRoads.value.length) {
        stdRoads.value.forEach((pln) => {
          pln.setStyle({ color: pln.options.init_color }).arrowheads({ ...pln._arrowheadOptions, color: pln.options.init_color });
          setTimeout(() => pln.redraw());
        })
      }
      stdPickets.value = [];
      stdRoads.value = [];
      msgBox.value.hide();
      showContextMenu.value = false;
    }
  })

  return map;
}
