import { getLogger } from 'debuggo';
import * as rp from 'request-promise-native';
import { APICallError, APICallOptions } from './types';

export class APIClient {
  constructor(private baseUrl: string, protected logger = getLogger('vivocha.api-client')) {}
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
        method: options.method || 'get',
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
      if (options?.authOptions?.token && options?.authOptions?.authorizationType) {
        requestOpts.headers = { ...requestOpts.headers, authorization: `${options.authOptions.authorizationType} ${options.authOptions.token}` };
      } else if (options?.authOptions?.user && options?.authOptions?.password) {
        requestOpts.auth = {
          user: options.authOptions.user,
          pass: options.authOptions.password
        };
      }
      if (options.timeout) {
        requestOpts.timeout = options.timeout;
      }
      options.doNotRetryOnErrors = options.doNotRetryOnErrors && options.doNotRetryOnErrors.length ? options.doNotRetryOnErrors : [];
      this.logger.debug(`Calling API endpoint: ${options.method} ${apiEndpoint}`);
      const response: rp.FullResponse = await rp(apiEndpoint, requestOpts);
      this.logger.debug('Response status', response.statusCode);
      if (response.statusCode >= 200 && response.statusCode <= 299) {
        return options.getFullResponse ? response : response.body;
      } else {
        this.logger.error(`Call returned response error ${response.statusCode}, body: ${JSON.stringify(response.body)}`);
        if (options.retries === 0 || options?.doNotRetryOnErrors.includes(response.statusCode)) {
          this.logger.warn('No more retries to do, throwing error');
          const error: APICallError = new APICallError('APICallError', response.body, response.statusCode, 'Error calling the API endpoint');
          this.logger.error('error', JSON.stringify(error), error.message);
          throw error;
        } else {
          this.logger.debug(`Retrying request ${options.method} ${apiEndpoint}...`);
          options.retries = options.retries - 1;
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              return resolve(this.call(options));
            }, options.retryAfter);
          });
        }
      }
    } catch (error) {
      this.logger.error(`Error calling endpoint ${apiEndpoint}`);
      const apiError: APICallError = new APICallError('APICallError', null, undefined, error.message);
      throw apiError;
    }
  }
}
