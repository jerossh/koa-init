const Router = require('koa-router'); 
const index = new Router();

index.get('/', async ( ctx ) => {
    ctx.render('index/pages/index', {}, true)
})

module.exports = index;