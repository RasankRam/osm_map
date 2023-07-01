<template>
  <div>
  <div style="height: 500px;width:500px;user-select:none" id="mapid"></div>

    <div v-show="showContextMenu" id="context-menu-list-wrap" :style="ctxMenuCoords">
      <ul @click="showContextMenu = false" class="context-menu-list">
        <li v-for="elem in contextMenu" :key="elem.text" @click="elem.onClick" style="text-align:left;list-style:none;">{{ elem.text }}</li>
      </ul>
    </div>

  </div>
</template>

<script setup>
import HelloWorld from './components/HelloWorld.vue'
import { onMounted, onUnmounted, ref, computed, reactive } from 'vue';
import * as L from 'leaflet';
import LUtil from 'leaflet-geometryutil';
import * as turf from '@turf/turf'

import "leaflet-arrowheads";
import roads from './roads.json';
import pickets from './pickets.json';

let stdPolylines = ref([]);
let stdPickets = ref([]);

function getCtxMenuCoordsFabric() {
  return { top: '0px', left: '0px' };
}

let handleMouseMoveWrap;
let handleMouseUpWrap;
let msgBox = {};
const workMode = ref();
const showContextMenu = ref(false);
const ctxMenuCoords = reactive(getCtxMenuCoordsFabric())

const contextMenu = computed(() => {
  if(!showContextMenu.value) return [];

  const res = [];

  console.log('workMode', workMode);

  if (workMode.value === 'view') {

    if (stdPolylines.value.length) {
      res.push({
        text: 'Поменять направление',
        onClick: () => {
          stdPolylines.value.forEach((pln) => reversePolyline(pln));
        }
      })
    }

    return res;
  } else if (workMode.value === 'editing') {

    console.log('stdPickets', stdPickets.value);

    if (stdPickets.value.length) {
      res.push({
        text: 'Добавить комментарий',
        onClick: () => {
          prompt('Введите комментарий для пикетов')
        }
      })
    }

    return res;
  }
  return [];
})

function sleep (ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getRandomColorSmart() {
  const colors = ['#C25865', '#4f9787', '#42AA85', '#FFC875', '#B467A3', '#3AB2F6', 'orange'];

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

  const availableColors = colors.filter(function(color) {
    return !getRandomColorSmart.usedColors.includes(color) && !getRandomColorSmart.firstThreeElems.includes(color);
  });

  const randomIndex = Math.floor(Math.random() * availableColors.length);

  // Получаем случайный неиспользованный цвет из доступных
  const randomColor = availableColors[randomIndex];

  // Добавляем выбранный цвет в список уже использованных
  getRandomColorSmart.usedColors.push(randomColor);

  return randomColor;
}

function selectionPolyline(pln) {
  if (!stdPolylines.value.includes(pln)) {
    selectPolyline(pln);
  } else {
    unselectPolyline(pln);
  }
}

function selectPolyline(pln) {
  pln.setStyle({ color: 'black' }).arrowheads({ ...pln._arrowheadOptions, color: 'black' })
  stdPolylines.value.push(pln);
  setTimeout(() => pln.redraw())
}

function unselectPolyline(pln) {
  const plnIdx = stdPolylines.value.indexOf(pln);
  if (plnIdx > -1) {
    pln.setStyle({ color: pln.options.init_color }).arrowheads({ ...pln._arrowheadOptions, color: pln.options.init_color });
    stdPolylines.value.splice(plnIdx, 1);
    setTimeout(() => pln.redraw())
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
        .arrowheads({ size: '12px', frequency: 'endonly', color })

    pln.bindTooltip(`<span style="font-weight:bold">${road.number}</span>`, { permanent: true, className: 'leaflet-tooltip-own', pane: 'roads' }).openTooltip();

    pln.on('click', (e) => {
      e.originalEvent.preventDefault();
      e.originalEvent.stopPropagation();

      L.DomEvent.disableClickPropagation(e.sourceTarget);

      selectionPolyline(pln);
      if (stdPolylines.value.length) {
        msgBox.value.show();
        msgBox.value.setContent(`Выбрано дорог: ${stdPolylines.value.length}`)
      } else {
        msgBox.value.hide();
      }
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

    const color = getRandomColorSmart();

    const plgn = L.polyline(coords, { color, weight: 6, pane: 'pickets', road_name: picket.road_name, init_color: color });

    plgn.on('click', (e) => {
      e.originalEvent.preventDefault();
      e.originalEvent.stopPropagation();

      L.DomEvent.disableClickPropagation(e.sourceTarget);

      selectionPicket(e.sourceTarget, stdPickets);
      if (stdPickets.value.length) {
        msgBox.value.show();
        msgBox.value.setContent(`Выбранных пикетов: ${stdPickets.value.length}`)
      } else {
        msgBox.value.hide();
      }
    })

    polygonGroup.addLayer(plgn);
  }
  return polygonGroup;
}

function checkIntersected(picketsLayer, stdPolylines) {

  const roadNames = stdPolylines.value.map((i) => i.options.road_name);

  stdPolylines.value.forEach((pln) => {

    picketsLayer.eachLayer((layer) => {

      if (!roadNames.includes(layer.options.road_name)) {
        layer.getElement().style.display = 'none';
      }

    })
  })
}

function renderLayerModePane(map, { button, roadPaneStyle, workMode, picketPaneStyle, roadsLayer, picketsLayer }) {
  console.log('roadsPaneStyle', roadPaneStyle);
  if (!roadPaneStyle.display) {
    checkIntersected(picketsLayer, stdPolylines);
    button.innerHTML = 'Режим редактирования';
    workMode.value = 'editing';
    roadPaneStyle.display = 'none';
    picketPaneStyle.display = '';
  } else if (!picketPaneStyle.display) {
    picketsLayer.eachLayer(((layer) => layer.getElement().style.display = ''))
    button.innerHTML = 'Режим чтения';
    workMode.value = 'view';
    picketPaneStyle.display = 'none';
    roadPaneStyle.display = '';
  } else {
    button.innerHTML = 'Режим чтения';
    workMode.value = 'view';
    roadPaneStyle.display = '';
  }
}

function reversePolyline(pln) {
  const reversedLatLngs = pln.getLatLngs();
  reversedLatLngs.reverse();
  pln.setLatLngs(reversedLatLngs);

  const changedRoadNum = pln.options.road_num * -1;
  pln.options.road_num = changedRoadNum;

  pln.getTooltip().setContent(`<span style="font-weight:bold">${changedRoadNum}</span>`);
}

function handleRectSelection(e, map) {
  e.originalEvent.preventDefault();

  if (e.originalEvent.button === 2) {
    const startPoint = e.latlng; // Store the starting position of the selection
    let rectLayerObj = { };

    const instdElems = [];

    handleMouseMoveWrap = handleMouseMove.bind(null, startPoint, map, rectLayerObj, instdElems);
    handleMouseUpWrap = handleMouseUp.bind(null, map, rectLayerObj, stdPickets);

    map.on('mousemove', handleMouseMoveWrap);

    document.addEventListener('mouseup', handleMouseUpWrap);
  }
}

// Event handler for mousemove event while making the selection
function handleMouseMove(startPoint, map, rectLayerObj, instdElems, event) {

  const endPoint = event.latlng;

  const newlyInstdElems = [];

  if (rectLayerObj.layer === undefined) {
    rectLayerObj.layer = L.rectangle([startPoint, endPoint], { color: '#1f1f1f', weight: 2, fillOpacity: 0 }).addTo(map);
  } else if (rectLayerObj.layer) {
    rectLayerObj.layer.setBounds(L.latLngBounds(startPoint, endPoint));
    const bounds = rectLayerObj.layer.getBounds();
    map.eachLayer(function(layer){
      if (layer instanceof L.Polyline && layer.options.pane === 'pickets') {
        if (layer.getBounds().intersects(bounds)) {
          newlyInstdElems.push(layer);
        }
      }
    });

    instdElems.forEach((pln) => {
      if (!newlyInstdElems.includes(pln)) {
        unselectPicket(pln, stdPickets);
      }
    })

    newlyInstdElems.forEach((pln) => {
      if (!instdElems.includes(pln)) {
        selectPicket(pln, stdPickets);
      }
    });

    instdElems.splice(0, instdElems.length);
    instdElems.push(...newlyInstdElems);
  }
}

// Event handler for mouseup event to complete polyline selection within bounds
function handleMouseUp(map, rectLayerObj, stdPickets) {

  document.removeEventListener('mouseup', handleMouseUpWrap);
  map.off('mousemove', handleMouseMoveWrap);

  msgBox.value.setContent(`Выбранных пикетов: ${stdPickets.value.length}`)
  msgBox.value.show();

  clearRectangle(map, rectLayerObj);
}

function selectionPicket(pln, stdPickets) {
  if (!stdPickets.value.includes(pln)) {
    selectPicket(pln, stdPickets);
  } else {
    unselectPicket(pln, stdPickets);
  }
}

function selectPicket(pln, stdPickets) {
  stdPickets.value.push(pln);
  pln.setStyle({ color: 'black' })
}

function unselectPicket(pln, stdPickets) {
  const index = stdPickets.value.indexOf(pln)
  if (index > -1) {
    stdPickets.value.splice(index, 1);
    const init_color = pln.options.init_color;
    pln.setStyle({ color: init_color })
  }
}

// Function to clear the rectangle layer and reset polyline styles
function clearRectangle(map, rectLayerObj){
  if(rectLayerObj.layer){
    map.removeLayer(rectLayerObj.layer);
    rectLayerObj.layer = null;
  }
}

let mymap;

onMounted(() => {
  const mousePosition = {x:0, y:0};
  document.addEventListener('mousemove', function(mouseMoveEvent){
    mousePosition.x = mouseMoveEvent.pageX;
    mousePosition.y = mouseMoveEvent.pageY;
  }, false);

  mymap = L.map('mapid').setView([48.952, 142.181], 14);

  mymap.on('keydown', (e) => {
    // Get pageX and pageY coordinates of cursor from original mouse event
    if (e.originalEvent.code === 'KeyM') {
      ctxMenuCoords.left = mousePosition.x + 'px';
      ctxMenuCoords.top = mousePosition.y + 'px';

        // Show the context menu
      showContextMenu.value = true;
    }
  })

  // mymap.on('contextmenu', function(e) {
  //
  //   if (e.originalEvent.button === 2) {
  //     handleRectSelection(e, mymap);
  //   }
  //
  //   ctxMenuCoords.left = e.originalEvent.pageX + 'px';
  //   ctxMenuCoords.top = e.originalEvent.pageY + 'px';
  //
  //   // Show the context menu
  //   showContextMenu.value = true;
  // });

  mymap.on('contextmenu', (e) => handleRectSelection(e, mymap));

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: false
  }).addTo(mymap);

  const roadPane = mymap.createPane('roads');
  const picketsPane = mymap.createPane('pickets');

  const picketsLayer = getPickets(pickets, mymap);
  const roadsLayer = getRoads(roads, mymap);

  picketsLayer.addTo(mymap);
  roadsLayer.addTo(mymap);
  roadPane.style.display = 'none';
  picketsPane.style.display = 'none';

  mymap.on('click', (e) => {
    if (!e.originalEvent.target.closest('.leaflet-roads-pane') && !e.originalEvent.target.closest('.leaflet-pickets-pane')) {
      if (stdPickets.value.length) {
        stdPickets.value.forEach((pln) => {
          pln.setStyle({ color: pln.options.init_color })
          setTimeout(() => pln.redraw());
        })
      }
      if (stdPolylines.value.length) {
        stdPolylines.value.forEach((pln) => {
          pln.setStyle({ color: pln.options.init_color }).arrowheads({ ...pln._arrowheadOptions, color: pln.options.init_color });
          setTimeout(() => pln.redraw());
        })
      }
      stdPickets.value = [];
      stdPolylines.value = [];
      msgBox.value.hide();
      showContextMenu.value = false;
    }
  })

  registerMsgBox(msgBox, mymap);
  registerChgModeBtn(workMode, { roadPane, picketsPane, picketsLayer, map: mymap })

});

function registerChgModeBtn(workMode, { roadPane, picketsPane, picketsLayer, map }) {
  const chgBtn = L.control({ position: 'topright' });

  chgBtn.onAdd = function () {
    const container = L.DomUtil.create('div', 'disable-zoom-control');

    const button = L.DomUtil.create('button', '', container);

    renderLayerModePane(mymap, { button, workMode, roadPaneStyle: roadPane.style, picketPaneStyle: picketsPane.style, picketsLayer });

    L.DomEvent.on(button, 'click', function(e) {
      renderLayerModePane(mymap, { button, workMode, roadPaneStyle: roadPane.style, picketPaneStyle: picketsPane.style, picketsLayer })

      e.preventDefault();
      e.stopPropagation();

      L.DomEvent.disableClickPropagation(container);
    });

    return container;
  }

  chgBtn.addTo(map);
}

function registerMsgBox(variable, map) {
  const msgBox = L.control(({ position: 'bottomleft' }));

  msgBox.onAdd = function () {
    const container = L.DomUtil.create('div', 'msg-box-wrap');

    const mainContent = L.DomUtil.create('div', 'msg-box', container);

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

onUnmounted(() => {
  mymap.eachLayer(function (layer) {
    mymap.removeLayer(layer);
  });
  mymap.remove();
})
</script>

<style>
#context-menu-list-wrap {
  position: absolute;
  z-index: 999;
}

.context-menu-list {
  margin: 0px;
  width: 100px;
  background: #d1d8dd;
  border-radius: 5px;
  border:1px solid #a5a5a5;
  font-size:14px;
  line-height:1.4;
  padding: 0 5px;
  user-select:none;
}
#mapid:focus-visible {
  outline: none;
  box-shadow: none;
}
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

.leaflet-control-attribution {
  display:none;
}

.msg-box-wrap {
  border: 2px solid rgba(0,0,0,0.2);
  border-radius:10px;
  overflow: hidden;
}

.msg-box {
  background: rgba(255,255,255,0.9);
  padding: 7px 5px;
  width: 145px;
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
