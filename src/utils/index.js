export function debounce(func, delay) {
    let timer = null;
    return function() {
      const context = this;
      const args = arguments;
      timer && clearTimeout(timer);
      timer = setTimeout(function() {
        func.apply(context, args);
      }, delay);
    };
}