function selectionRoad({ pln, stdRoads }) {
  if (!stdRoads.value.includes(pln)) {
    selectRoad(pln);
  } else {
    unselectRoad(pln);
  }
}

function selectRoad({ pln, stdRoads }) {
  stdRoads.value = [...stdRoads.value, pln];
  pln.setStyle({ color: 'black' }).arrowheads({ ...pln._arrowheadOptions, color: 'black' })
  setTimeout(() => pln.redraw())
}

function unselectRoad({ pln, stdRoads }) {
  stdRoads.value = stdRoads.value.filter((i) => i !== pln);
  pln.setStyle({ color: pln.options.init_color }).arrowheads({ ...pln._arrowheadOptions, color: pln.options.init_color });
  setTimeout(() => pln.redraw())
}

export { selectionRoad, selectRoad, unselectRoad };