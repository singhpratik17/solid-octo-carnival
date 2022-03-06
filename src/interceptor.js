import httpAdapter from "axios/lib/adapters/http";

let batchedRequestsMap = {};
let batchedRequestPromise = {};

/**
 * Map of requests for which batching is enabled with timeout in ms
 */
const batchEnabled = {
    "/file-batch-api": 500
}

/**
 * Resolves batched parameters for pending requests
 * @returns {any[]}
 * @param url
 */
const getBatchParams = (url) => {
    const requestArr = batchedRequestsMap[url];
    const params = requestArr.map(item => item.params.ids);
    return [...(new Set(params.flat()))];
};

/**
 * Get Updated config with all params for the request
 * @param config
 * @returns {{params: {ids: *[]}}|*}
 */
const getUpdatedConfig = (config) => {
    const batchedIds = getBatchParams(config.url);
    if (!batchedIds.length) {
        return config;
    }
    const params = { ...config.params, ids: batchedIds };
    return { ...config, params };
};

/**
 * Resolves response for all requests
 * @param config
 * @returns {function(...[*]=)}
 */
const responseResolver = (config) => {
    return (res) => {
        const ids = config.params?.ids || [];
        const data = JSON.parse(res.data);
        const items = data.items.filter((item) => ids.includes(item.id));

        if (!items.length) {
            return Promise.reject("No results");
        }

        return Promise.resolve({ ...res, data: { items } });
    };
};

/**
 * Resolves promise with httpAdapter and collects request configs
 * @param config
 * @returns {*}
 */
const batchAdapter = (config) => {
    if(batchedRequestsMap[config.url] && batchedRequestsMap[config.url].length) {
        batchedRequestsMap = {
            ...batchedRequestsMap,
            [config.url]: [
                ...batchedRequestsMap[config.url],
                config
            ]
        };
    }
    else {
        batchedRequestsMap = {
            ...batchedRequestsMap,
            [config.url]: [
                config
            ]
        };
        batchedRequestPromise[config.url] = new Promise((resolve, reject) => {
            setTimeout(() => {
                httpAdapter(getUpdatedConfig(config))
                    .then(resolve)
                    .catch(reject)
                    .finally(() => (batchedRequestsMap[config.url] = []));
            }, batchEnabled[config.url]);
        });
    }
    return batchedRequestPromise[config.url];
};

function batchInterceptor(instance) {
    instance.interceptors.request.use(
        (request) => {
            if(batchEnabled.hasOwnProperty(request.url)) {
                request.adapter = (config) => {
                    return batchAdapter(config).then(responseResolver(config));
                }
            }
            return request;
        },
        (error) => Promise.reject(error)
    );
}

export default batchInterceptor;
