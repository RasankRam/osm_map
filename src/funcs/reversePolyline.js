function reversePolyline({ pln, picketsLayer }) {
  const reversedLatLngs = pln.getLatLngs();
  reversedLatLngs.reverse();
  pln.setLatLngs(reversedLatLngs);

  const changedRoadNum = pln.options.road_num * -1;
  pln.options.road_num = changedRoadNum;

  picketsLayer.value.eachLayer((layer) => {
    if (layer.options.road_name === pln.options.road_name) {
      layer.options.road_num = pln.options.road_num;
    }
  })

  pln.getTooltip().setContent(`<span style="font-weight:bold">${changedRoadNum}</span>`);
}

export { reversePolyline };
