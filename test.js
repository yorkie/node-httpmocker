
var test = require('tape');
var httpmocker = require('./index');
var http = require('http');
var https = require('https');
var es = require('event-stream');

httpmocker.config({
  'http://apis.google.com/': {
    statusCode: 302,
    body: 'abcdefg'
  },
  'https://apis.yota.com/': {
    statusCode: 200,
    body: { foo: 'bar' }
  },
  'https://apis.xmljs.com/': {
    statusCode: 200,
    headers: {'content-type': 'application/xml'},
    body: '<xml></xml>'
  },
  'https://apis.no-body.com/': {
    statusCode: 400
  },
  'http://routes.com/users/:id': {
    statusCode: 404,
    body: 'not found'
  },
  'http://routes.com/status': {
    statusCode: 200,
    body: 'ok'
  },
  'http://user:pass@auth.com/': {
    statusCode: 200,
    body: 'ok'
  }
});

test('http.get mocking', function (t) {
  http.get({
    method: 'GET',
    host: 'apis.google.com',
    path: '/demo'
  }, function (res) {
    t.deepEqual(httpmocker.last, {url: 'http://apis.google.com/demo', method: 'GET'});
    t.equal(res.statusCode, 302);
    t.equal('function', typeof res.end);
    t.equal('function', typeof res.setTimeout);
    res.pipe(es.wait(function (err, text) {
      t.equal(text+'', '"abcdefg"');
      t.end();
    }));
  });
});

test('http.request mocking', function (t) {
  var req = http.request({
    method: 'POST',
    host: 'apis.google.com',
    path: '/demo'
  });
  req.on('response', function (res) {
    t.deepEqual(httpmocker.last, {url: 'http://apis.google.com/demo', method: 'POST'});
    t.equal(res.statusCode, 302);
    t.equal('function', typeof res.end);
    t.equal('function', typeof res.setTimeout);
    res.pipe(es.wait(function (err, text) {
      t.equal(text+'', '"abcdefg"');
      t.end();
    }));
  });
  req.end();
});

test('https.get mocker', function (t) {
  https.get({
    method: 'GET',
    host: 'apis.yota.com',
    path: '/demo'
  }, function (res) {
    t.deepEqual(httpmocker.last, {url: 'https://apis.yota.com/demo', method: 'GET'});
    t.equal(res.statusCode, 200);
    t.equal('function', typeof res.end);
    t.equal('function', typeof res.setTimeout);
    res.pipe(es.wait(function (err, text) {
      t.equal(text+'', JSON.stringify({foo:'bar'}));
      t.end();
    }));
  });
});

test('https.request mocker', function (t) {
  var req = https.request({
    method: 'POST',
    host: 'apis.yota.com',
    path: '/demo'
  });
  req.on('response', function (res) {
    t.deepEqual(httpmocker.last, {url: 'https://apis.yota.com/demo', method: 'POST'});
    t.equal(res.statusCode, 200);
    t.equal('function', typeof res.end);
    t.equal('function', typeof res.setTimeout);
    res.pipe(es.wait(function (err, text) {
      t.equal(text+'', JSON.stringify({foo:'bar'}));
      t.end();
    }));
  });
  req.end();
});

test('https.request mocker with xml type', function (t) {
  var req = https.request({
    method: 'POST',
    host: 'apis.xmljs.com',
    path: '/demo'
  });
  req.on('response', function (res) {
    t.deepEqual(httpmocker.last, {url: 'https://apis.xmljs.com/demo', method: 'POST'});
    t.equal(res.statusCode, 200);
    t.equal('function', typeof res.end);
    t.equal('function', typeof res.setTimeout);
    res.pipe(es.wait(function (err, text) {
      t.equal(text+'', '<xml></xml>');
      t.end();
    }));
  });
  req.end();
});

test('https.request mocker without body', function (t) {
  var req = https.request({
    method: 'GET',
    host: 'apis.no-body.com',
    path: '/demo'
  });
  req.on('response', function (res) {
    res.pipe(es.wait(function (err, text) {
      t.equal(text.length, 0);
      t.end();
    }));
  });
  req.end();
});

test('http.get mocker with route', function (t) {
  http.get({
    host: 'routes.com',
    path: '/users/123'
  }, function (res) {
    t.equal(res.statusCode, 404);
    t.equal('function', typeof res.end);
    t.equal('function', typeof res.setTimeout);
    res.pipe(es.wait(function (err, text) {
      t.equal(text+'', '"not found"');
      t.end();
    }));
  });
});

test('http.get mocker with route', function (t) {
  http.get({
    host: 'routes.com',
    path: '/status/api'
  }, function (res) {
    t.equal(res.statusCode, 200);
    t.equal('function', typeof res.end);
    t.equal('function', typeof res.setTimeout);
    res.pipe(es.wait(function (err, text) {
      t.equal(text+'', '"ok"');
      t.end();
    }));
  });
});

test('auth string', function (t) {
  http.get({
    host: 'auth.com',
    path: '/',
    auth: 'user:pass'
  }, function (res) {
    t.equal(res.statusCode, 200);
    t.equal('function', typeof res.end);
    t.equal('function', typeof res.setTimeout);
    res.pipe(es.wait(function (err, text) {
      t.equal(text+'', '"ok"');
      t.end();
    }));
  });
});

test('auth object', function (t) {
  http.get({
    host: 'auth.com',
    path: '/',
    auth: {
      user: 'user',
      pass: 'pass'
    }
  }, function (res) {
    t.equal(res.statusCode, 200);
    t.equal('function', typeof res.end);
    t.equal('function', typeof res.setTimeout);
    res.pipe(es.wait(function (err, text) {
      t.equal(text+'', '"ok"');
      t.end();
    }));
  });
});
