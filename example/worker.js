/**
 * workers.js
 *
 * @author bigggge(me@haoduoyu.cc)
 * 2018/4/13.
 */
self.onmessage = function (event) {
  var data = event.data;
  var ans = fibonacci(data);
  this.postMessage(ans);
};

function fibonacci (n) {
  return n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2);
}