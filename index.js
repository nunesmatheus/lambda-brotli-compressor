const {gzip} = require('node-gzip');
const zlib = require('zlib')
const request = require('request').defaults({ encoding: null });

exports.handler = async (event, context, callback) => {
  const host = process.env.FILE_HOST
  const accept_encoding = event.headers['accept-encoding']
  const accept_brotli = accept_encoding && accept_encoding.indexOf('br') !== -1
  const accept_gzip = accept_encoding && accept_encoding.indexOf('gzip') !== -1

  const path = event.path.replace(process.env.API_GATEWAY_PATH, '')

  const file_extension = /.+\.([a-z]+)$/.exec(path) && /.+\.([a-z]+)$/.exec(path)[1]

  const host_response = await download(`${host}${path}`)
  let body = host_response.body

  if(!file_extension || !['css', 'js'].includes(file_extension)) {
    buffer = Buffer.from(body)
    const response = {
      statusCode: host_response.status,
      body: buffer.toString('base64'),
      isBase64Encoded: true,
      headers: {
        'Content-Type': host_response.headers["content-type"]
      }
    }
    return response
  }

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
    statusCode: host_response.status,
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

function download(uri) {
  return new Promise((resolve, reject) => {
    request.get(uri, function (error, response, body) {
      resolve({ body: body, headers: response.headers, status: response.statusCode })
    })
  })
}
