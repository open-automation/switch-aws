SwitchAWS
=========
AWS scripts for Switch with the help of AWS CLI. The goal of this project is to make it easy to use Amazon Web Services from Enfocus Switch.

### Requirements
- AWS CLI 1.6.5+

### Available Scripts

#### S3 Upload
Upload a file into an S3 bucket or a bucket's sub-folder (key prefix). The goal of this script is to be a drop-in replacement for the FTP send element.

#### S3 Download
Watches an S3 bucket for new files. Once it finds a file, it downloads it and optionally removes the original from the S3 bucket. You also may choose to watch an entire S3 bucket or a sub-folder (key prefix) within one. The goal of this script is to be a drop-in replacement for the FTP receive element.

#### SQS Send

Adds an SQS message into an SQS queue. The SQS message is declared in the configurator settings.

### Example Flows
#### S3 Send and Receive
![S3 send and receive](http://i.imgur.com/0riwyVF.png "Send and receive screenshot")

#### Todo
See the [issues page](https://github.com/dominickp/SwitchAWS/issues)
