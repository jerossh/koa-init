'use strict'
const gulp = require('gulp');
const nodemon = require('gulp-nodemon');
const config = require('./config');
const browserSync = require('browser-sync').create(config.name);

// 应用自动重启， 第一次载入速度非常慢，不知道什么原因
gulp.task('serve', function () {
  nodemon({
    script: 'app',
    ext: 'js',
    ignore: [
      './public/',
      './idea/',
    ],
    env: { 'NODE_ENV': 'development' }
  })
});

// 前端页面自动刷新
const openBrowser = (process.platform === 'win32')?false:true;
gulp.task('start', function() {
  browserSync.init({      // null 干什么用？
      proxy: 'http://localhost:' + config.port,   // 监控代理地址
      files: ['./public', './views'],             // 监控的文件
      open: openBrowser,                          // 是否打开浏览器
      browser: 'google chrome',                   // 打开的浏览器名称
      notify: false,                              // 浏览器不现实通知，不知道什么意思
      port: 5000                                  // 映射到的地址
  });
//   gulp.watch(paths.styl, ['stylus2css']);         // 监控该文件夹， 后面对应的处理任务名
});

gulp.task('default', ['serve', 'start']);