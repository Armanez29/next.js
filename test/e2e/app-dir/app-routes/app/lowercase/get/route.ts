export const handler = async (): Promise<Response> => {
  return new Response('hello, world')
}

export const get = handler
