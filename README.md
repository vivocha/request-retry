# Vivocha Request-Retry

_HTTP requests with retry and API utilities._

**Vivocha Request-Retry** exports all from `request` module as `classicRequest`, exports all from `request-promise-native` as `requestPromise`, and adds the following classes/utils:

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
    retries: 3,
    retryAfter: 2000
};
const result = await client.call(opts);
```

**1) Do an authenticated `POST` call to `https://my-super-server.test-api.com:8443/api/things`, with a maximum of 5 retries in case of any error excluding a 401, waiting for 1000ms before each retry**

```javascript
const client = new APIClient('https://my-super-server.test-api.com:8443');
const opts: APICallOptions = {
    method: 'post',
    path: '/api/things',
    authOptions: {
      authorizationType = 'Bearer',
      token: 'abcd-1234'
    },
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

`APICallOptions` is an object with the following properties:

```javascript
{
  method: 'get' | 'post' | 'put' | 'delete' | 'options' | 'head' | 'patch';
  path: string;
  qs?: any;
  body?: any;
  headers?: any
  authOptions?: HTTPAuthOptions;
  retries: number;
  retryAfter: number;
  doNotRetryOnErrors?: number[];
}
```

| PROPERTY             | VALUE                                                                          | DESCRIPTION                                                                             |
| -------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| **`method`**         | string: `get` or `post` or `put` or `delete` or `options` or `head` or `patch` | HTTP method of the request                                                              |
| **`path`**           | string                                                                         | relative (to `baseUrl`, constructor param) path of the endpoint to call                 |
| `qs`                 | (optional) object                                                              | query string params                                                                     |
| `body`               | (optional) object                                                              | JSON body to send to the endpoint                                                       |
| `headers`            | (optional) object                                                              | HTTP headers to send                                                                    |
| `authOptions`        | (optional) object                                                              | See HTTPAuthOptions below                                                               |
| **`retries`**        | number                                                                         | Max number of retries in case of error calling the endpoint                             |
| **`retryAfter`**     | number                                                                         | Number of milliseconds to wait before each retry                                        |
| `doNotRetryOnErrors` | (optional) array of HTTP error code numbers (e.g., `401`, `404`, ...)          | The client WILL NOT retry the call in case of an HTTP error code included in this array |

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
