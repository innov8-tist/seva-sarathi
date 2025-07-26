import { hc } from "hono/client";
import { ApiRoutesType } from "@server/src/app";

const client = hc<ApiRoutesType>('/', {
  fetch: (input: RequestInfo | URL, init?: RequestInit) => {
    return fetch(input, {
      ...init,
      credentials: 'include' 
    })
  }
})

export const api = client.api
