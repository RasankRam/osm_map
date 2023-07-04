import * as L from 'leaflet';
import {selectPicket, unselectPicket} from './selectionPicket';
import {selectRoad, unselectRoad} from './selectionRoad';

let handleMouseMoveWrap;
let handleMouseUpWrap;

function handleRectSelection({ event, stdPickets, stdRoads, map, roadsLayer, picketsLayer }) {
  event.originalEvent.preventDefault();

  if (event.originalEvent.button === 2) {
    const startPoint = event.latlng; // Store the starting position of the selection
    let rectLayerObj = { };

    const instdPickets = [];
    const instdRoads = [];

    handleMouseMoveWrap = handleMouseMove.bind(null, { startPoint, map, rectLayerObj, instdPickets, instdRoads, roadsLayer,
                                                      picketsLayer, stdPickets, stdRoads });
    handleMouseUpWrap = handleMouseUp.bind(null, { map, rectLayerObj, handleMouseMoveWrap, handleMouseUpWrap });

    map.on('mousemove', handleMouseMoveWrap);

    document.addEventListener('mouseup', handleMouseUpWrap);
  }
}

function handleMouseMove({ startPoint, map, rectLayerObj, instdPickets, instdRoads, roadsLayer, picketsLayer,
                          stdPickets, stdRoads }, event) {

  const endPoint = event.latlng;

  const newlyinstdPickets = [];
  const newlyinstdRoads = [];

  if (rectLayerObj.layer === undefined) {
    rectLayerObj.layer = L.rectangle([startPoint, endPoint], { color: '#1f1f1f', weight: 2, fillOpacity: 0 }).addTo(map);
  } else if (rectLayerObj.layer) {
    rectLayerObj.layer.setBounds(L.latLngBounds(startPoint, endPoint));
    const bounds = rectLayerObj.layer.getBounds();

    if (roadsLayer.value.getLayers()[0].getElement().closest('.leaflet-roads-pane').style.display === '') {
      roadsLayer.value.eachLayer((pln) => {
        if (pln.getBounds().intersects(bounds)) {
          newlyinstdRoads.push(pln);
        }
      })
    }

    if (picketsLayer.value.getLayers()[0].getElement().closest('.leaflet-pickets-pane').style.display === '') {

      picketsLayer.value.eachLayer((pln) => {
        if (pln.getBounds().intersects(bounds)) {
          newlyinstdPickets.push(pln);
        }
      })
    }

    instdPickets.forEach((pln) => {
      if (!newlyinstdPickets.includes(pln)) {
        unselectPicket({ pln, stdPickets });
      }
    })

    instdRoads.forEach((pln) => {
      if (!newlyinstdRoads.includes(pln)) {
        unselectRoad({ pln, stdRoads });
      }
    })

    newlyinstdPickets.forEach((pln) => {
      if (!instdPickets.includes(pln)) {
        selectPicket({ pln, stdPickets });
      }
    });

    newlyinstdRoads.forEach((pln) => {
      if (!instdRoads.includes(pln)) {
        selectRoad({ pln, stdRoads });
      }
    })

    instdPickets.splice(0, instdPickets.length);
    instdPickets.push(...newlyinstdPickets);
    instdRoads.splice(0, instdRoads.length);
    instdRoads.push(...newlyinstdRoads);
  }
}

function handleMouseUp({ map, rectLayerObj }) {

  document.removeEventListener('mouseup', handleMouseUpWrap);
  map.off('mousemove', handleMouseMoveWrap);

  clearRectangle({ map, rectLayerObj });
}

// Function to clear the rectangle layer and reset polyline styles
function clearRectangle({ map, rectLayerObj }){
  if(rectLayerObj.layer){
    map.removeLayer(rectLayerObj.layer);
    rectLayerObj.layer = null;
  }
}

export { handleRectSelection }
