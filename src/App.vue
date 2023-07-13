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

<script setup lang="ts">
import { onMounted, onUnmounted, computed, reactive, watch, shallowRef, ref } from 'vue';
import * as L from 'leaflet';
import "leaflet-arrowheads";
import { registerSendBtn } from './funcs/registerSendBtn';
import { registerChgModeBtn } from './funcs/registerChgModeBtn';
import { registerMsgBox } from './funcs/registerMsgBox';
import { contextMenuFn } from './funcs/contextMenuFn';
import { getPickets } from './funcs/getPickets';
import { getRoads } from './funcs/getRoads';
import { getMap } from './funcs/getMap';
import type { FeatureGroup, LayerGroup, Map } from "leaflet";
import type { LControl } from './types/LControl.ts';
import { getLoadedRoads } from "./funcs/getLoadedRoads.ts";
import { getLoadedPickets } from "./funcs/getLoadedPickets.ts";
import { getTrackedMousePosition } from "./funcs/getTrackedMousePosition.ts";
import { hideNotDirPickets } from "./funcs/hideNotDirPickets.ts";
import {LPolyline} from "./types/LPolyline.ts";
import type { ContextMenuType } from "./types/contextMenuType.ts";

function getCtxMenuCoordsFabric() {
  return { top: '0px', left: '0px' };
}

let stdPolylines = shallowRef<LPolyline[]>([]);
let stdPickets = shallowRef<LPolyline[]>([]);

let msgBox: LControl = {};
let sendBox: LControl = {};
const workMode = ref<'view' | 'editing'>();
const showContextMenu = ref(false);
const ctxMenuCoords = reactive(getCtxMenuCoordsFabric());

let roadsLayer = shallowRef<LayerGroup>();
let picketsLayer = shallowRef<FeatureGroup>();

watch(stdPickets, () => {
  if (stdPickets.value.length > 0) {
    msgBox.value.setContent(`Выбранных пикетов: ${stdPickets.value.length}`)
    msgBox.value.show();
    sendBox.value.show();
  } else {
    sendBox.value.hide();
    msgBox.value.hide();
  }
});

watch(stdPolylines, () => {
  if (stdPolylines.value.length > 0) {
    msgBox.value.show();
    msgBox.value.setContent(`Выбрано дорог: ${stdPolylines.value.length}`)
  } else {
    msgBox.value.hide();
  }
})

const contextMenu = computed<ContextMenuType>
  (contextMenuFn.bind(null, { workMode, stdRoads: stdPolylines, stdPickets, showContextMenu, picketsLayer }));

let mymap;

onMounted(async () => {
  let roads = await getLoadedRoads();
  let pickets = await getLoadedPickets();

  const mousePosition = getTrackedMousePosition();

  const mymap: Map = getMap({
    ctxMenuCoords, mousePosition, stdPickets, stdRoads: stdPolylines, roadsLayer, picketsLayer, msgBox, showContextMenu });

  // attribution false
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mymap);

  const roadPane: HTMLElement = mymap.createPane('roads');
  const picketsPane: HTMLElement = mymap.createPane('pickets');

  picketsLayer.value = getPickets({ pickets, stdPickets  });
  roadsLayer.value = getRoads({ roads, stdRoads: stdPolylines });

  picketsLayer.value.addTo(mymap);
  roadsLayer.value.addTo(mymap);
  roadPane.style.display = 'none';
  picketsPane.style.display = 'none';

  hideNotDirPickets({ roadsLayer, picketsLayer });

  registerMsgBox(msgBox, { map: mymap });
  registerChgModeBtn(workMode, { roadPane, picketsPane, picketsLayer, map: mymap, stdRoads: stdPolylines })
  registerSendBtn(sendBox, { map: mymap, sendBox, stdPickets });
});

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
