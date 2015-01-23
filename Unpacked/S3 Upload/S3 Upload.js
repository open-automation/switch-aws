function jobArrived( s : Switch, job : Job )
{
	// Get flow element properties
	var destinationBucket = s.getPropertyValue('DestinationBucket');
	var responseUrlPdKey = s.getPropertyValue('ResponseUrlPdKey');
	var region = s.getPropertyValue('Region');
	var namedProfile = s.getPropertyValue('NamedProfile');
	var acl = s.getPropertyValue('ACL');
	var storageClass = s.getPropertyValue('StorageClass');
	var removeSwitchId = s.getPropertyValue('RemoveSwitchId');
	
	var debug = s.getPropertyValue('Debug');
	
	// Set the log level
	var logLevel = 2;
	
	// Log some stuff
	if(debug == 'Yes'){
		s.log(logLevel, "destinationBucket: "+destinationBucket);
		s.log(logLevel, "responseUrlPdKey: "+responseUrlPdKey);
		s.log(logLevel, "region: "+region);
		s.log(logLevel, "filePath: "+job.getPath());
		s.log(logLevel, "namedProfile: "+namedProfile);
		s.log(logLevel, "acl: "+acl);
		s.log(logLevel, "storageClass: "+storageClass);
	}
		
	// Function for adding optional params
	var addOptionalParameters = function(cmd){
		if(namedProfile) 		cmd += " --profile "+namedProfile;	
		if(acl) 				cmd += " --acl "+acl;
		if(storageClass) 		cmd += " --storage-class "+storageClass;
		// Booleans
		return cmd;
	}
	
	// Function to see if AWS CLI is installed
	var verifyAwsCli = function()
	{
		Process.execute("aws --version");
		var awsVersionResponse = Process.stderr;
		if(debug == 'Yes') s.log(logLevel, "aws version response: "+awsVersionResponse);
		if(!awsVersionResponse){
			s.log(3, "AWS CLI does not appear to be installed");
			return false;
		} else {
			return true;
		}
	}
	
	// Function to see if an S3 bucket exists and is accessible
	var verifyS3Bucket = function(bucketName)
	{
		Process.execute("aws s3api head-bucket --bucket "+bucketName);
		var awsHeadBucketResponse = Process.stderr;
		if(awsHeadBucketResponse){
			s.log(3, awsHeadBucketResponse);
			return false;
		} else {
			if(debug == 'Yes') s.log(logLevel, "Bucket '"+bucketName+"' exists and is available to you.");
			return true;
		}
	}
	
	// Must be file, no folder
	var verifyIsFile = function()
	{
		if(!job.isFile()){
			s.log(3, "Error! Job should be a file, not a folder.");
			return false;
		} else {
			return true;		
		}
	}
	
	// Function to upload an object to an S3 bucket
	var putS3Object = function (bucketName)
	{
		Process.execute(addOptionalParameters("aws s3api put-object --output json --bucket "+bucketName+" --body "+job.getPath()+" --key "+job.getName()));
		var putResponse = Process.stdout;	
		var putError = Process.stderr;
		var objectUrl = null;
		if(putError){
			s.log(3, "putError: "+putError);
			return null;
		} else {
			if(debug == 'Yes') s.log(logLevel, "putResponse: "+putResponse);	
			objectUrl = 'https://s3.amazonaws.com/'+bucketName+'/'+job.getName();
			return objectUrl;
		}
	}
	
	// Verify the job is a file and not a folder
	if(verifyIsFile()){
		
		// Ensure AWS CLI is installed
		if(verifyAwsCli()){
			
			// Verify S3 bucket
			if(verifyS3Bucket(destinationBucket)){
				
				// Upload to S3
				var objectUrl = putS3Object(destinationBucket);
				
				// Final completion
				if(objectUrl){
					// Write object URL to private data
					job.setPrivateData(responseUrlPdKey, objectUrl);
					// Debug log the URL
					if(debug == 'Yes') s.log(logLevel, "objectUrl: "+objectUrl);	
					// Finish
					job.sendToData(1, job.getPath());
				} else {
					s.log(3, "Job failed to upload to S3. Attempt to debug.");
				}
			}
		}
	}
}
