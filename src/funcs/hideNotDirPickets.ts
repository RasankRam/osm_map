export const hideNotDirPickets = ({ roadsLayer, picketsLayer }) => {
  const roadNumbs = [];

  roadsLayer.value.eachLayer((road) => {
    roadNumbs.push(road.options.road_num);
  });

  picketsLayer.value.eachLayer((layer) => {
    if (!roadNumbs.includes(layer.options.road_num)) {
      layer.getElement().style.display = 'none';
    } else {
      layer.getElement().style.display = '';
    }
  });
}
