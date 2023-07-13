import axios from "../plugins/axios.ts";
import pickets_json from "../pickets.json";

export const getLoadedPickets = async () => {
  let pickets;
  try {
    ({ data: pickets } = await axios.get('https://geo.oeswork.io/api/pickets'));
  } catch (err) {
    pickets = pickets_json;
  }
  return pickets;
}
