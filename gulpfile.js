'use strict'
const config = require('./config');
const gulp = require('gulp');
const nodemon = require('gulp-nodemon');
const browserSync = require('browser-sync').create(config.name); // config.name 用于 区别？

// js 处理
const browserify = require('gulp-browserify');
const uglify = require("gulp-uglify");
const concat = require("gulp-concat");
const babel = require('gulp-babel');

// 样式表处理
const stylus = require('gulp-stylus');
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');  // 就是开发调试的时候压缩文件映射到源文件

// 图片处理
const imagemin = require('gulp-imagemin');

// 错误处理
const plumber = require('gulp-plumber');

// // 待使用
// const data = require('gulp-data');        //  数据处理
// const cache = require('gulp-cached');     // 通过缓存的形式，未修改的文件不放到管道中，针对 css，js
// const changed = require('gulp-changed');  // 不让未经修改的文件进入管道数据流中，主要针对图片
// const remember = require('gulp-remember');
// const newer = require('gulp-newer');
// const filter = require('gulp-filter');





// 路径定义
const paths = {
  'routes': './routes/*.js',
  'models': './models/schemas/*.js',
  'js': './dev/public/js/*.js',
  'styl': './dev/public/stylus/*.styl',
  'css': './public/stylesheet/',
  'imgOrigin': './dev/public/images/*.jpg'
};


// js 打包编译程序
gulp.task('scripts', function() {
    // Single entry point to browserify 
    gulp.src('./dev/public/js/origin.js')
        .pipe(plumber())
        .pipe(babel({
            presets: ['es2015'] // es6 编译 成 es5
        }))
        .pipe(browserify({
          insertGlobals : true,
          debug : false  //!gulp.env.production
        }))
        .pipe(rename('bundle.js'))
        .pipe(uglify({
          mangle: true,               // 是否修改变量名，默认为 true
          compress: true,             // 是否完全压缩，默认为 true
          preserveComments: 'license' //'all'     // 保留所有注释
        }))
        .pipe(gulp.dest('./public/js/'))
});


// 编译 stylus，开发模式的调试使用
gulp.task('stylus2css', function () {
  return gulp.src(paths.styl)
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(stylus())
    .pipe(cleanCSS())  // 压缩，可以 设置兼容 ie 8
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(paths.css));
});

gulp.task('minImage', () =>
    gulp.src(paths.imgOrigin)
        .pipe(imagemin())
        .pipe(gulp.dest('./public/images/'))
);




// 应用自动重启， 第一次载入速度非常慢，不知道什么原因
gulp.task('serve', function () {
  nodemon({
    script: 'app',
    ext: 'js',
    ignore: [
      './public/',
      './idea/',
      './dev/public/',
    ],
    env: { 'NODE_ENV': 'development' }
  });
});


// 前端页面自动刷新
const openBrowser = (process.platform === 'win32')?false:true;
gulp.task('browser', function() {
  browserSync.init({      // null 干什么用？
      proxy: 'http://localhost:' + config.port,   // 监控代理地址
      files: ['./public', './views'],             // 监控的文件
      open:  false,//  openBrowser,                          // 是否打开浏览器
      browser: 'google chrome',                   // 打开的浏览器名称
      notify: false,                              // 浏览器不现实通知，不知道什么意思
      port: 5000                                  // 映射到的地址
  });
  gulp.watch(paths.styl, ['stylus2css']);         // 监控该文件夹， 后面对应的处理任务名
  gulp.watch(paths.js, ['scripts']);         // 监控该文件夹， 后面对应的处理任务名
  gulp.watch(paths.imgOrigin, ['minImage']);         // 监控该文件夹， 后面对应的处理任务名
});




gulp.task('default', ['serve', 'browser']);