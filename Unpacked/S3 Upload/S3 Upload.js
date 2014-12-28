function jobArrived( s : Switch, job : Job )
{
	// Get flow element properties
	var destinationBucket = s.getPropertyValue('DestinationBucket');
	var responseUrlPdKey = s.getPropertyValue('ResponseUrlPdKey');
	var region = s.getPropertyValue('Region');
	var namedProfile = s.getPropertyValue('NamedProfile');
	var acl = s.getPropertyValue('ACL');
	var noGuessMimeType = s.getPropertyValue('NoGuessMimeType');
	var sse = s.getPropertyValue('SSE');
	var storageClass = s.getPropertyValue('StorageClass');
	var removeSwitchId = s.getPropertyValue('RemoveSwitchId');
	
	var debug = s.getPropertyValue('Debug');
	
	// Set the log level
	var logLevel = 2;
	
	// Get the input file path
	var filePath = job.getPath();
	
	// Log some stuff
	if(debug == 'Yes'){
		s.log(logLevel, "destinationBucket: "+destinationBucket);
		s.log(logLevel, "responseUrlPdKey: "+responseUrlPdKey);
		s.log(logLevel, "region: "+region);
		s.log(logLevel, "filePath: "+filePath);
		s.log(logLevel, "namedProfile: "+namedProfile);
		s.log(logLevel, "acl: "+acl);
		s.log(logLevel, "noGuessMimeType: "+noGuessMimeType);
		s.log(logLevel, "sse: "+sse);
		s.log(logLevel, "storageClass: "+storageClass);
	}
		
	// Function for adding optional params
	var addOptionalParameters = function(cmd){
		if(region) 			cmd += " --region "+region;
		if(namedProfile) 		cmd += " --profile "+namedProfile;	
		if(acl) 				cmd += " --acl "+acl;
		if(storageClass) 		cmd += " --storage-class "+storageClass;
		// Booleans
		if(noGuessMimeType == "true") 	cmd += " --no-guess-mime-type";
		if(sse == "true") 				cmd += " --sse";
		
		return cmd;
	}
	
	// Base command
	var cmd = "aws s3 cp "+filePath+" s3://"+destinationBucket+"/ --only-show-errors ";
	
	// Add optional parameters
	cmd = addOptionalParameters(cmd);
	
	// Invoke AWS CLI
	Process.execute(cmd);
	var errors = Process.stdout;
	var renameErrors = null;
	
	// Rename to remove Switch ID if applicable
	if(!errors){

		// Work out the default URL with Switch ID
		var responseUrl = destinationBucket+"/_"+job.getUniqueNamePrefix()+"_"+job.getName();
		
		if(removeSwitchId == "Yes"){
			// Rename command
			var originalUrl = responseUrl;
			var modifiedUrl = destinationBucket+"/"+job.getName();
			var renameCmd = "aws s3 mv s3://"+originalUrl+" s3://"+modifiedUrl+" --only-show-errors ";
			// Add optional parameters
			renameCmd = addOptionalParameters(renameCmd);
			// Invoke AWS CLI
			Process.execute(renameCmd);
			var renameErrors = Process.stdout;
			// Check for errors
			if(!renameErrors) responseUrl = modifiedUrl;
		}
						
		// Build S3 link
		var s3Link = 'https://s3.amazonaws.com/'+responseUrl;
			
		// Write S3 link to private data
		job.setPrivateData(responseUrlPdKey, s3Link);
	
	}

	// Log some more stuff
	if(debug == 'Yes'){
		s.log(logLevel, "cmd: "+cmd);
		s.log(logLevel, "errors: "+errors);
	}

	// Check to see if there were errors
	if(errors || renameErrors){
		// Log error
		s.log(3, "AWS CLI ERROR: "+errors);
		s.log(3, "AWS CLI RENAME ERROR: "+renameErrors);
		// Finish
		job.sendToData(3, job.getPath());
	} else {
		// Finish
		job.sendToData(1, job.getPath());
	}	
		
}
