import axios from "../plugins/axios.ts";
import roads_json from "../roads.json";

export const getLoadedRoads = async () =>  {
  let roads;
  try {
    ({ data: roads } = await axios.get('https://geo.oeswork.io/api/roads'));
  } catch (err) {
    console.log('err download roads');
    roads = roads_json;
  }

  return roads;
}
