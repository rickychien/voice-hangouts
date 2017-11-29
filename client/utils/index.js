export function log(...message) {
  console.log(...message);
}

export function to(promise) {
  return promise.then((data) => [null, data]).catch((err) => [err]);
}

export default {
  log,
  to,
};
