// Is invoked at regular intervals regardless of whether a new job arrived or not.
// The interval can be modified with s.setTimerInterval().
function timerFired( s : Switch )
{
	// Get flow element properties
	var intervalSeconds = s.getPropertyValue("checkIntervalMinutes")*60;
	var targetBucket = s.getPropertyValue("targetBucket");
	var leaveOriginals = s.getPropertyValue("leaveOriginals");
	var region = s.getPropertyValue('region');
	var namedProfile = s.getPropertyValue('namedProfile');	
	
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
	var addOptionalParameters = function(cmd){
		if(region) 			cmd += " --region "+region;
		if(namedProfile) 		cmd += " --profile "+namedProfile;	
		// Booleans
		
		return cmd;
	}
	
		
	// List objects base command
	var lsCmd = "aws s3api list-objects --bucket "+targetBucket+" --output json";
	
	// Add optional parameters
	lsCmd = addOptionalParameters(lsCmd);
	
	// Invoke AWS CLI
	Process.execute(lsCmd);
	var listObjectsResponse = Process.stdout;
	
	// Evaluate response
	var parsedObject = eval("(" + listObjectsResponse + ")");
	var objects = parsedObject.Contents;
	
	// Check to see if any objects exist
	if(objects.length > 0){
			
		// Log some stuff
		if(debug == "Yes"){
			s.log(logLevel, "list-objects output: "+ listObjectsResponse);
			s.log(logLevel, "num of objects found: "+ objects.length);
		}
		
		// Loop through objects, download, and make new Switch jobs
		for(var i = 0; i < objects.length; i++){
			var key = objects[i].Key;
			
			// Log some stuff
			if(debug == "Yes") s.log(logLevel, "Key: "+key);
			
			// Create a new job container
			var job = s.createNewJob("s3://"+targetBucket+"/"+key);
			
			// Download into new job container, base command
			var dlCmd = "aws s3 cp s3://"+targetBucket+"/"+key+" "+job.getPath()+"/"+key+" --only-show-errors ";
			
			// Add optional parameters
			dlCmd = addOptionalParameters(dlCmd);
			
			// Invoke AWS CLI
			Process.execute(dlCmd);
			var downloadError = Process.stdout;
			
			// Evaluate response
			if(downloadError){
				s.log(3, "AWS CLI S3 download error: "+downloadError);
			} else {
							
				// Create a new file
				//var f = new File(job.getPath()+"/"+key);
				//job.createPathWithExtension(job.getPath()+"/"+key);

				
				// Complete job
				job.sendToSingle(job.getPath());
					
				// Log some stuff
				if(debug == "Yes") s.log(logLevel, "Object successfully downloaded : "+key);
			}

		}
	
	} else {
		s.log(1, "The bucket '"+targetBucket+"' is empty.");
	}
	
}