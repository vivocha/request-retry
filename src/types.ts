export interface HTTPAuthOptions {
  authorizationType?: string;
  token?: string;
  user?: string;
  password?: string;
}
export type errorCodePattern = number | string;
export interface APICallOptions {
  method?: APICallOptions.Method;
  path?: string;
  qs?: any;
  body?: any;
  headers?: any;
  json?: boolean;
  authOptions?: HTTPAuthOptions;
  timeout?: number;
  retries: number;
  retryAfter?: number;
  minRetryAfter?: number;
  maxRetryAfter?: number;
  doNotRetryOnErrors?: errorCodePattern[];
  getFullResponse?: boolean;
  follow_max?: number; // default will be 3
  follow_set_cookies?: boolean; //Sends the cookies received in the set-cookie header as part of the following request, if hosts match. false by default.
  follow_set_referer?: boolean; //Sets the 'Referer' header to the requested URI when following a redirect. false by default.
  follow_keep_method?: boolean; //If enabled, resends the request using the original verb instead of being rewritten to get with no data. true by default.
  follow_if_same_host?: boolean; //When true, will only follow redirects that point to the same host as the original request. false by default.
  follow_if_same_protocol?: boolean; // When true,  will only follow redirects that point to the same protocol as the original request. false by default.
  follow_if_same_location?: boolean; // Unless true,  will not follow redirects that point to same location (as set in the response header) as the original request URL. false by default.
}

export namespace APICallOptions {
  export type Method = 'get' | 'post' | 'put' | 'delete' | 'options' | 'head' | 'patch' | 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' | 'HEAD' | 'PATCH';
}

export class APICallError extends Error {
  name: string;
  data: any;
  status: number;
  message: string;
  constructor(name?: string, data?: any, status?: number, message?: string) {
    super();
    this.message = message || data?.message;
    this.name = name || 'APICallError';
    this.data = data;
    this.status = status || data?.status;
  }
}

export interface APICallParams {
  [param: string]: string | number | boolean;
}
