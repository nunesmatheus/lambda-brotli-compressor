# Lambda Brotli compressor

This is the code for an AWS Lambda function that receives a request to, e.g., /mypath and executes a request to another server, defined in the FILE_HOST env var, on AWS. The response is then compressed to Brotli and returned. If the FILE_HOST server returns a status different from 200, a fallback route is rendered (/not_found).

## Deploy

1. Create an AWS Lambda function
1. Run `npm install`
1. Zip the contents of the repository (not the repository folder) and upload do AWS
1. Create an API gateway trigger for the Lambda function
