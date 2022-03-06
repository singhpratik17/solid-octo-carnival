import {v4 as uuidv4, validate} from 'uuid';

let batchedRequestsMap = {};
let batchedResponse = {};

const getUpdatedParams = (url) => {
    const requestArr = Object.values(batchedRequestsMap[url]);
    const params = requestArr.map(item => item.params.ids);
    return { ids: [...(new Set(params.flat()))] }
}

/**
 * Creates a promise with timeout for first request
 * Rejects all other requests after preserving config
 *
 * This above works fine but the resolver part doesn't.
 * The idea was to attach a unique id to each request which can be later used to resolve the response!
 *
 * @param req
 * @returns {Promise<unknown>|*}
 */
const requestProcessor = (req) => {
    const id = uuidv4();
    req.headers["id"] = id;
    try {
        if(batchedRequestsMap[req.url] && Object.values(batchedRequestsMap[req.url]).length) {
            let controller = new AbortController();
            batchedRequestsMap = {
                ...batchedRequestsMap,
                [req.url]: {
                    ...batchedRequestsMap[req.url],
                    [id]: req
                }
            };
            req.signal = controller.signal;
            controller.abort(JSON.stringify({id, url: req.url}));
            return req;
        }
        else {
            batchedRequestsMap = {
                ...batchedRequestsMap,
                [req.url]: {
                    [id]: req
                }
            };
            return new Promise(function (resolve) {
                setTimeout(() => {
                    req.params = getUpdatedParams(req.url);
                    resolve(req);
                }, 500);
            });
        }
    }
    catch (e) {
        console.log(e);
    }
}

const responseResolver = (id, url) => {
    // Resolve
}

function batchInterceptor(instance) {
    instance.interceptors.request.use(
         (request) => {
            const req = requestProcessor(request);
            if(req.signal?.aborted) {
               throw Error(req.signal?.reason)
            }
            return req;
        },
        (error) => {
            return Promise.reject(error)
        }
    );

    instance.interceptors.response.use(
        (response) => {
            // Discard this approach!!!
            // batchedResponse[response.config.url] = response;
            // return responseResolver(response.config?.headers?.id, response.config?.url);
            return response;
        },
        (error) => {
            // try {
            //     error.message = JSON.parse(error.message);
            //     if(error.message?.id && validate(error.message.id)) {
            //         const uid = error.message.id;
            //         const url = error.message.url;
            //         return responseResolver(uid, url);
            //     }
            // }
            // catch (e) {
            //     return Promise.reject(error)
            // }
            return Promise.reject(error)
        }
    );
}

export default batchInterceptor;
