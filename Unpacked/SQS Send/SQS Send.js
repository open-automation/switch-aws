function jobArrived( s : Switch, job : Job )
{
	// Get flow element properties
	var queueUrl = s.getPropertyValue("queueUrl");
	var messageBody = s.getPropertyValue("messageBody");
	var delaySeconds = s.getPropertyValue("delaySeconds");
	var messageIdPdKey = s.getPropertyValue("messageIdPdKey");
	
	var debug = s.getPropertyValue("debug");
	
	// Set the log level
	var logLevel = 2;

	// Log some stuff
	if(debug == "Yes"){
		s.log(logLevel, "Debug output");
		s.log(logLevel, "queueUrl: "+queueUrl);
		s.log(logLevel, "messageBody: "+messageBody);
		s.log(logLevel, "delaySeconds: "+delaySeconds);
	}
	
	// Function for adding optional params
	var addOptionalParameters = function(cmd){
		if(delaySeconds) 		cmd += " --delay-seconds "+delaySeconds;	
		// Booleans
		
		return cmd;
	}
	
	// List objects base command
	var sendCmd = 'aws sqs send-message --queue-url "'+queueUrl+'" --message-body "'+messageBody+'" --output json';
	
	// Add optional parameters
	sendCmd = addOptionalParameters(sendCmd);
	
	// Invoke AWS CLI
	Process.execute(sendCmd);
	var sendResponse = Process.stdout;
	
	// Log some stuff
	if(debug == "Yes"){
		s.log(logLevel, "response: "+ sendResponse);
		s.log(logLevel, "sendCmd: "+ sendCmd);
	}	

	if(sendResponse){
			
		// Evaluate response
		var parsedObject = eval("(" + sendResponse + ")");
		var messageId = parsedObject.MessageId;
		var md5OfMessageBody = parsedObject.MD5OfMessageBody;
	
		// Log some stuff
		if(debug == "Yes"){
			s.log(logLevel, "messageId: "+ messageId);
			s.log(logLevel, "md5OfMessageBody: "+ md5OfMessageBody);
		}
		
		// Write message ID to private data
		job.setPrivateData(messageIdPdKey, messageId);
	
		// Complete job
		job.sendToSingle(job.getPath());
	} else {
		// Fail if no message id returned
		job.fail("An error occured when trying to invoke AWS CLI. Enable debugging to troubleshoot.");
	}
	
}