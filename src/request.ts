import { getLogger } from 'debuggo';
import * as rp from 'request-promise-native';

export interface HTTPAuthOptions {
  authorizationType?: string;
  token?: string;
  user?: string;
  password?: string;
}
export interface APICallOptions {
  method: 'get' | 'post' | 'put' | 'delete' | 'options' | 'head' | 'patch';
  path: string;
  qs?: any;
  body?: any;
  headers?: any;
  authOptions?: HTTPAuthOptions;
  retries: number;
  retryAfter: number;
  doNotRetryOnErrors?: number[];
}
export class APIClient {
  constructor(private baseUrl: string, protected logger = getLogger('vivocha.api-client')) {}
  async call(options: APICallOptions): Promise<any> {
    if (!options?.method || !options?.path) {
      throw new Error('options.method and options.path are required');
    } else {
      const requestOpts: rp.RequestPromiseOptions = {
        method: options.method,
        qs: options.qs,
        body: options.body,
        headers: options.headers ? options.headers : {},
        json: true,
        simple: false,
        resolveWithFullResponse: true
      };
      if (options?.authOptions?.token && options?.authOptions?.authorizationType) {
        requestOpts.headers = {
          authorization: `${options.authOptions.authorizationType} ${options.authOptions.token}`
        };
      } else if (options?.authOptions?.user && options?.authOptions?.password) {
        requestOpts.auth = {
          user: options.authOptions.user,
          pass: options.authOptions.password
        };
      }
      options.doNotRetryOnErrors = options.doNotRetryOnErrors && options.doNotRetryOnErrors.length ? options.doNotRetryOnErrors : [];
      const apiEndpoint = `${this.baseUrl}${options.path}`;
      this.logger.debug(`Calling API endpoint: ${options.method} ${apiEndpoint}`);
      const response: rp.FullResponse = await rp(apiEndpoint, requestOpts);
      this.logger.debug('Response status', response.statusCode);
      if (response.statusCode >= 200 && response.statusCode <= 299) {
        return response.body;
      } else {
        this.logger.error(`Call returned response error ${response.statusCode}, body: ${JSON.stringify(response.body)}`);
        if (options.retries === 0 || options?.doNotRetryOnErrors.includes(response.statusCode)) {
          this.logger.warn('No more retries to do, throwing error');
          throw new Error(`Error calling ${options.method} ${apiEndpoint}. Status: ${response.statusCode}, body: ${JSON.stringify(response.body)}`);
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
    }
  }
}
