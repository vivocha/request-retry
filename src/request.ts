import { getLogger, Logger } from 'debuggo';
import * as rp from 'request-promise-native';
import { APICallError, APICallOptions } from './types';
import request = require('request');

export class APIClient {
  private firstCall: boolean;
  private readonly DEFAULT_MAX: number = 10 * 60 * 1000; // default maxRetryAfter is 10 minutes
  constructor(private baseUrl: string, protected logger = getLogger('vivocha.api-client')) {
    this.firstCall = true;
  }
  async call(options: APICallOptions): Promise<any> {
    if (!options?.method) {
      options.method = 'get';
    }
    if (typeof options?.path === 'undefined') {
      options.path = '';
    }
    const apiEndpoint = `${this.baseUrl}${options.path}`;
    try {
      const requestOpts: rp.RequestPromiseOptions = {
        method: options.method,
        headers: options.headers ? options.headers : {},
        simple: false,
        resolveWithFullResponse: true
      };
      if (options?.json) {
        requestOpts.json = true;
      }
      if (options.qs) {
        requestOpts.qs = options.qs;
      }
      if (options.body) {
        requestOpts.body = options.body;
      }
      // * Authentication
      if (options.authOptions?.token && options.authOptions?.authorizationType) {
        const authScheme = options.authOptions.authorizationType;
        const authType = authScheme === 'bearer' ? authScheme.charAt(0).toUpperCase() + authScheme.slice(1) : authScheme;
        requestOpts.headers = { ...requestOpts.headers, authorization: `${authType} ${options.authOptions.token}` };
      } else if (options.authOptions?.user && options.authOptions?.password) {
        requestOpts.auth = {
          user: options.authOptions.user,
          pass: options.authOptions.password
        };
      }
      // * Request timeout
      if (options.timeout) {
        requestOpts.timeout = options.timeout;
      }
      // * Do not retry on errors
      options.doNotRetryOnErrors = options.doNotRetryOnErrors && options.doNotRetryOnErrors.length ? options.doNotRetryOnErrors : [];

      this.logger.debug(`Calling API endpoint: ${options.method} ${apiEndpoint}`);

      const response: rp.FullResponse = await rp(apiEndpoint, requestOpts);
      this.logger.debug(`${options.method} ${apiEndpoint} response status`, response.statusCode);

      if (response.statusCode >= 200 && response.statusCode <= 299) {
        return options.getFullResponse ? response : response.body;
      } else {
        this.logger.error(`${options.method} ${apiEndpoint} call returned response error ${response.statusCode}, body: ${JSON.stringify(response.body)}`);

        if (options.retries === 0 || this.isDoNotRetryCode(options, response.statusCode)) {
          this.logger.warn('No more retries to do, throwing error');
          const error: APICallError = new APICallError(
            'APICallError',
            response.body,
            response.statusCode,
            `Error calling the API endpoint: ${options.method} ${apiEndpoint}`
          );
          this.logger.error('error', JSON.stringify(error), error.message);
          throw error;
        } else {
          // * Retrying
          // * compute the retry after milliseconds
          let computedRetryAfter: number;

          computedRetryAfter =
            options.retryAfter ||
            (options.minRetryAfter
              ? this.firstCall
                ? options.minRetryAfter
                : computeRetryAfter(options.minRetryAfter, true, options.maxRetryAfter || this.DEFAULT_MAX)
              : 1000);

          options.retries = options.retries - 1;
          this.firstCall = false;
          this.logger.debug(`Going to retry request ${options.method} ${apiEndpoint} in ${computedRetryAfter} ms...`);
          options.minRetryAfter = computedRetryAfter;
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              return resolve(this.call(options));
            }, computedRetryAfter);
          });
        }
      }
    } catch (error) {
      this.logger.error(`Error calling endpoint ${options.method} ${apiEndpoint}`);
      const apiError: APICallError =
        error instanceof APICallError ? (error as APICallError) : new APICallError(error.name || 'APICallError', null, undefined, error.message);
      throw apiError;
    }
  }
  private isDoNotRetryCode(options: APICallOptions, statusCode: number): boolean {
    if (!options.doNotRetryOnErrors?.length) {
      return false;
    } else if (options.doNotRetryOnErrors.includes(statusCode) || options.doNotRetryOnErrors.includes(statusCode.toString())) {
      return true;
    } else {
      //check if there are string patterns
      const errorPatterns: string[] = options.doNotRetryOnErrors.filter(e => typeof e === 'string') as string[];
      let isDoNotRetryCode = false;
      for (let status of errorPatterns) {
        const codexx = /(?<code>\d)xx/;
        const codex = /(?<code>\d0)x/;
        const xxmatch = codexx.exec(status);
        const xmatch = codex.exec(status);
        if (xxmatch && xxmatch?.groups?.code === statusCode.toString().charAt(0)) {
          // like 5xx
          isDoNotRetryCode = true;
          break;
        } else if (xmatch && xmatch?.groups?.code && statusCode.toString().startsWith(xmatch.groups.code)) {
          // like 40x
          isDoNotRetryCode = true;
          break;
        }
      }
      return isDoNotRetryCode;
    }
  }

  static async get(url: string, options: APICallOptions = { retries: 2, retryAfter: 1000 }, logger?: Logger): Promise<any> {
    const apiCallOptions: APICallOptions = { ...options, path: '', method: 'get' };
    const client = new APIClient(url, logger);
    return client.call(apiCallOptions);
  }
  static async post(url: string, body: any, options: APICallOptions = { retries: 2, retryAfter: 1000 }, logger?: Logger): Promise<any> {
    const apiCallOptions: APICallOptions = { ...options, path: '', method: 'post', body };
    const client = new APIClient(url, logger);
    return client.call(apiCallOptions);
  }
  static async put(url: string, body: any, options: APICallOptions = { retries: 2, retryAfter: 1000 }, logger?: Logger): Promise<any> {
    const apiCallOptions: APICallOptions = { ...options, path: '', method: 'put', body };
    const client = new APIClient(url, logger);
    return client.call(apiCallOptions);
  }
  static async delete(url: string, options: APICallOptions = { retries: 2, retryAfter: 1000 }, logger?: Logger): Promise<any> {
    const apiCallOptions: APICallOptions = { ...options, path: '', method: 'delete' };
    const client = new APIClient(url, logger);
    return client.call(apiCallOptions);
  }
  static async patch(url: string, body: any, options: APICallOptions = { retries: 2, retryAfter: 1000 }, logger?: Logger): Promise<any> {
    const apiCallOptions: APICallOptions = { ...options, path: '', method: 'patch', body };
    const client = new APIClient(url, logger);
    return client.call(apiCallOptions);
  }
  static async head(url: string, options: APICallOptions = { retries: 2, retryAfter: 1000, getFullResponse: true }, logger?: Logger): Promise<any> {
    const apiCallOptions: APICallOptions = { ...options, path: '', method: 'head', getFullResponse: true };
    const client = new APIClient(url, logger);
    return client.call(apiCallOptions);
  }
}

export function computeRetryAfter(current: number, addShift: boolean = true, max?: number): number {
  if (max && current >= max) {
    return max;
  } else {
    let retryAfterMillis = current * 2;
    if (addShift) {
      retryAfterMillis = retryAfterMillis + Math.ceil(Math.random() * 50);
    }
    return max && retryAfterMillis > max ? max : retryAfterMillis;
  }
}
