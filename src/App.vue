<template>
  <div>
    <a href="https://vitejs.dev" target="_blank">
      <img src="/vite.svg" class="logo" alt="Vite logo" />
    </a>
    <a href="https://vuejs.org/" target="_blank">
      <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
    </a>
  </div>
  <HelloWorld msg="Vite + Vue" />

  <div style="height: 500px;width:500px;" id="mapid"></div>

</template>

<script setup>
import HelloWorld from './components/HelloWorld.vue'
import { onMounted, onUnmounted } from 'vue';
import * as L from 'leaflet';
import LUtil from 'leaflet-geometryutil';
import * as turf from '@turf/turf'

import "leaflet-arrowheads";
import roads from './roads.json';
import pickets from './pickets.json';

const stdPolylines = [];

function sleep (ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getRandomColorSmart() {
  var colors = ['#C25865', '#4f9787', '#42AA85', '#FFC875', '#B467A3', '#3AB2F6', 'orange'];

  // Создаем массив для хранения уже использованных цветов
  if (!getRandomColorSmart.usedColors) {
    getRandomColorSmart.usedColors = [];
  }
  if (!getRandomColorSmart.firstThreeElems) {
    getRandomColorSmart.firstThreeElems = [];
  }

  // Проверяем, все ли цвета были использованы
  if (getRandomColorSmart.usedColors.length === colors.length) {
    getRandomColorSmart.firstThreeElems = getRandomColorSmart.usedColors.slice(0, 3);
    // Если все цвета были использованы, обнуляем список используемых и начинаем сначала
    getRandomColorSmart.usedColors = [];
  }

  if (getRandomColorSmart.firstThreeElems.length > 0 && getRandomColorSmart.firstThreeElems.length === getRandomColorSmart.usedColors.length) {
    getRandomColorSmart.firstThreeElems = [];
  }

  var availableColors = colors.filter(function(color) {
    return !getRandomColorSmart.usedColors.includes(color) && !getRandomColorSmart.firstThreeElems.includes(color);
  });

  var randomIndex = Math.floor(Math.random() * availableColors.length);

  // Получаем случайный неиспользованный цвет из доступных
  var randomColor = availableColors[randomIndex];

  // Добавляем выбранный цвет в список уже использованных
  getRandomColorSmart.usedColors.push(randomColor);

  return randomColor;
}

function selectPolyline(pln, map) {
  pln.setStyle({ color: 'black' }).arrowheads({ ...pln._arrowheadOptions, color: 'black' })
  setTimeout(() => {
    pln.redraw();
  })
  if (!stdPolylines.includes(pln)) {
    stdPolylines.push(pln);
  } else {
    const plnIdx = stdPolylines.indexOf(pln);
    if (plnIdx > -1) {
      pln.setStyle({ color: pln.options.init_color }).arrowheads({ ...pln._arrowheadOptions, color: pln.options.init_color });
      stdPolylines.splice(plnIdx, 1);
    }
  }
}

function getRoads(roads, mymap) {
  const polylineGroup = L.layerGroup();
  for (const road of roads) {
    const coords = road.geometry.coordinates.map((item) => {
      const res = [];
      res.push(item[1], item[0]);
      return res;
    });

    const color = getRandomColorSmart();

    const pln = L.polyline(coords,
        { color, weight: 6, pane: 'roads', road_num: road.number, road_name: road.name, init_color: color })
        .arrowheads({ size: '5px', frequency: 'endonly', color })

    pln.bindTooltip(`<span style="font-weight:bold">${road.number}</span>`, { permanent: true, className: 'leaflet-tooltip-own', pane: 'roads' }).openTooltip();

    pln.on('click', (e) => {
      e.originalEvent.preventDefault();
      e.originalEvent.stopPropagation();

      L.DomEvent.disableClickPropagation(e.sourceTarget);

      selectPolyline(pln, mymap);
      // reversePolyline(e, pln)
    });

    polylineGroup.addLayer(pln);
  }
  return polylineGroup;
}

function getPickets(pickets, mymap) {
  const polygonGroup = L.featureGroup();
  for (const picket of pickets) {
    const coords = picket.geometry.coordinates.map((item) => {
      const res = [];
      res.push(item[1], item[0]);
      return res;
    })

    const plgn = L.polyline(coords, { color: getRandomColorSmart(), weight: 6, pane: 'pickets', road_name: picket.road_name });

    polygonGroup.addLayer(plgn);
  }
  return polygonGroup;
}

function doBoundingBoxesOverlap(boundsA, boundsB) {
  return boundsA.overlaps(boundsB);
}

function checkIntersected(picketsLayer, stdPolylines, map) {

  const roadNames = stdPolylines.map((i) => i.options.road_name);

  stdPolylines.forEach((pln) => {

    console.log('pln.options', pln.options);


    // const boundStdPln = pln.getBounds();

    picketsLayer.eachLayer((layer) => {

      if (!roadNames.includes(layer.options.road_name)) {
        layer.setStyle({ opacity: 0 })
      }


      // const boundPicketPln = layer.getBounds();
      //
      // const isIntersecting = boundStdPln.overlaps(boundPicketPln);
      //
      // if (isIntersecting) {
      //   layer.setStyle({ color: 'red' });
      //   pln.setStyle({ color: 'red' })
      // }


    })
  })
}

function renderLayerModePane(map, { button, roadPaneStyle, picketPaneStyle, roadsLayer, picketsLayer }) {
  console.log('roadsPaneStyle', roadPaneStyle);
  if (!roadPaneStyle.display) {
    checkIntersected(picketsLayer, stdPolylines, map);
    button.innerHTML = 'Режим редактирования';
    roadPaneStyle.display = 'none';
    picketPaneStyle.display = '';
  } else if (!picketPaneStyle.display) {
    picketsLayer.eachLayer(((layer) => layer.setStyle({ opacity: 1 })))
    button.innerHTML = 'Режим чтения';
    picketPaneStyle.display = 'none';
    roadPaneStyle.display = '';
  } else {
    button.innerHTML = 'Режим чтения';
    roadPaneStyle.display = '';
  }
}

function reversePolyline(e, pln) {
  const reversedLatLngs = pln.getLatLngs();
  reversedLatLngs.reverse();
  pln.setLatLngs(reversedLatLngs);

  const changedRoadNum = pln.options.road_num * -1;
  pln.options.road_num = changedRoadNum;

  pln.getTooltip().setContent(`<span style="font-weight:bold">${changedRoadNum}</span>`);
}

let mymap;

onMounted(() => {
  mymap = L.map('mapid').setView([48.952, 142.181], 14);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(mymap);

  const roadPane = mymap.createPane('roads');
  const picketsPane = mymap.createPane('pickets');

  const picketsLayer = getPickets(pickets, mymap);
  const roadsLayer = getRoads(roads, mymap);

  picketsLayer.addTo(mymap);
  roadsLayer.addTo(mymap);
  roadPane.style.display = 'none';
  picketsPane.style.display = 'none';

  const MyControl = L.Control.extend({
    onAdd: function(map) {
      const container = L.DomUtil.create('div', 'disable-zoom-control');

      const button = L.DomUtil.create('button', '', container);

      renderLayerModePane(mymap, { button, roadPaneStyle: roadPane.style, picketPaneStyle: picketsPane.style, picketsLayer });

      L.DomEvent.on(button, 'click', function(e) {
        renderLayerModePane(mymap, { button, roadPaneStyle: roadPane.style, picketPaneStyle: picketsPane.style, picketsLayer })

        e.preventDefault();
        e.stopPropagation();

        L.DomEvent.disableClickPropagation(container);
      });

      return container;
    },

    onRemove: function(map) {
      // Remove any listeners, cleanup DOM elements, etc.
    }
  });

  const myControl = new MyControl({ position: 'topright' }).addTo(mymap);

});

onUnmounted(() => {
  mymap.eachLayer(function (layer) {
    mymap.removeLayer(layer);
  });
  mymap.remove();
})
</script>

<style>
.leaflet-tooltip-left:before {
  right: 0;
  margin-right: -12px;
  border-left-color: rgba(0, 0, 0, 0.4);
}
.leaflet-tooltip-right:before {
  left: 0;
  margin-left: -12px;
  border-right-color: rgba(0, 0, 0, 0.4);
}
.leaflet-tooltip-own {
  z-index:999;
  padding: 4px;
  background-color: transparent;
  border: 0px solid #000;
  color: #000;
  white-space: nowrap;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  pointer-events: none;
  box-shadow: none;
}

.leaflet-tooltip-top:before,
.leaflet-tooltip-bottom:before,
.leaflet-tooltip-left:before,
.leaflet-tooltip-right:before {
  border: none !important;
}



.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
