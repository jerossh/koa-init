const Koa = require('koa');
const app = new Koa();
const config = require('./config');
const bodyparser = require('koa-bodyparser');
const json = require('koa-json');
const static = require('koa-static');
const Busboy = require('busboy');
const serve = require('koa-static');
const Router = require('koa-router'); 
const Pug = require('koa-pug');
// const co = require('co');  // generation 函数 支持 
// const convert = require('koa-convert'); // 转换 promise 支持 koa 2
const mongoose = require('koa-mongoose');
const session = require('koa-generic-session'); // different from koa-session(it is cookie session).
const redisStore = require('koa-redis');
const onerror = require('koa-onerror');
const logger = require('koa-logger');
const UglifyJS = require('uglify-js');

const adminRoute = require('./routes/admin');
const indexRoute = require('./routes/index');


// 如果不存在 环境模式，则设置为生产模式
if (!config.debug) {
  process.env.NODE_ENV = 'production'
}


// 中间件配置
app.keys = ['im a newer secret', 'i like turtle']; // 设置签名Cookie密钥

app.use(static('./public'));
app.use(json({ pretty: false, param: 'pretty' }));
app.use(bodyparser({
  extendTypes: {
    json: ['application/x-javascript'] // will parse application/x-javascript type body as a JSON string 
  },
  onerror: function (err, ctx) {
    ctx.throw('body parse error', 422);
  }
}));
// 对于POST请求的处理，koa-bodyparser中间件可以把koa2上下文的formData数据解析到ctx.request.body中


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
  key: 'koa-session',
  ttl: 15 * 60 * 1000,
  store: redisStore()
}));


const pug = new Pug({
  viewPath: './views',
  debug: config.debug,
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
    if (config.debug) {
      return text;
    } else {
      let result = UglifyJS.minify(text, {fromString: true});
      return result.code;
    }
  }
}
pug.locals._info = config.programSetting;
pug.locals._env = config.debug;


// 开发模式配置
if (config.debug) {
  onerror(app); // 错误处理
  // app.on('error', function(err){
  //   log.error('server error', err);
  // });

  app.use(logger())
  // app.use(convert(logger()));

}


// 设置cookie； koa 默认有一个 favicon.ico 请求？
app.use( async ( ctx, next ) => {

  if ( ctx.url === '/admin' ) {
    ctx.cookies.set(
      'cid', 
      'you can see it',
      {
        domain: 'localhost',  // 写cookie所在的域名
        path: '/admin',       // 写cookie所在的路径
        maxAge: 30 * 60 * 1000, // cookie有效时长
        // expires: new Date('2017-02-15'),  // cookie失效时间
        httpOnly: false,  // 是否只用于http请求中获取
        // overwrite: false  // 是否允许重写
      }
    )
    // ctx.body = 'cookie is ok'
    get.call(ctx);

  }
  //  else {
  //   // ctx.body = 'hello world' 
  //   ctx.render('index');
  // }
  await next();

})


// 装载所有子路由
const router = new Router();
router.use('/', indexRoute.routes(), indexRoute.allowedMethods());
// router.use(['/users', '/admin'], adminRoute.routes(), adminRoute.allowedMethods());
// adminRoute.use(authorize())
router.use('/admin', adminRoute.routes(), adminRoute.allowedMethods());
router.get('/:d', async (ctx) => {
  ctx.body = '该页面不存在'
  
})

// 加载路由中间件
app.use(router.routes()).use(router.allowedMethods())



// app.use(async (ctx, next) => {
//   const start = new Date();
//   await next();
//   const ms = new Date() - start;
//   console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
//   // console.log(ctx.cookies)
// });

// response
// app.use(ctx => {
//   ctx.body = 'ctx.cookies';
//   // ctx.render('admin')
// });


// app.use(ctx => {
//   ctx.body ='11111';
// });


function get() {
  var session = this.session;
  session.count = session.count || 0;
  session.count++;
  this.body = session.count;
}
 
function remove() {
  this.session = null;
  this.body = 0;
}
 
async function regenerate() {
  get.call(this);
  await this.regenerateSession();
  get.call(this);
}



// 启动程序
let port = config.port
const server = app.listen(port, (err) => {
  if (err) console.log('错误', err)
  console.log(server._connectionKey, '启动成功')
  console.log('环境：', process.env.NODE_ENV )
});

server.on('error', ()=> {
  console.log('错误端口被占用', server.listen(++port))
})