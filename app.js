const Koa = require('koa');
const app = new Koa();
const config = require('./config');
const bodyparser = require('koa-bodyparser');
const json = require('koa-json');
const serve = require('koa-static');
const router = require('koa-router')(); 
const Pug = require('koa-pug');
// const co = require('co');
// const convert = require('koa-convert'); // 转换 promise 支持 koa 1
const mongoose = require('koa-mongoose');
const session = require('koa-generic-session'); // different from koa-session(it is cookie session).
const redisStore = require('koa-redis');
const onerror = require('koa-onerror');
const logger = require('koa-logger');
const UglifyJS = require('uglify-js');


// 中间件配置
app.keys = ['im a newer secret', 'i like turtle']; // 设置签名Cookie密钥

app.use(serve('./public'));
app.use(json({ pretty: false, param: 'pretty' }));
app.use(bodyparser({
  extendTypes: {
    json: ['application/x-javascript'] // will parse application/x-javascript type body as a JSON string 
  },
  onerror: function (err, ctx) {
    ctx.throw('body parse error', 422);
  }
}));

// 数据库
require('mongoose').Promise = global.Promise
app.use(mongoose({
    mongoose: require('mongoose-q')(), //custom mongoose ， mongoose-q 用于支持 es 6 的 promise
    // user: '',
    // pass: '',
    host: '127.0.0.1',
    port: 27017,
    database: 'test',
    db: {
        native_parser: true
    },
    server: {
        poolSize: 5 // 五个线程？
    }
}))
app.use(session({
  store: redisStore()
}));


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
// 压缩行内样式
pug.options.filters = {
  uglify: function (text, options) {
    if(config.debug){
      return text;
    } else {
      let result = UglifyJS.minify(text, {fromString: true});
      return result.code;
    }
  }
}
pug.locals.someKey = 'some value';






// 开发模式配置
if (config.debug) {
  onerror(app); // 错误处理
  // app.on('error', function(err){
  //   log.error('server error', err);
  // });

  app.use(logger())
  // app.use(convert(logger()));

}




// koa 默认有一个 favicon.ico 请求？
app.use( async ( ctx, next ) => {

  if ( ctx.url === '/admin' ) {
    ctx.cookies.set(
      'cid', 
      'you can see it',
      {
        domain: 'localhost',  // 写cookie所在的域名
        path: '/admin',       // 写cookie所在的路径
        maxAge: 10 * 60 * 1000, // cookie有效时长
        // expires: new Date('2017-02-15'),  // cookie失效时间
        httpOnly: false,  // 是否只用于http请求中获取
        // overwrite: false  // 是否允许重写
      }
    )
    // ctx.body = 'cookie is ok'

  }
  //  else {
  //   // ctx.body = 'hello world' 
  //   ctx.render('index');
  // }
  await next();

})


// 装载所有子路由
let router = new Router()
// router.use('/', home.routes(), home.allowedMethods())
// router.use('/page', page.routes(), page.allowedMethods())











// app.use(async (ctx, next) => {
//   const start = new Date();
//   await next();
//   const ms = new Date() - start;
//   console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
//   // console.log(ctx.cookies)
// });

// response
// app.use(ctx => {
//   // ctx.body = 'ctx.cookies';
//   ctx.render('admin')
// });






// 启动程序
const server = app.listen(config.port, (x) => {
  console.log(server._connectionKey, '启动成功')
  console.log('环境：', process.env.NODE_ENV )
});