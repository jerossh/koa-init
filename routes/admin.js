const Router = require('koa-router'); 


// ctx.render(tpl, locals, options, noCache)
let admin = new Router();
admin.get('/', ( ctx ) => {
    ctx.render('admin/pages/admin', {}, true)
})

module.exports = admin;