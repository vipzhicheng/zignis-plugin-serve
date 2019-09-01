zignis-plugin-serve
===================

`zignis-plugin-serve` 是一个简易的 HTTP Server 工具，类似的工具有很多，包括但不限于：

* [http-server](https://www.npmjs.com/package/http-server)
* [serve](https://www.npmjs.com/package/serve)

还有一些工具，比如 `hexo`，本来是个博客工具，也自带了 HTTP Server 的功能，`umi`，本来是个前端开发脚手架，也自带了启动 HTTP Server 的功能，当然，还有大名鼎鼎的 `create-react-app` 等等，而且 node 本身写一个简单的Web服务器也不是很复杂，那为什么还要去做一个新的轮子呢？

## 为什么造这个轮子

其中一个原因是看到了一个项目 `osgood`，其实现了基于命令行工具快速定义路由和控制器的思路。另外，由于 `Zignis` 做为一个命令行开发框架，其价值就是按需封装各种各样的命令行工具，而且其命令，脚本都有相对统一的模块风格，那就是基于约定导出固定变量用于固定用途的约定大于配置的思路。将二者结合就形成了这个新的 HTTP Server 工具，其 Web Server 部分基于 koa 及其中间件实现，定制性较强，这个轮子主要就是制定规则，提供相关语法糖。

感谢 `Koa` 的简洁和灵活，我们可以按需定制所需要的特性，本程序使用 `Koa` 来实现 Web 服务以及各种扩展功能

## 特性

* 同时支持静态资源服务和后端接口服务，
* 后端服务，目录结构就是路由结构
* 后端服务路由可以灵活配置，内置了参数验证机制
* 后端服务可以引入全局中间件和单个路由中间件，也可以禁用内置中间件
* 支持一些个性化选项，个性化选项也都可以在配置文件(`.zignisrc`)中设置
* 支持端口占用自动检测
* 支持和SPA模式和404模式

## 安装

```
npm i -g zignis zignis-plugin-serve
```

## 使用

```bash
zignis serve [publicDir]

simple server tool

选项：
  --port, -p                                    server port                                              [默认值: false]
  --list, -l                                    list routes
  --init-koa, -i                                initial koa application                                  [默认值: false]
  --api-prefix                                  prefix all routes                                       [默认值: "/api"]
  --spa                                         fallback to index.html
  --gzip                                        enable gzip
  --routeDir                                    routes location
  --publicDir                                   static files location
  --file-index                                  index file name                                   [默认值: "index.html"]
  --file-404                                    index file name                                          [默认值: false]
  --disable-internal-middleware-custom-error    disable internal middleware custom error
  --disable-internal-middleware-custom-static   disable internal middleware custom static
  --disable-internal-middleware-custom-router   disable internal middleware custom router
  --disable-internal-middleware-koa-logger      disable internal middleware koa-logger
  --disable-internal-middleware-koa-bodyparser  disable internal middleware koa-bodyparser
  --disable-internal-middleware-koa-kcors       disable internal middleware kcors
```

## 命令行使用说明

### 路由代码生成器

借助于 Zignis 提供的统一的代码生成入口和扩展性，我们实现了一个简单的路由代码生成器

```
zignis make route a/b/c
```

### 查看声明的路由地址

```
zignis serve --list
```

### 启动服务

```
zignis serve [publicDir]
zignis serve # 默认当前目录
```

### watch 模式

借助 nodemon 模块

```
npm i -g nodemon
nodemon --exec 'zignis serve'
```

## 路由系统说明

### 一个路由的样子

#### 完整版

```js
exports.name = 'signup' // 给路由起个名字
exports.method = 'post' // 支持各种 HTTP 请求方法
exports.path = 'abc' // 自动添加到路径路由的后面
exports.middleware = [] // 为单个路由指定前置中间件
exports.validate = { // 请求参数验证
  username: 'required'
}
exports.handler = async ctx => {} // 路由回调
```

#### 简单版

```js
module.exports = async ctx => {}
```

### ctx 的约定用法

#### 关闭默认的 json 响应格式

```js
ctx.json = false
```

#### 自定义错误码

这里要注意的是抛出的错误码必须经过定义

```js
ctx.errors[10001] = '自定义错误消息'
// 或
ctx.error(10001, '自定义错误消息', 405)

throw new ctx.Exception(10001, '重写错误消息)
```

#### Mock 数据

命令内置了 `mockjs` 库，只需要通过 `ctx.Mock` 和 `ctx.mock` 就能访问，`ctx.mock === ctx.Mock.mock`。

#### gzip 压缩

当选项 `--gzip` 设置为 true 以后，默认凡是内容类型包含 text 的响应都会进行 gzip 压缩，如果想关闭可以在路由响应函数里进行如下操作：

```js
module.export = async ctx => {
  ctx.compress = false
  // 或
  ctx.gzip = false
}
```

### 路由前缀

我们默认的路由前缀是 /api，因为默认的使用场景是前端静态目录和后端动态接口都支持，如果仅仅是使用后端功能，可以改写前缀，或者清空前缀。

### 特殊的路由

index 文件名的路由在我们对路由的理解里有特殊含义，因为我们一般不需要一个路由这样访问：`/api/a/b/index`，而只需要是 `/api/a/b`，所以如果我们不是将路由实现在 `b.js`里，而是`b/index.js`，效果是一样的。

### SPA模式和404模式

只要在启动时加上 `--spa` 选项，不存在的路径就会指向默认的 `index.html`，需要注意的是 `--api-prefix` 选项指定的 API前缀下的路由即使找不到也只是会抛出路由不存在的异常响应，而不会指向 `index.html`，这么做的目的是为了同时支持前后端的使用场景。

如果不使用SPA模式，并且配置了 `--file-404` 选项，比如404.html，则所有不存在的404静态资源都会使用这个配置的静态页面进行输出，如果设置为 false 关闭了这个选项，则会输出为 `Not found` 字符串。

### 启用

## 中间件的禁用和扩展

通过工具提供的选项可以看出，所有内置的中间件都可以禁用，而且可以通过 `--init-app` 的选项注入一个模块来添加更多的中间件，两个特性一起使用的话，可以完全自定义 koa 所需要的所有的中间件，当然如果是这么做的话，那本工具也就没必要使用了。

```js
// init-app.js
// zignis serve --init-app init-app.js
module.exports = (app) => {
  app.use(async (ctx, next) => {
    
    await next()
  })
}


## 开源协议

MIT