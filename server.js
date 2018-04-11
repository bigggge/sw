/**
 * server.js
 *
 * @author bigggge(me@haoduoyu.cc)
 * 2018/4/11.
 */

const Koa = require('koa');
const fs = require('fs');
const path = require('path');
const static = require('koa-static');
const mount = require('koa-mount');
const logger = require('koa-logger');
const Router = require('koa-router');

const port = 5000;

const app = new Koa();
const router = new Router();

app.use(logger());
app.use(static('.'));
app.use(mount('/static', static('./static')));

// app.use(serve('static', {
//   maxage: 365 * 24 * 60 * 60 * 1000
// }));

router.get('/', ctx => {
  let html = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
  ctx.body = html;
});

router.get('/getData', ctx => {
  ctx.body = {
    data: [
      '111', '222', '333'
    ]
  };
});

app.use(router.routes())
  .use(router.allowedMethods());

app.listen(port, () => {
  console.log('服务已启动，端口号为：' + port);
});