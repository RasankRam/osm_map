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

  <div style="height: 500px" id="mapid"></div>

</template>

<script setup>
import HelloWorld from './components/HelloWorld.vue'
import { onMounted, onUnmounted } from 'vue';
import { map, tileLayer, polygon, polyline, marker, divIcon, TileLayer, latLng, point, LineUtil, latLngBounds } from 'leaflet';
import "leaflet-arrowheads";
import roads from './roads.json';


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

function distanceBetweenPoints(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;

  return Math.sqrt(dx*dx + dy*dy);
}

function generateUniqueId(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

function getRandomLightColor() {
  // Генерируем случайные значения для красного, зеленого и синего цветов (в диапазоне от 200 до 255)
  const red = Math.floor(Math.random() * (256 - 200) + 200);
  const green = Math.floor(Math.random() * (256 - 200) + 200);
  const blue = Math.floor(Math.random() * (256 - 200) + 200);

  // Соединяем значения в одну строку для создания CSS-цвета RGB
  return `rgb(${red}, ${green}, ${blue})`;
}

function reduceDistance(x1, y1, x2, y2) {
  const xm = (x1 + x2) / 2;
  const ym = (y1 + y2) / 2;

  return [xm, ym];
}

function distanceToPolylineCenter(polyline, center) {

  var minDistance = Infinity; // начальное значение минимального расстояния - бесконечность

  for (var i = 0; i < polyline.length - 1; i++) { // перебираем все отрезки в линии
    var p1 = latLng(polyline[i]); // первая точка текущего отрезка
    var p2 = latLng(polyline[i + 1]); // вторая точка текущего отрезка

    var distance = center.distanceTo(LineUtil.closestPointOnSegment(p1, p2, center));
    // используем функцию closestPointOnSegment() из Leaflet API для определения ближайшей точки на каждом отрезке к данному "center"

    if (distance < minDistance) {
      minDistance = distance;
    }
  }

  return minDistance;
}

function calcDistance(polyline, point) {
  // Calculate the distance from the point to each segment of the polyline
  var distances = [];
  for (var i = 0; i < polyline.getLatLngs().length - 1; i++) {
    var segmentStart = polyline.getLatLngs()[i];
    var segmentEnd = polyline.getLatLngs()[i + 1];
    var closestPointOnSegment = LineUtil.closestPointOnSegment(segmentStart, segmentEnd, point);
    distances.push(point.distanceTo(closestPointOnSegment));
  }

  // Return the minimum distance found among all segments
  return Math.min(...distances);
}

function increaseDistance(x1, y1, x2, y2) {
  const xc = x1 + (x2 - x1) * 5;
  const yc = y1 + (y2 - y1) * 5;

  return [xc , yc];
}

function findMiddlePoint(polyline, latOffset, lngOffset) {
  let length = polyline.length;
  let midpointIndex = Math.floor(length / 2);

  // If the number of points is even, we need to average two middle points
  if (length % 2 === 0) {
    return [
      (polyline[midpointIndex - 1][0] + polyline[midpointIndex][0]) / 2 + latOffset,
      (polyline[midpointIndex - 1][1] + polyline[midpointIndex][1]) / 2 + lngOffset
    ];

  } else { // Otherwise, just return the single middle point
    return [polyline[midpointIndex][0] + latOffset, polyline[midpointIndex][1] + lngOffset];
  }
}
// onMounted(() => {
//
//   console.log('asdfadsas')
//
//   mymap = map('mapid').setView([51.505, -0.09], 13);
//
//   tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//   }).addTo(mymap);
//
//   marker([51.5, -0.09]).addTo(mymap)
//       .bindPopup('A pretty CSS popup.<br> Easily customizable.')
//       .openPopup();
// })

let mymap;

onMounted(() => {
  mymap = map('mapid').setView([48.952, 142.181], 14);

  tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(mymap);

  const reversePolyline = (coords, pln, mymap) => {
    console.log('asdf');
    const reversedLatLngs = coords.reverse();
    mymap.removeLayer(pln);
    const plnNest = polyline(reversedLatLngs, { color: getRandomColor(), weight: 5 }).arrowheads({ size: '5px', frequency: 'endonly' })
        .addTo(mymap);
    plnNest.on('click', () => reversePolyline(coords, plnNest, mymap))
  }

  // marker([48.952, 142.181]).addTo(mymap)
  //     .bindPopup('A pretty CSS popup.<br> Easily customizable.')
  //     .openPopup();

  // console.log('roads', roads);


  for (const road of roads) {
    const coords = road.geometry.coordinates.map((item) => {
      const res = [];
      res.push(item[1], item[0]);
      return res;
    });

    const pln = polyline(coords, { color: getRandomColor(), weight: 5 }).arrowheads({ size: '5px', frequency: 'endonly' })

    pln.bindTooltip(`<span style="font-weight:bold">${road.number}</span>`, {permanent: true, className: 'leaflet-tooltip-own' }).openTooltip();

    pln.on('click', () => reversePolyline(coords, pln, mymap));

    pln.addTo(mymap);

    // Get bounds of polyline so we know where to place marker
    const bounds = pln.getBounds();

    // Calculate center point of bounds
    const centerPoint = bounds.getCenter();

    // console.log('distanceToplnCenter', calcDistance(pln, latLng(centerPoint.lng, centerPoint.lat)));

    const middleCoords = findMiddlePoint(coords, 0.0001, 0.0001);

    const centerOffsetted = point(centerPoint.lat, centerPoint.lng).add(point(0.0001, 0.0001));

    console.log('centerOffsetted', centerOffsetted);


    // console.log({ middleCoords, centPoint });

    // const alterCoords = [Math.abs(middleCoords[0]-centerPoint.lat)*10000,Math.abs(middleCoords[1]-centerPoint.lng)*10000];

    const dt = distanceBetweenPoints(middleCoords[0], middleCoords[1], centerPoint.lat, centerPoint.lng)*10000;
    const uniqId = generateUniqueId(5);

    // const uniqString = `My label ${uniqId}`;

    // console.log('distanceBetweenTwoPoints', {
    //   dt,
    //   uniqString
    // });

    // Create DivIcon containing our label text (in this case "My Label")
    const myLabelDiv = divIcon({
      className: 'my-label',
      html: `<span style="font-weight:bold">${road.number}</span>`,
    });

    let newCoords;

    console.log('distanceBetweenTwoPoints', {
      dt,
      number: road.number
    });

    if (dt > 10) {
      newCoords = reduceDistance(middleCoords[0], middleCoords[1], centerPoint.lat, centerPoint.lng);
      // myLabelDiv.options.iconAnchor=[-10,-5];
      // myLabelDiv.options.popupAnchor=[-10,-5];
    }

  }


// Define coordinates for our polyline
//   const latlngs = roads.reduce((res, road) => {
//     const coords = road.geometry.coordinates.map((item) => {
//       return [item[0], item[1]] = [item[1], item[0]];
//     });
//
//     console.log('coords', coords);
//
//     return res.concat(coords);
//   }, []);



  // const mypolyline = polyline(latlngs, { color: 'red' }).arrowheads({ size: '5px' }).addTo(mymap);
  // draw 5 arrows per line

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
