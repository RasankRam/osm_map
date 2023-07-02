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
import { onMounted, onUnmounted, computed, reactive, watch, shallowRef, ref } from 'vue';
import * as L from 'leaflet';
import { getRandomColorSmart } from './utils';
import axios from './plugins/axios';

function debounce(func, delay) {
  let timeoutId;

  return function(...args) {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

import "leaflet-arrowheads";
import roads from './roads.json';
import pickets from './pickets.json';

let stdPolylines = shallowRef([]);
let stdPickets = shallowRef([]);

function getCtxMenuCoordsFabric() {
  return { top: '0px', left: '0px' };
}

let handleMouseMoveWrap;
let handleMouseUpWrap;
let msgBox = {};
let sendBox = {};
const workMode = ref();
const showContextMenu = ref(false);
const ctxMenuCoords = reactive(getCtxMenuCoordsFabric());

let roadsLayer = [];
let picketsLayer = [];

watch(stdPickets, (v) => {
  if (stdPickets.value.length > 0) {
    msgBox.value.setContent(`Выбранных пикетов: ${stdPickets.value.length}`)
    msgBox.value.show();
    sendBox.value.show();
  } else {
    sendBox.value.hide();
    msgBox.value.hide();
  }
});

watch(stdPolylines, (v) => {
  if (stdPolylines.value.length > 0) {
    msgBox.value.show();
    msgBox.value.setContent(`Выбрано дорог: ${stdPolylines.value.length}`)
  } else {
    msgBox.value.hide();
  }
})

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

    if (stdPickets.value.length) {
      res.push({
        text: 'Добавить комментарий',
        onClick: () => {
          const insertedComment = prompt('Введите комментарий для пикетов')
          stdPickets.value.forEach((pln) => {
            pln.options.comment = insertedComment;
          })

        }
      })
    }

    return res;
  }
  return [];
})

function selectionPolyline(pln) {
  if (!stdPolylines.value.includes(pln)) {
    selectPolyline(pln);
  } else {
    unselectPolyline(pln);
  }
}

function selectPolyline(pln) {
  stdPolylines.value = [...stdPolylines.value, pln];
  pln.setStyle({ color: 'black' }).arrowheads({ ...pln._arrowheadOptions, color: 'black' })
  setTimeout(() => pln.redraw())
}

function unselectPolyline(pln) {
  stdPolylines.value = stdPolylines.value.filter((i) => i !== pln);
  pln.setStyle({ color: pln.options.init_color }).arrowheads({ ...pln._arrowheadOptions, color: pln.options.init_color });
  setTimeout(() => pln.redraw())
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

    const plgn = L.polyline(coords, { color, weight: 6, pane: 'pickets', road_name: picket.road_name,
      road_num: picket.road_num, picket_id: picket.picket_id, init_color: color });

    plgn.on('click', (e) => {
      e.originalEvent.preventDefault();
      e.originalEvent.stopPropagation();

      L.DomEvent.disableClickPropagation(e.sourceTarget);

      selectionPicket(e.sourceTarget, stdPickets);
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

    const instdPickets = [];
    const instdRoads = [];

    handleMouseMoveWrap = handleMouseMove.bind(null, startPoint, map, rectLayerObj, instdPickets, instdRoads);
    handleMouseUpWrap = handleMouseUp.bind(null, map, rectLayerObj, stdPickets);

    map.on('mousemove', handleMouseMoveWrap);

    document.addEventListener('mouseup', handleMouseUpWrap);
  }
}

// Event handler for mousemove event while making the selection
function handleMouseMove(startPoint, map, rectLayerObj, instdPickets, instdRoads, event) {

  const endPoint = event.latlng;

  const newlyinstdPickets = [];
  const newlyinstdRoads = [];

  if (rectLayerObj.layer === undefined) {
    rectLayerObj.layer = L.rectangle([startPoint, endPoint], { color: '#1f1f1f', weight: 2, fillOpacity: 0 }).addTo(map);
  } else if (rectLayerObj.layer) {
    rectLayerObj.layer.setBounds(L.latLngBounds(startPoint, endPoint));
    const bounds = rectLayerObj.layer.getBounds();

    if (roadsLayer.getLayers()[0].getElement().closest('.leaflet-roads-pane').style.display === '') {
      roadsLayer.eachLayer((pln) => {
        if (pln.getBounds().intersects(bounds)) {
          newlyinstdRoads.push(pln);
        }
      })
    }

    if (picketsLayer.getLayers()[0].getElement().closest('.leaflet-pickets-pane').style.display === '') {
      picketsLayer.eachLayer((pln) => {
        if (pln.getBounds().intersects(bounds)) {
          newlyinstdPickets.push(pln);
        }
      })
    }

    instdPickets.forEach((pln) => {
      if (!newlyinstdPickets.includes(pln)) {
        unselectPicket(pln, stdPickets);
      }
    })

    instdRoads.forEach((pln) => {
      if (!newlyinstdRoads.includes(pln)) {
        unselectPolyline(pln);
      }
    })

    newlyinstdPickets.forEach((pln) => {
      if (!instdPickets.includes(pln)) {
        selectPicket(pln, stdPickets);
      }
    });

    newlyinstdRoads.forEach((pln) => {
      if (!instdRoads.includes(pln)) {
        selectPolyline(pln);
      }
    })

    instdPickets.splice(0, instdPickets.length);
    instdPickets.push(...newlyinstdPickets);
    instdRoads.splice(0, instdRoads.length);
    instdRoads.push(...newlyinstdRoads);
  }
}

// Event handler for mouseup event to complete polyline selection within bounds
function handleMouseUp(map, rectLayerObj, stdPickets) {

  document.removeEventListener('mouseup', handleMouseUpWrap);
  map.off('mousemove', handleMouseMoveWrap);

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
  stdPickets.value = [...stdPickets.value, pln];
  pln.setStyle({ color: 'black' })
}

function unselectPicket(pln, stdPickets) {
  stdPickets.value = stdPickets.value.filter((i) => i !== pln);
  const init_color = pln.options.init_color;
  pln.setStyle({ color: init_color })
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
      if (stdPickets.value.length || stdPolylines.value.length) {
        showContextMenu.value = true;
      }
    }
  })

  mymap.on('contextmenu', function(e) {

    if (e.originalEvent.button === 2) {
      e.originalEvent.preventDefault();
      e.originalEvent.stopPropagation();
    }
  });

  mymap.on('mousedown', (e) => {
    if (e.originalEvent.button === 2) {
      e.originalEvent.preventDefault();
      e.originalEvent.stopPropagation();

      handleRectSelection(e, mymap);
    }
  });

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: false
  }).addTo(mymap);

  const roadPane = mymap.createPane('roads');
  const picketsPane = mymap.createPane('pickets');

  picketsLayer = getPickets(pickets, mymap);
  roadsLayer = getRoads(roads, mymap);

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
  registerSendBtn(sendBox, { map: mymap });
});

function registerSendBtn(bindVar, { map }) {
  const sendBtn = L.control({ position: 'bottomright' });

  sendBtn.onAdd = function () {
    const container = L.DomUtil.create('button', 'msg-box-wrap msg-box-wrap_sendBtn');

    const mainContent = L.DomUtil.create('div', 'msg-box msg-box_sendBtn', container);

    const button = L.DomUtil.create('span', '', mainContent);

    button.innerHTML = 'S';

    container.style.display = 'none';

    this._container = container;

    L.DomEvent.on(container, 'click', async function(e) {
      e.preventDefault();
      e.stopPropagation();

      L.DomEvent.disableClickPropagation(container);


      let postData;
      try {
        postData = stdPickets.value.map((pln) => {
          const plnOptions = pln.options;

          if (!plnOptions.comment) {
            throw new Error('no_comment');
          }

          return {
            picket_id: plnOptions.picket_id,
            road_num: plnOptions.road_num,
            comment: plnOptions.comment,
          }
        })
      } catch (err) {
        if (err.message !== 'no_comment') throw err;
        alert('Не у всех выбранных пикетов есть комментарий для отправки')
        return;
      }

      let res;
      try {
        res = await axios.post('pickets/comment', postData);
        sendBox.value.hide();
        stdPickets.value = [];
      } catch (err) {
        alert('Не получилось задать комментарии пикетам');
        console.log('commentSaveErr', err);
      }

    });

    return container;
  }

  sendBtn.show = debounce(function() {
    this._container.style.display = '';
  }, 100);

  sendBtn.hide = debounce(function () {
    this._container.style.display = 'none';
  }, 100);

  bindVar.value = sendBtn;

  sendBtn.addTo(map)
}

function registerChgModeBtn(workMode, { roadPane, picketsPane, picketsLayer, map }) {
  const chgBtn = L.control({ position: 'topright' });

  chgBtn.onAdd = function () {
    const container = L.DomUtil.create('button', 'msg-box-wrap msg-box-wrap_chgMode');

    const mainContent = L.DomUtil.create('div', 'msg-box', container);

    const button = L.DomUtil.create('span', '', mainContent);

    renderLayerModePane(mymap, { button, workMode, roadPaneStyle: roadPane.style, picketPaneStyle: picketsPane.style, picketsLayer });

    L.DomEvent.on(container, 'click', function(e) {
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

onUnmounted(() => {
  mymap.eachLayer(function (layer) {
    mymap.removeLayer(layer);
  });
  mymap.remove();
})
</script>

<style>
* {
  box-sizing: border-box;
}

button:focus, button:focus-visible {
  outline: none;
}

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
  background: none;
  border-radius: 5px;
  padding: 0;
  overflow: hidden;
}

.msg-box-wrap_chgMode {
  border-radius: 8px;
  width: 160px;
}

.msg-box-wrap_sendBtn {
  /*border: 2px solid black;*/
}

.msg-box {
  background: rgba(255,255,255,0.9);
  padding: 7px 8px;
}

.msg-box_dataBox {
  width: 156px;
}

.msg-box_sendBtn {
  width: 34px;
}
</style>
