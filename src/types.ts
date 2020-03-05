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
    super(message || data?.message);
    this.name = name || 'APICallError';
    this.data = data;
    this.status = status || data?.status;
  }
}
