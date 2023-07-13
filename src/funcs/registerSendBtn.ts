import * as L from 'leaflet';
import type { Map } from "leaflet";
import axios from '../plugins/axios.js';
import { debounce } from '../helpers/helpers';
import type { LControl } from "../types/LControl.ts";
import type { Ref } from "vue";
import type { LPolyline } from "../types/LPolyline.ts";

function registerSendBtn(bindVar: LControl, { map, sendBox, stdPickets }: { map: Map, sendBox: LControl, stdPickets: Ref<LPolyline[]> }) {
  // @ts-ignore
  const sendBtn = L.control({ position: 'bottomright' });

  sendBtn.onAdd = function () {
    const container = L.DomUtil.create('button', 'msg-box-wrap msg-box-wrap_sendBtn');

    const mainContent = L.DomUtil.create('div', 'msg-box msg-box_sendBtn', container);

    const button = L.DomUtil.create('span', '', mainContent);

    button.innerHTML = 'S';

    container.style.display = 'none';

    this._container = container;

    L.DomEvent.on(container, 'click', async function(e) {
      e.preventDefault();
      e.stopPropagation();

      L.DomEvent.disableClickPropagation(container);


      let postData;
      try {
        postData = stdPickets.value.map((pln) => {
          const plnOptions = pln.options;

          if (!plnOptions.comment) {
            throw new Error('no_comment');
          }

          return {
            picket_id: plnOptions.picket_id,
            road_num: plnOptions.road_num,
            comment: plnOptions.comment,
          }
        })
      } catch (err) {
        if (err.message !== 'no_comment') throw err;
        alert('Не у всех выбранных пикетов есть комментарий для отправки')
        return;
      }

      try {
        await axios.post('pickets/comment', postData);
        sendBox.value.hide();
        stdPickets.value = [];
      } catch (err) {
        alert('Не получилось задать комментарии пикетам');
        console.log('commentSaveErr', err);
      }

    });

    return container;
  }

  sendBtn.show = debounce(function() {
    this._container.style.display = '';
  }, 100);

  sendBtn.hide = debounce(function () {
    this._container.style.display = 'none';
  }, 100);

  bindVar.value = sendBtn;

  sendBtn.addTo(map)
}

export { registerSendBtn }
