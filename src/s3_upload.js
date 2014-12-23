// Get some options
var opts = require("nomnom")
   .option('debug', {
      abbr: 'd',
      flag: true,
      help: 'Print debugging info'
   })
   .option('region', {
      abbr: 'r',
      default: 'us-east-1',
      help: 'AWS Region'
   })
   .option('bucket', {
      abbr: 'b',
      help: 'AWS Region',
      required: true
   })
   .option('accessKey', {
      abbr: 'a',
      help: 'AWS access key'
   })
   .option('secretAccessKey', {
      abbr: 's',
      help: 'AWS secret access key'
   })
   .option('input', {
      abbr: 'f',
      help: 'Input file path',
      required: true
   })
   .option('version', {
      abbr: 'v',
      flag: true,
      help: 'print version and exit',
      callback: function() {
         return "version 0.0.1";
      }
   })
   .parse();

// Load the AWS SDK for Node.js
var aws = require('aws-sdk'),
    fs = require('fs'),
    path = require('path');

// Get options
var input = opts.input;
var destination_bucket = opts.bucket;
var region = opts.region;
var access_key = opts.accessKey;
var secret_access_key = opts.secretAccessKey;

// Set your region for future requests.
aws.config.region = region;

// Override AWS keys if provided
if(access_key) aws.config.accessKeyId = access_key;
if(secret_access_key) aws.config.secretAccessKey = secret_access_key;

// Read the input file
var read_data = fs.createReadStream(input);
var destination_key = path.basename(input);

// Create a bucket using bound parameters and put something in it.
var s3bucket = new aws.S3({params: {Bucket: destination_bucket}});
s3bucket.createBucket(function() {
  var params = {Key: destination_key, Body: read_data};
  s3bucket.upload(params, function(err, data) {
    if (err) {
        console.log("Error uploading data: ", err);
    } else {
        console.log(data);
    }
  });
});