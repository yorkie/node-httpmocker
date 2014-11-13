
HTTP Mocker
===========================

[![Build Status](https://travis-ci.org/yorkie/node-httpmocker.svg)](https://travis-ci.org/yorkie/node-httpmocker)

[![NPM](https://nodei.co/npm/httpmocker.png?stars&downloads)](https://nodei.co/npm/httpmocker/)

[![NPM](https://nodei.co/npm-dl/httpmocker.png)](https://nodei.co/npm/httpmocker/)

`httpmocker` is a testing tool for mocking any requests that you are not able to access in your test file.

### Features

* don't change any source codes from your lib directory
* configurable (easy to filter requests)

### Why?

Sometimes, you may use these third-party modules like `node-aws`, `node-semantics3` those control how the program call requests over HTTP/HTTPS, so if you wanna accurately filter these requests, it's hacky and ugly.

Imagine the following aws codes:

```js
// create the AWS.Request object
var request = new AWS.EC2().describeInstances();

// register a callback to report on the data
request.on('success', function(resp) {
  console.log(resp.data); // log the successful data response
});

// send the request
request.send();
```

if you wanna filter your program in your testing progress, you have to add 2 lines in your source code:

```js
if (process.env.NODE_ENV === 'test')
  // return or callback
```

once there are the certain amount number of third-party function calls in your source, you then need to write the corresponding number of above blocks, that's aweful.

### Let's be graceful from `httpmocker`

In your test file:

```js
var configmock = require('httpmocker').config;
configmock({
  'https://api.aws.com/': {
    error: null,
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: {foo: 'bar'}
  }
});
```

then when you do request:

```js
request.send();
```

it will return:

```js
function onresponse (res) {
  // res.statusCode = 200;
  // res.headers['Content-Type'] = 'application/json';
  // res.body = {foo: 'bar'};
}
```

### API

`httpmocker` exports one function `httpmocker.config(config)`, it provides a way to define responses which you are going to expect to mock.

The `config` is an object that maps the router, `Object.keys(config)` should return urls(prefix) that you wanna mock for testing. And every url prefix should hold a object that like:

```json
{
  "error": "...your error if you wanna throw",
  "statusCode": 400, // or status
  "headers": {
    "head1_key": "head1_value"
  },
  "body": "string/buffer/object, will write to readable instance"
}
```

`httpmocker` exports 2nd function `httpmocker.clear([url])`, it provides a way to clear config that you set, it receives one optional argument, if provided, will remove config by `url` that you would pass, if not, will remove all configurations.

**NOTE**: please use `httpmocker` with `NODE_ENV=test`

### Installation

Recommended command to install
```sh
$ npm install httpmocker --save-dev
```

### License

MIT. Copyright (c) [Yorkie Liu](https://github.com/yorkie)
