### How to test your code?
- Install dependencies using `npm i`.
- To manually check or start the application - Run `npm start`.
- To run tests - `npm run test`.

### What are the challenges you faced? and how did you solve them?
#### Approach 1 `src/interceptor_approach_1.js`
- I started off by trying to cancel all but one request. Making one request for all was more or less straightforward.
- Resolving the request to the respective callee was the tricky part, which I wasn't able to figure out with this approach. 
    - Once cancelled the requests come as cancelled in response interceptor.
    - I tried adding a unique ID to each request and resolving using its stored reference from the response interceptor.
    - This didn't work because the cancelled requests come to the response interceptor before the api response.

#### Approach 2 `src/interceptor.js`
- This approach uses adapter function which is responsible for dispatching the request and resolving the response once received.
- Using adapter helps as the execution to adapter comes after request interceptor and before going to response interceptor.
    - The adapter for each request receives the same promise with httpAdapter.
    - After httpAdapter promise settles(the api response), responseResolver returns the response for each request.
    
`PS: I found approach 2 online and updated it a bit.`
    
### Give another good use case for batching requests and its benefits.
~~I use an application to buy stocks which enables one to buy stocks of different companies at once. 
So, instead of sending buy requests for each stock, it only sends one request. 
This would be already using batching/bulk of some form.~~ - Doesn't fit. Bulk request suits better. client side batching doesn't fit.

~~Other than this, I have seen a few google apis use batching, with an option to even batch api calls of different types and to different endpoints.~~ - This is also more of a server side batching now when I think about it.

I could only think of similar use cases where there is a need to load some secondary information - chat, feed. 
In the current application that I am working on, we load the products first and then a request goes out for pricing for each product.
We do send a batched(bulk!) request, but we don't do it at the axios/fetch level. This could be one use case. 

React batches the setState calls if there are multiple calls inside the same event handler/function. But this is not a http request!  

#### Benefits:
Reduces the number of http handshakes, thus reduces the load on the server. Servers usually have a rate-limiter, batching reduces the probability of it blocking requests.
