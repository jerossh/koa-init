const Koa = require('koa');
const app = new Koa();
const config = require('./config');
const router = require('koa-router')(); 
const Pug = require('koa-pug');
const co = require('co');
const convert = require('koa-convert');
const json = require('koa-json');
const onerror = require('koa-onerror');
const bodyparser = require('koa-bodyparser');
const logger = require('koa-logger');
const mongoose = require('koa-mongoose');
const session = require('koa-generic-session'); // different from koa-session(it is cookie session).
const redisStore = require('koa-redis');
const UglifyJS = require('uglify-js')


const pug = new Pug({
  viewPath: './views',
  debug: process.env.NODE_ENV === 'development',
  pretty: false,
  compileDebug: false,
  // locals: global_locals_for_all_pages,
  basedir: 'path/for/pug/extends',
  // helperPath: [
  //   'path/to/pug/helpers',
  //   { random: 'path/to/lib/random.js' },
  //   { _: require('lodash') }
  // ],
  app: app // equals to pug.use(app) and app.use(pug.middleware) 
})
pug.locals.someKey = 'some value';


// 中间件配置
app.use(json({ pretty: false, param: 'pretty' }));
app.use(bodyparser({
  extendTypes: {
    json: ['application/x-javascript'] // will parse application/x-javascript type body as a JSON string 
  },
  onerror: function (err, ctx) {
    ctx.throw('body parse error', 422);
  }
}));
app.use(mongoose({
    mongoose: require('mongoose-q')(),//custom mongoose 
    user: '',
    pass: '',
    host: '127.0.0.1',
    port: 27017,
    database: 'test',
    db: {
        native_parser: true
    },
    server: {
        poolSize: 5
    }
}))
app.use(session({
  store: redisStore()
}));



// 开发模式配置
if (process.env.NODE_ENV === 'development') {
  onerror(app); // 错误处理
  app.use(logger())

}




// koa 默认有一个 favicon.ico 请求？

app.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
  // console.log(ctx.method)
});

// response
app.use(ctx => {
  ctx.body = { foo: 'bar' };
});

const server = app.listen(config.port, (x) => {
  console.log(server._connectionKey, '启动成功')
  console.log('环境：', process.env.NODE_ENV )
});