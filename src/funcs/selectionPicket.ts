function selectionPicket({ pln, stdPickets }) {
  if (!stdPickets.value.includes(pln)) {
    selectPicket({ pln, stdPickets });
  } else {
    unselectPicket({ pln, stdPickets });
  }
}

function selectPicket({ pln, stdPickets }) {
  stdPickets.value = [...stdPickets.value, pln];
  pln.setStyle({ color: 'black' })
}

function unselectPicket({ pln, stdPickets }) {
  stdPickets.value = stdPickets.value.filter((i) => i !== pln);
  const init_color = pln.options.init_color;
  pln.setStyle({ color: init_color })
}

export { selectionPicket, selectPicket, unselectPicket };