export const getTrackedMousePosition = () => {
  const mousePosition = { x:0, y:0 };

  document.addEventListener('mousemove', function (mouseMoveEvent) {
    mousePosition.x = mouseMoveEvent.pageX;
    mousePosition.y = mouseMoveEvent.pageY;
  }, false);

  return mousePosition;
}
