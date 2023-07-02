const getRandomColorSmart = () => {
  const colors = ['#C25865', '#4f9787', '#42AA85', '#FFC875', '#B467A3', '#3AB2F6', 'orange'];

  // Создаем массив для хранения уже использованных цветов
  if (!getRandomColorSmart.usedColors) {
    getRandomColorSmart.usedColors = [];
  }
  if (!getRandomColorSmart.firstThreeElems) {
    getRandomColorSmart.firstThreeElems = [];
  }

  // Проверяем, все ли цвета были использованы
  if (getRandomColorSmart.usedColors.length === colors.length) {
    getRandomColorSmart.firstThreeElems = getRandomColorSmart.usedColors.slice(0, 3);
    // Если все цвета были использованы, обнуляем список используемых и начинаем сначала
    getRandomColorSmart.usedColors = [];
  }

  if (getRandomColorSmart.firstThreeElems.length > 0 && getRandomColorSmart.firstThreeElems.length === getRandomColorSmart.usedColors.length) {
    getRandomColorSmart.firstThreeElems = [];
  }

  const availableColors = colors.filter(function(color) {
    return !getRandomColorSmart.usedColors.includes(color) && !getRandomColorSmart.firstThreeElems.includes(color);
  });

  const randomIndex = Math.floor(Math.random() * availableColors.length);

  // Получаем случайный неиспользованный цвет из доступных
  const randomColor = availableColors[randomIndex];

  // Добавляем выбранный цвет в список уже использованных
  getRandomColorSmart.usedColors.push(randomColor);

  return randomColor;
}

export { getRandomColorSmart }