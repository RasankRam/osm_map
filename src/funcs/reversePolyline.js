function reversePolyline({ pln, picketsLayer, roadsLayer }) {
  const reversedLatLngs = pln.getLatLngs();
  reversedLatLngs.reverse();
  pln.setLatLngs(reversedLatLngs);

  const changedRoadNum = pln.options.road_num * -1;
  pln.options.road_num = changedRoadNum;

  picketsLayer.value.eachLayer((layer) => {
    if (changedRoadNum === layer.options.road_num) {
      layer.getElement().style.display = '';
    } else {
      layer.getElement().style.display = 'none';
    }
  });

  pln.getTooltip().setContent(`<span style="font-weight:bold">${changedRoadNum}</span>`);
}

export { reversePolyline };
