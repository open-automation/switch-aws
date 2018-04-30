/*
  receive-message
--queue-url <value>
[--attribute-names <value>]
[--message-attribute-names <value>]
[--max-number-of-messages <value>]
[--visibility-timeout <value>]
[--wait-time-seconds <value>]
[--receive-request-attempt-id <value>]
[--cli-input-json <value>]
[--generate-cli-skeleton <value>]
*/

function timerFired( s : Switch, job : Job )
{
	// Get flow element properties
	var intervalSeconds = s.getPropertyValue("checkIntervalSeconds");
	var bDeleteMessage = s.getPropertyValue("deleteMessage") === "Yes";
	var queueUrl = s.getPropertyValue("queueUrl");
	var CliCommand = s.getPropertyValue('CliCommand');	
	var CliPathPrefix = s.getPropertyValue('CliPathPrefix');	
	
	// Function for explicitly calling Python
	var addCliPathPrefix = function(cmd, CliCommand, CliPathPrefix)
	{
		fixedCmd = CliPathPrefix + '/' + CliCommand + " "+ cmd;
		return fixedCmd;
	}

	// Set the timerInterval on start
	if (s.getTimerInterval() == 0){
        s.setTimerInterval(intervalSeconds);
	}
	
	var debug = s.getPropertyValue("debug");

	// Set the log level
	var logLevel = 2;

	// Log some stuff
	if(debug == "Yes"){
		s.log(logLevel, "Debug output");
		s.log(logLevel, "queueUrl: "+queueUrl);
		s.log(logLevel, "intervalSeconds: "+intervalSeconds);
	}
	
	// Function for adding optional params
	var addOptionalParameters = function(cmd){
		return cmd;
	}
	
	// receive message command
	var cmd = addCliPathPrefix('sqs receive-message --queue-url "'+queueUrl+'" --max-number-of-messages 1', CliCommand, CliPathPrefix);
	
	// Add optional parameters
	cmd = addOptionalParameters(cmd);
	
	// Invoke AWS CLI
	Process.execute(cmd);
	var response = Process.stdout;
	
	// Log some stuff
	if(debug == "Yes"){
		s.log(logLevel, "receive response: "+ response);
		s.log(logLevel, "cmd: "+ cmd);
	}	

	if(response){
			
		var parsedObject = eval("(" + response + ")");
		var messageId = parsedObject.Messages[0].MessageId;
		var receiptHandle = parsedObject.Messages[0].ReceiptHandle;

		// Log some stuff
		if(debug == "Yes"){
			s.log(logLevel, "response: "+ response);
			s.log(logLevel, "messageId: "+ messageId);
			s.log(logLevel, "receiptHandle: "+ receiptHandle);
		}

		if (bDeleteMessage) {
			var cmd = addCliPathPrefix('sqs delete-message --queue-url "'+queueUrl+'" --receipt-handle "'+receiptHandle+'"', CliCommand, CliPathPrefix);
			// Invoke AWS CLI
			Process.execute(cmd);
			var response = Process.stdout;
			if(debug == "Yes"){
				s.log(logLevel, "delete response: "+ response);
			}
		}

		// Write message to file
		var now = new Date();
		var job = s.createNewJob("SQS Receive");
		var fn = job.createPathWithName(now.getTime() + ".json", false);
		var f = new File(fn);
		f.open(File.WriteOnly);
		f.write(response);
		f.close();
	
		// Complete job
		job.sendToSingle(fn);
	}
}
