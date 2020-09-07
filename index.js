const {gzip} = require('node-gzip');
const zlib = require('zlib')
const request = require('request')

exports.handler = async (event) => {
  const host = process.env.FILE_HOST
  const accept_encoding = event.headers['accept-encoding']
  const accept_brotli = accept_encoding && accept_encoding.indexOf('br') !== -1
  const accept_gzip = accept_encoding && accept_encoding.indexOf('gzip') !== -1

  const path = event.rawPath.replace('/default/vstiba-brotli-compressor', '')

  const request_promise = new Promise((resolve, reject) => {
    request(`${host}${path}`, function (error, response, body) {
      if(response.statusCode != 200) {
        console.log(`failed, will request ${`${host}/not_found`}`)
        return request(`${host}/not_found`, function (error, response, body) {
          resolve({ body: body, headers: response.headers })
        })
      }

      resolve({ body: body, headers: response.headers })
    })
  })


  const host_response = await request_promise
  let body = host_response.body
  let content_encoding
  if(accept_brotli) {
    content_encoding = "br"
    body = await new Promise((resolve, reject) => {
      zlib.brotliCompress(host_response.body, {
      }, (err, data) => {
        resolve(data)
      })
    })
  } else if(accept_gzip) {
    content_encoding = "gzip"
    body = await gzip(host_response.body)
  }

  const response = {
    statusCode: 200,
    isBase64Encoded: true,
    body: body.toString("base64"),
    headers: {
      'Content-Type': host_response.headers["content-type"],
      'Content-Encoding': content_encoding,
      'Cache-Control': host_response.headers["cache-control"]
    },
  };
  return response;
};
