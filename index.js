
var url = require('url');
var util = require('util');
var http = require('http');
var https = require('https');
var stream = require('stream');
var pathToRegexp = require('path-to-regexp');

var originHttpRequest = http.request;
var originHttpsRequest = https.request;
var mockconfigSource = {};
var latestRequestURL = null;
var latestRequestMethod = null;

util.inherits(OutgoingMessage, stream.Readable);
function OutgoingMessage () {
  if (!(this instanceof OutgoingMessage))
    return new OutgoingMessage();
  stream.Readable.call(this);
  http.OutgoingMessage.call(this);
}

//
// nothing
//
function noop () {}

//
// resolves option and then generate corresponding response object
//
function resolveResponse (options, callback) {
  var resp = new OutgoingMessage();
  resp.statusCode = 200;
  resp.headers = {};
  resp._read = noop;
  resp.write = noop;

  if ((options.port === 80 && options.protocol === 'http')
    || (options.port === 443 && options.protocol === 'https'))
    options.port = false;

  if (options.auth && options.auth.user && options.auth.pass) {
    var str = options.auth.user + ':' + options.auth.pass;
    options.auth = str;
  }

  options.pathname = options.path;
  var requesturl = url.format(options);
  var configSource;
  var configs = Object.keys(mockconfigSource).reverse();
  for (var i = 0; i < configs.length; i++) {
    var prefix = configs[i];
    if (urlMatch(requesturl, prefix)) {
      configSource = mockconfigSource[prefix];
      break;
    }
  }

  if (!configSource)
    return false;
  else {
    latestRequestURL = requesturl;
    latestRequestMethod = options.method || 'GET';
  }

  resp.setTimeout = function () {
    // For now, this function will never be called because of in test environment,
    // but TODO: support timeout in config
  };

  resp.end = function () {
    var err = configSource.error || null;
    configSource.statusCode = configSource.statusCode || configSource.status;
    if (configSource.statusCode)
      resp.statusCode = configSource.statusCode;
    if (configSource.headers || configSource.header)
      for (var key in (configSource.headers || configSource.header))
        resp.headers[key.toLowerCase()] = configSource.headers[key];

    var body;
    if (configSource.body) {
      if (!resp.headers['content-type'] ||
        resp.headers['content-type'].search('application/json') === 0)
        body = JSON.stringify(configSource.body);
      else
        body = configSource.body.toString();
      resp.headers['content-length'] = body.length;
    } else {
      body = '';
    }
    resp.push(body);
    resp.push(null);

    if (typeof callback === 'function')
      callback(resp);
    if (err)
      resp.emit('error', err);
    else
      resp.emit('response', resp);
  };
  return resp;
}

//
// create request function for http/https
//
function requestor (type) {
  return function (options, callback) {
    var ret;
    options.protocol = type;
    if (process.env.NODE_ENV === 'test'
      && (ret = resolveResponse(options, callback))) {
      return ret;
    } else if (type === 'https') {
      delete options.protocol;
      return originHttpsRequest.call(https, options, callback);
    } else {
      delete options.protocol;
      return originHttpRequest.call(http, options, callback);
    }
  }
}

// config mocks
function configMock (config) {
  if (config)
    for (var url in config)
      mockconfigSource[url] = config[url];
}

//
// check request url match the config mock url
//
function urlMatch (requestUrl, mockUrl) {
  if (requestUrl === mockUrl)
    return true;

  var parsedRequestUrl = url.parse(requestUrl);
  var parsedMockUrl = url.parse(mockUrl);

  if (pathToRegexp(parsedMockUrl.path, [], {}).exec(parsedRequestUrl.path))
    return true;

  if (requestUrl.search(mockUrl) !== -1)
    return true;

  return false;
}

// clear configs
function clear (url) {
  if (url)
    delete mockconfigSource[url];
  else
    mockconfigSource = {};
}

// inject on http/https
http.request = requestor('http');
https.request = requestor('https');

// exports
module.exports = {

  config: configMock,
  clear: clear,

  get last () {
    return {
      method: latestRequestMethod,
      url: latestRequestURL
    };
  }
};
