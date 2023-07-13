export const debounce = (func: () => void, delay: number) => {
  let timeoutId;

  return function(...args) {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}
