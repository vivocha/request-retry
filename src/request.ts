import { getLogger, Logger } from 'debuggo';
import needle, { NeedleHttpVerbs } from 'needle';
import queryString from 'query-string';
import { APICallError, APICallOptions } from './types';

export class APIClient {
  private firstCall: boolean;
  private readonly DEFAULT_MAX: number = 10 * 60 * 1000; // default maxRetryAfter is 10 minutes
  constructor(private baseUrl: string, protected logger = getLogger('vivocha.request-retry')) {
    this.firstCall = true;
  }
  async call(options: APICallOptions): Promise<any> {
    if (!options?.method) {
      options.method = 'get';
    }
    if (typeof options?.path === 'undefined') {
      options.path = '';
    }
    let apiEndpoint = `${this.baseUrl}${options.path}`;
    try {
      const requestOpts: needle.NeedleOptions = {};
      if (options.headers && Object.keys(options.headers).length) {
        requestOpts.headers = { ...options.headers };
      }
      if (options?.json) {
        requestOpts.json = true;
      } else {
        requestOpts.json = false;
        requestOpts.parse_response = false;
      }
      if (options?.qs) {
        apiEndpoint = `${apiEndpoint}?${queryString.stringify(options.qs)}`;
      }
      let data: any;
      if (options.body) {
        data = options.body;
      }
      // * Authentication
      if (options.authOptions?.token && options.authOptions?.authorizationType) {
        const authScheme = options.authOptions.authorizationType;
        const authType = authScheme === 'bearer' ? authScheme.charAt(0).toUpperCase() + authScheme.slice(1) : authScheme;
        requestOpts.headers = { ...requestOpts.headers, authorization: `${authType} ${options.authOptions.token}` };
      } else if (options.authOptions?.user && options.authOptions?.password) {
        requestOpts.headers = { ...requestOpts.headers };
        requestOpts.username = options.authOptions.user;
        requestOpts.password = options.authOptions.password;
      }
      // * Request timeout
      if (options.timeout) {
        requestOpts.timeout = options.timeout;
        requestOpts.response_timeout = options.timeout;
      }
      // * redirects following
      requestOpts.follow_max = Math.abs(options?.follow_max || 3);
      requestOpts.follow_set_cookies = options.follow_set_cookies || false; //Sends the cookies received in the set-cookie header as part of the following request, if hosts match. false by default.
      requestOpts.follow_set_referer = options.follow_set_referer || false; //Sets the 'Referer' header to the requested URI when following a redirect. false by default.
      requestOpts.follow_keep_method = options.follow_keep_method || true; //If enabled, resends the request using the original verb instead of being rewritten to get with no data. true by default.
      requestOpts.follow_if_same_host = options.follow_if_same_host || false; //When true, will only follow redirects that point to the same host as the original request. false by default.
      requestOpts.follow_if_same_protocol = options.follow_if_same_protocol || false; // When true,  will only follow redirects that point to the same protocol as the original request. false by default.
      requestOpts.follow_if_same_location = options.follow_if_same_location || false; // Unless true,  will not follow redirects that point to same location (as set in the response header) as the original request URL. false by default.

      // * Do not retry on errors
      options.doNotRetryOnErrors = options.doNotRetryOnErrors && options.doNotRetryOnErrors.length ? options.doNotRetryOnErrors : [];

      this.logger.debug(`Calling API endpoint: ${options.method} ${apiEndpoint}`);
      this.logger.trace(`Calling API endpoint: ${options.method} ${apiEndpoint}, headers: ${JSON.stringify(options.headers)}, body: ${JSON.stringify(data)}`);
      // debugger;
      let response: needle.NeedleResponse;

      response = await needle(options.method as NeedleHttpVerbs, apiEndpoint, data, requestOpts);

      this.logger.debug(`${options.method} ${apiEndpoint} response status`, response.statusCode);

      if (response.statusCode && response?.statusCode >= 200 && response.statusCode <= 299) {
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
    } catch (error: any) {
      this.logger.error(`Error calling endpoint ${options.method} ${apiEndpoint}`, error);
      const apiError: APICallError =
        error instanceof APICallError ? (error as APICallError) : new APICallError(error.name || 'APICallError', null, undefined, error.message || '');
      throw apiError;
    }
  }
  private isDoNotRetryCode(options: APICallOptions, statusCode: number | undefined): boolean {
    if (!statusCode) {
      return false;
    }
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
