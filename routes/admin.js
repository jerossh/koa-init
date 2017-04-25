const Router = require('koa-router'); 

let admin = new Router();
admin.get('/', ( ctx ) => {
    ctx.render('admin')
})

module.exports = admin;