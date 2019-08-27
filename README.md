zignis-plugin-serve
===================

`zignis-plugin-serve` 是一个简易的 HTTP Server 工具，类似的工具有很多，包括但不限于：

* [http-server](https://www.npmjs.com/package/http-server)
* [serve](https://www.npmjs.com/package/serve)

还有一些工具，比如 `hexo`，本来是个博客工具，也自带了 HTTP Server 的功能，`umi`，本来是个前端开发脚手架，也自带了启动 HTTP Server 的功能，而且 node 本身写一个简单的Web服务器也不是很复杂，那为什么还要去做一个新的轮子呢？

## 为什么造这个轮子

其中一个原因是看到了一个项目 `osgood`，其实现了基于命令行工具快速定义路由和控制器的思路。另外，由于 `Zignis` 做为一个命令行开发框架，其价值就是按需封装各种各样的命令行工具，而且其命令，脚本都有相对统一的模块风格，那就是基于约定导出固定变量用于固定用途的约定大于配置的思路。将二者结合就形成了这个新的 HTTP Server 工具，其 Web Server 部分基于 koa 及其中间件实现，定制型较强，这个插件主要是制定规则，提供相关语法糖。

## 特性

* 同时支持静态资源服务和后端接口服务，
* 后端服务，目录结构就是路由结构
* 后端服务内置了参数验证机制
* 后端服务可以引入全局中间件和单个路由中间件
* 支持一些选项，支持配置文件 .zignisrc
* 支持端口占用自动检测

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
  --preprocess-koa                              preprocess koa by application                            [默认值: false]
  --router-api-prefix                           prefix all routes                                       [默认值: "/api"]
  --disable-internal-middleware-koa-logger      disable internal middleware koa-logger
  --disable-internal-middleware-koa-bodyparser  disable internal middleware koa-bodyparser
  --disable-internal-middleware-koa-kcors       disable internal middleware kcors
  --disable-internal-middleware-koa-static      disable internal middleware koa-static
```

## 一个路由的样子

### 完整版

```js
exports.handler = async ctx => {} // 路由回调
exports.method = 'post' // 支持各种 HTTP 请求方法
exports.path = 'abc' // 自动添加到路径路由的后面
exports.validate = { // 请求参数验证
  username: 'required'
}
exports.name = 'signup' // 给路由起个名字
```

### 简单版

```js
module.exports = async ctx => {}
```

## ctx 的约定用法

### 关闭标准的 json 响应格式

```js
ctx.json = false
```

### 自定义错误码

```js
ctx.errors[10001] = '自定义错误消息'

throw new ctx.Exception(10001)
```