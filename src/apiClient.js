import axios from "axios";
import batchInterceptor from "./interceptor.js";

const instance = axios.create({
  // baseURL: "https://europe-west1-quickstart-1573558070219.cloudfunctions.net"
  // baseURL: "https://testingjanta.free.beeceptor.com"
  baseURL: "https://askan.free.beeceptor.com"
  // baseURL: "https://fileget.free.beeceptor.com"
});

batchInterceptor(instance);

export default instance;


// {
//   "items":[
//   {
//     "id":"fileid1"
//   },
//   {
//     "id":"fileid2"
//   }
// ]
// }