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
import "leaflet-arrowheads";
import roads from './roads.json';
import pickets from './pickets.json';

console.log('picket', pickets[0].geometry.coordinates);


function sleep (ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";

  // Генерируем шестнадцатеричный код цвета длиной в 6 символов
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }

  return color;
}

function drawRoads(roads, mymap) {
  const polylineGroup = L.layerGroup();
  for (const road of roads) {
    const coords = road.geometry.coordinates.map((item) => {
      const res = [];
      res.push(item[1], item[0]);
      return res;
    });

    const pln = L.polyline(coords, { color: getRandomColor(), weight: 6 }).arrowheads({ size: '5px', frequency: 'endonly' })

    pln.bindTooltip(`<span style="font-weight:bold">${road.number}</span>`, { permanent: true, className: 'leaflet-tooltip-own' }).openTooltip();

    pln.on('click', () => reversePolyline(coords, pln, mymap, road.number * -1));

    polylineGroup.addLayer(pln);
  }
  // polylineGroup.addTo(mymap);
  return polylineGroup;
}

function drawPolygons(polygons, mymap) {
  const polygonGroup = L.layerGroup();
  for (const item of polygons) {
    const coords = item.geometry.coordinates.map((item) => {
      const res = [];
      res.push(item[1], item[0]);
      return res;
    })

    console.log('coords', coords);

    const plgn = L.polyline(coords, { color: getRandomColor(), weight: 6 });

    polygonGroup.addLayer(plgn);
  }
  polygonGroup.addTo(mymap);
  return polygonGroup;
}

function reversePolyline(coords, pln, mymap, number) {
  const reversedLatLngs = coords.reverse();
  mymap.removeLayer(pln);

  const plnNest = L.polyline(reversedLatLngs, { color: getRandomColor(), weight: 6 }).arrowheads({ size: '7px', frequency: 'endonly' });
  plnNest.bindTooltip(`<span style="font-weight:bold">${number}</span>`, { permanent: true, className: 'leaflet-tooltip-own' }).openTooltip();
  plnNest.addTo(mymap);
  const changedNumber = number * -1;
  plnNest.on('click', () => reversePolyline(coords, plnNest, mymap, changedNumber));
}

let mymap;

onMounted(() => {
  mymap = L.map('mapid').setView([48.952, 142.181], 14);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(mymap);

  const polygonGroup = drawPolygons(pickets, mymap);

  const polylineGroup = drawRoads(roads, mymap)

  const MyControl = L.Control.extend({
    onAdd: function(map) {
      const container = L.DomUtil.create('div', 'disable-zoom-control');

      const button = L.DomUtil.create('button', '', container);
      button.innerHTML = 'Сегменты';

      // Add event listener to disable zoom:
      L.DomEvent.on(button, 'click', function(e) {
        // map.scrollWheelZoom.disable();
        // map.doubleClickZoom.disable();
        if (map.hasLayer(polylineGroup)) {
          button.innerHTML = 'Пикеты';
          polylineGroup.removeFrom(map);
          polygonGroup.addTo(map);
        } else if (map.hasLayer(polygonGroup)) {
          button.innerHTML = 'Сегменты';
          polygonGroup.removeFrom(map);
          polylineGroup.addTo(map);
        }

        // Hide myLayerGroup:
        // myLayerGroup.removeFrom(map);
        //
        // // Show myLayergroup:
        // myLayergroup.addTo(map);

        e.preventDefault();
        e.stopPropagation();

        // Prevent default behavior for dblclick:
        L.DomEvent.disableClickPropagation(container);
      });

      return container;

      // const container = L.DomUtil.create('div', 'my-custom-control');
      // container.innerHTML = `
      //     <div style="border:2px solid rgba(0,0,0,0.2); border-radius: 5px;overflow:hidden">
      //       <button style="background: white;padding:5px 10px">СЕГМЕНТЫ</button>
      //     </div>
      // `;
      // container.addEventListener('click', (e) => {
      //   map.scrollWheelZoom.disable();
      //   e.preventDefault();
      //   e.stopPropagation();
      //   console.log('Нажал на сегменты')
      // })
      //
      // return container;
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
  position: absolute;
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
