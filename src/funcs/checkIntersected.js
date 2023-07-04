function checkIntersected({ picketsLayer, stdRoads }) {

  const roadNames = stdRoads.value.map((i) => i.options.road_name);

  stdRoads.value.forEach(() => {

    picketsLayer.value.eachLayer((layer) => {

      if (!roadNames.includes(layer.options.road_name)) {
        layer.getElement().style.display = 'none';
      }

    })
  })
}

export { checkIntersected };