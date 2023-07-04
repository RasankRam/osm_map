import { reversePolyline } from './reversePolyline';

export const contextMenuFn = ({ workMode, stdRoads, stdPickets, showContextMenu, picketsLayer }) => {
  if(!showContextMenu.value) return [];

  const res = [];

  if (workMode.value === 'view') {

    if (stdRoads.value.length) {
      res.push({
        text: 'Поменять направление',
        onClick: () => {
          stdRoads.value.forEach((pln) => reversePolyline({ pln, picketsLayer }));
        }
      })
    }

    return res;
  } else if (workMode.value === 'editing') {

    if (stdPickets.value.length) {
      res.push({
        text: 'Добавить комментарий',
        onClick: () => {
          const insertedComment = prompt('Введите комментарий для пикетов')
          stdPickets.value.forEach((pln) => {
            pln.options.comment = insertedComment;
          })

        }
      })
    }

    return res;
  }
  return [];
}
