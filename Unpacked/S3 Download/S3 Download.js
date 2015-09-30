function timerFired( s : Switch )
{
	// Get flow element properties
	var intervalSeconds = s.getPropertyValue("checkIntervalMinutes")*60;
	var targetBucket = s.getPropertyValue("targetBucket");
	var leaveOriginals = s.getPropertyValue("leaveOriginals");
	var region = s.getPropertyValue('region');
	var namedProfile = s.getPropertyValue('namedProfile');	
	var prefix = s.getPropertyValue('prefix');	
	var CliPathPrefix = s.getPropertyValue('CliPathPrefix');	
	
	var debug = s.getPropertyValue("debug");
	
	// Set the log level
	var logLevel = 2;
	
	// Set the timerInterval on start
	if (s.getTimerInterval() == 0){
        s.setTimerInterval(intervalSeconds);
	}
	
	// Log some stuff
	if(debug == "Yes"){
		s.log(logLevel, "Debug output");
		s.log(logLevel, "intervalSeconds: "+intervalSeconds);
		s.log(logLevel, "targetBucket: "+targetBucket);
		s.log(logLevel, "leaveOriginals: "+leaveOriginals);
	}

	// Function for adding optional params
	var addOptionalParameters = function(cmd, restrictTo){
		if(region) 			cmd += " --region "+region;
		if(namedProfile) 		cmd += " --profile "+namedProfile;	
		if(prefix && restrictTo == 'list-objects'){
								cmd += " --prefix "+prefix;
		}
		// Booleans
		return cmd;
	}
	
	// Function for explicitly calling Python
	var addCliPathPrefix = function(cmd, CliPathPrefix)
	{
		fixedCmd = CliPathPrefix + cmd;
		return fixedCmd;
	}
		
	// Function to see if AWS CLI is installed
	var verifyAwsCli = function()
	{
		cmd = addCliPathPrefix("aws --version", CliPathPrefix);
		Process.execute(cmd);
		var awsVersionError = Process.stderr;
		var awsVersionResponse = Process.stdout;
		if(debug == 'Yes'){
			s.log(logLevel, "aws version response: "+awsVersionResponse);
			s.log(logLevel, "aws version error: "+awsVersionError);
		}
		if(!awsVersionError){
			s.log(3, "AWS CLI does not appear to be installed!");
			s.log(3, "You may have to set (or unset) the CLI Path Prefix element property so Switch may execute 'aws' commands.");
		} else {
			return true;
		}
	}
	
	// Function to see if an S3 bucket exists and is accessible
	var verifyS3Bucket = function(bucketName)
	{
		Process.execute(addCliPathPrefix("aws s3api head-bucket --bucket "+bucketName, CliPathPrefix));
		var awsHeadBucketResponse = Process.stderr;
		if(awsHeadBucketResponse){
			s.log(3, awsHeadBucketResponse);
			return false;
		} else {
			if(debug == 'Yes') s.log(logLevel, "Bucket '"+bucketName+"' exists and is available to you.");
			return true;
		}
	}
	
	// Function to list all objects in an S3 bucket
	var listS3Objects = function(bucketName)
	{
		// Get list of S3 objects
		list_cmd = addOptionalParameters(addCliPathPrefix("aws s3api list-objects --bucket "+targetBucket+" --output json", CliPathPrefix), 'list-objects');
		if(debug == "Yes") s.log(2, 'list_cmd: '+list_cmd);
		Process.execute(list_cmd);
		var listObjectsResponse = Process.stdout;
		// Evaluate response
		var parsedObject = eval("(" + listObjectsResponse + ")");
		var objects = parsedObject.Contents;
		// Return
		return objects;
	}
	
	// Function to get objects
	var getS3Objects = function(inputObjects)
	{
		var i = null;
		for(i = 0; i < inputObjects.length; i++){
			key = inputObjects[i].Key;
			basename_key = key.replace(/^.*[\\\/]/, '');
			
			// Check for empty object AWS sometimes returns to maintain the "folder" structure on the S3 console
			if(key == prefix){
				if(debug == "Yes"){ s.log(logLevel, "Empty 'folder' object found and ignored: "+key) };
				continue;
			};
			
			// Log some stuff
			if(debug == "Yes"){
				s.log(logLevel, "Key: "+key);
				s.log(logLevel, "Basename key: "+basename_key);
			}
			
			// Create a new job container
			job = s.createNewJob(targetBucket+"_"+key);
			fn = job.createPathWithName(basename_key, false);
			
			// Invoke AWS CLI
			download_cmd = addOptionalParameters(addCliPathPrefix("aws s3api get-object --bucket "+targetBucket+" --key \""+key+"\" \""+fn+"\" --output json", CliPathPrefix), 'No');
			if(debug == "Yes") s.log(2, 'download_cmd: '+download_cmd);
			Process.execute(download_cmd);
			downloadError = Process.stderr;
			
			// Evaluate response
			if(downloadError){
				s.log(3, "AWS CLI S3 download error: "+downloadError);
			} else {
				// Log some stuff
				if(debug == "Yes") s.log(logLevel, "Object successfully downloaded : "+key);
				// Complete job
            	job.sendToSingle(fn);
				// Delete object
				if(leaveOriginals == 'No'){
					// Invoke
					delete_cmd = addOptionalParameters(addCliPathPrefix("aws s3api delete-object --bucket "+targetBucket+" --key \""+key+"\" --output json", CliPathPrefix), 'No');
					if(debug == "Yes") s.log(2, 'delete_cmd: '+delete_cmd);
					Process.execute(delete_cmd);
					deleteError = Process.stderr;
					deleteResponse = Process.stdout;
					// Log some stuff
					if(debug == "Yes") s.log(logLevel, "deleteResponse : "+deleteResponse);
					// Check for errors
					if(deleteError){
						s.log(3, "AWS CLI S3 delete error: "+deleteError);
					} else {
						if(debug == "Yes") s.log(logLevel, "File successfully removed from S3.");
					}
				}
			}
		}
	}
		
	// Ensure AWS CLI is installed
	if(verifyAwsCli()){
		
		// Verify S3 bucket
		if(verifyS3Bucket(targetBucket)){
			// List objects
			var objects = listS3Objects(targetBucket);
			// Check to see if any objects exist
			if(objects.length > 0){
				// Log some stuff
				if(debug == "Yes")s.log(logLevel, "num of objects found: "+ objects.length);
				// Get all objects
				getS3Objects(objects);
			}
		}
	}
}