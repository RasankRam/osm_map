import { checkIntersected } from './checkIntersected';

function renderLayerModePane(map, { button, roadPaneStyle, workMode, picketPaneStyle, picketsLayer, stdRoads }) {
  if (!roadPaneStyle.display) {
    checkIntersected({ picketsLayer, stdRoads });
    button.innerHTML = 'Режим редактирования';
    workMode.value = 'editing';
    roadPaneStyle.display = 'none';
    picketPaneStyle.display = '';
  } else if (!picketPaneStyle.display) {
    picketsLayer.value.eachLayer(((layer) => layer.getElement().style.display = ''))
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

export { renderLayerModePane }