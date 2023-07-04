function reversePolyline(pln) {
  const reversedLatLngs = pln.getLatLngs();
  reversedLatLngs.reverse();
  pln.setLatLngs(reversedLatLngs);

  const changedRoadNum = pln.options.road_num * -1;
  pln.options.road_num = changedRoadNum;

  pln.getTooltip().setContent(`<span style="font-weight:bold">${changedRoadNum}</span>`);
}

export { reversePolyline };