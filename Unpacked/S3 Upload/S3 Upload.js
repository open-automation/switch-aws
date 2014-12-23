function jobArrived( s : Switch, job : Job )
{
	// Get flow element properties
	var destinationBucket = s.getPropertyValue('DestinationBucket');
	var responseUrlPdKey = s.getPropertyValue('ResponseUrlPdKey');
	var region = s.getPropertyValue('Region');
	var accessKey = s.getPropertyValue('AccessKey');
	var secretAccessKey = s.getPropertyValue('SecretAccessKey');
	var scriptPath = s.getPropertyValue('ScriptPath');
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
		s.log(logLevel, "accessKey: "+accessKey);
		s.log(logLevel, "secretAccessKey: "+secretAccessKey);
		s.log(logLevel, "filePath: "+filePath);
		s.log(logLevel, "scriptPath: "+scriptPath);
	}
	
	var cmd = "node "+scriptPath+" --bucket "+destinationBucket+" --input "+filePath+" --region "+region;
	if(accessKey) cmd += " --accessKey "+accessKey;
	if(secretAccessKey) cmd += " --secretAccessKey "+secretAccessKey;
	
	// Invoke node
	Process.execute(cmd);

	// Log some more stuff
	if(debug == 'Yes'){
		s.log(logLevel, "cmd: "+cmd);
		s.log(logLevel, "output: "+Process.stdout);
	}

}
