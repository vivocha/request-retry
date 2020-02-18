# Vivocha Request-Retry

_HTTP requests with configurable retries and API utilities._

[![NPM version](https://img.shields.io/npm/v/@vivocha/request-retry.svg?style=flat)](https://www.npmjs.com/package/@vivocha/request-retry)  [![Build Status](https://travis-ci.com/vivocha/request-retry.svg?branch=master)](https://travis-ci.org/vivocha/request-retry)  [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

**Vivocha Request-Retry** is a library to call API endpoints / do HTTP calls with configurable, automatic, call retries in case of errors.
It dependes from `request-promise-native` module, and it also exports all from `request` module as `classicRequest`, and exports all from `request-promise-native` as `requestPromise`.
This library exposes the following classes.

## `APIClient`

General HTTP client with configurable retry option.

### Methods

#### `call(options: APICallOptions)`

Quick Examples (TypeScript):

**1) Do a `GET` call to `https://my-super-server.test-api.com:8443/api/things` with a maximum of 3 retries in case of any error, waiting for 2000ms before each retry**

```javascript
const client = new APIClient('https://my-super-server.test-api.com:8443');
const opts: APICallOptions = {
    method: 'get',
    path: '/api/things',
    json: true,
    retries: 3,
    retryAfter: 2000
};
const result = await client.call(opts);
```

**2) Do an authenticated `POST` call to `https://my-super-server.test-api.com:8443/api/things`, with a maximum of 5 retries in case of any error excluding a 401, waiting for 1000ms before each retry**

```javascript
const client = new APIClient('https://my-super-server.test-api.com:8443');
const opts: APICallOptions = {
    method: 'post',
    path: '/api/things',
    authOptions: {
      authorizationType = 'Bearer',
      token: 'abcd-1234'
    },
    json: true,
    body: {
      type: 'lamp'
      model: 'X-100'
    },
    retries: 5,
    retryAfter: 1000,
    doNotRetryOnErrors: [401]
};
const result = await client.call(opts);
```

**3) Do a `GET` call to `https://my-super-server.test-api.com:8443/api/things` with a maximum of 3 retries in case of any error, waiting for 2000ms before each retry and getting a full HTTP response**

```javascript
const client = new APIClient('https://my-super-server.test-api.com:8443');
const opts: APICallOptions = {
    method: 'get',
    path: '/api/things',
    json: true
    retries: 3,
    retryAfter: 2000,
    getFullResponse: true
};
const result = await client.call(opts);
```

`APICallOptions` is an object with the following properties:

```javascript
{
  method: 'get' | 'post' | 'put' | 'delete' | 'options' | 'head' | 'patch';
  path: string;
  qs?: any;
  body?: any;
  headers?: any,
  json?: boolean,
  authOptions?: HTTPAuthOptions;
  timeout?: number;
  retries: number;
  retryAfter: number;
  doNotRetryOnErrors?: number[];
  getFullResponse?: boolean;
}
```

Properties are listed in the following table (required ones in **bold**):

| PROPERTY             | VALUE                                                                                     | DESCRIPTION                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `method`             | (optional) string: `get` or `post` or `put` or `delete` or `options` or `head` or `patch` | HTTP method of the request (default is `get`)                                                                                                                                                                                                                                                                                                     |
| `path`               | (optional) string                                                                         | relative (to `baseUrl`, constructor param) path of the endpoint to call (default is '')                                                                                                                                                                                                                                                           |
| `qs`                 | (optional) object                                                                         | query string params                                                                                                                                                                                                                                                                                                                               |
| `body`               | (optional) object                                                                         | JSON body to send to the endpoint                                                                                                                                                                                                                                                                                                                 |
| `json`               | (optional) boolean                                                                        | if true, let `request` automatically send and parse JSON bodies, setting the headers properly. Default is false, and headers must be set accordingly                                                                                                                                                                                              |
| `headers`            | (optional) object                                                                         | HTTP headers to send                                                                                                                                                                                                                                                                                                                              |
| `authOptions`        | (optional) object                                                                         | See HTTPAuthOptions below                                                                                                                                                                                                                                                                                                                         |
| `timeout`            | (optional) number                                                                         | set timeout value, in milliseconds                                                                                                                                                                                                                                                                                                                |
| **`retries`**        | number                                                                                    | Max number of retries in case of error calling the endpoint                                                                                                                                                                                                                                                                                       |
| `retryAfter`         | (optional) number                                                                         | Number of milliseconds to wait before each call retry. If set it takes precedence over `minRetryAfter`  (see **Configuring Retries** section in this document)                                                                                                                                                                                    |
| `minRetryAfter`      | (optional) number                                                                         | Number of milliseconds to wait before the first call retry. Then, waiting time before the next calls is computed doubling the previous waiting time + a random amount of milliseconds. When `maxRetryAfter` threshold is reached, waiting time become constant to `maxRetryAfter`, if set (see **Configuring Retries** section in this document). |
| `maxRetryAfter`      | (optional) number, **default is 10 minutes**                                              | Max number of milliseconds to wait before next call retry (see **Configuring Retries** section in this document)                                                                                                                                                                                                                                  |
| `doNotRetryOnErrors` | (optional) array of HTTP error code numbers (e.g., `401`, `404`, ...)                     | The client WILL NOT retry the call in case of an HTTP error code included in this array                                                                                                                                                                                                                                                           |
| `getFullResponse`    | (optional) boolean                                                                        | when true, the client returns the full HTTP Response object, default is false (only body is returned)                                                                                                                                                                                                                                             |

where `HTTPAuthOptions` is an object as follows:

```javascript
{
  authorizationType?: string;
  token?: string;
  user?: string;
  password?: string;
}
```

| PROPERTY            | VALUE             | DESCRIPTION                                                                                                          |
| ------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| `authorizationType` | (optional) string | Authentication type different from `Basic`, like: `Bearer`, `App`,... If specified, the `token` property is required |
| `token`             | (optional) string | Authentication token                                                                                                 |
| `user`              | (optional) string | username for Basic Authentication, if specified then `password` property is required                                 |
| `password`          | (optional) string | password for Basic Authentication, if specified then `user` property is required                                     |

#### Useful shortcut static methods (get, post, put, patch, head)

The following static, async methods are shortcuts for the `call()` method to use common HTTP methods. They all return a Promise with the results.

##### `APIClient.get(url: string, options: APICallOptions = { retries: 2, retryAfter: 1000 }, logger?: Logger)`

##### `ApiClient.post(url: string, body: any, options: APICallOptions = { retries: 2, retryAfter: 1000 }, logger?: Logger)`

##### `APIClient.put(url: string, body: any, options: APICallOptions = { retries: 2, retryAfter: 1000 }, logger?: Logger):`

##### `APIClient.delete(url: string, options: APICallOptions = { retries: 2, retryAfter: 1000 }, logger?: Logger)`

##### `APIClient.patch(url: string, body: any, options: APICallOptions = { retries: 2, retryAfter: 1000 }, logger?: Logger)`

##### `APIClient.head(url: string, options: APICallOptions = { retries: 2, retryAfter: 1000, getFullResponse: true }, logger?: Logger)`

---

### Configuring Retries

`APIClient.call()` method (and all the shortcut static methods) can be configured to automatically retry HTTP calls in case of errors.
Call retries configuration can be set using the following `APICallOptions` specific properties: `retries` (mandatory), `retryAfter` (optional), `minRetryAfter` (optional), and `maxRetryAfter` (optional).
Briefly, the rules applied for retrying calls are the following:

- mandatory `retries` option is the total number of retries to do in case of errors calling a URL; retrying stops when the total number of retries is reached;
- `retryAfter`, in milliseconds: if set, before attempting a new call retry, the client will wait for this milliseconds amount.
  - If set and `minRetryAfter` is **NOT SET** then the waiting time is constant between retries, and this value is always used.
  - If **NOT SET** and also `minRetryAfter` is **NOT SET** then the constant wait time is set to 1000 ms.
- `minRetryAfter`, in milliseconds: if set, it is the waiting time before attempting the first retry call; then, if new call retries must be done, the waiting time will be computed using the following formula: `2 * currentWaitingTime + some random millis (between 0 and 50)`;
  - If also `maxRetryAfter` param is set, then when this value is reached after applying the formula, the waiting time becomes constant and `maxRetryAfter` is used, until `retries` number is reached.
  - If `maxRetryAfter` param is **NOT SET**, default is 10 minutes, and waiting time value continues growing, until the number of `retries` is reached. But, after 10 min is reached, remaining retries will use this constant value.
