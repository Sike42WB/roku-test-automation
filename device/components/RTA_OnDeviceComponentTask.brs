sub init()
	m.port = createObject("roMessagePort")
	m.top.observeFieldScoped("renderThreadResponse", m.port)
	m.top.functionName = "runTaskThread"
	m.top.control = "RUN"
	m.logLevel = 0
end sub

function getVersion() as String
	return "1.0.0"
end function

function getCallbackUrl(request as Object) as String
	return "http://" + request.callbackHost + ":" + request.callbackPort.toStr() + "/callback/" + request.id
end function

sub runTaskThread()
	m.validRequestTypes = {
		"getValueAtKeyPath": true
		"getValuesAtKeyPaths": true
		"setValueAtKeyPath": true
	}

	address = createObject("roSocketAddress")
	address.setPort(9000)

	udpSocket = createObject("roDatagramSocket")
	udpSocketId = stri(udpSocket.getID())
	udpSocket.setMessagePort(m.port)
	udpSocket.setAddress(address)
	udpSocket.notifyReadable(true)
	m.activeRequests = {}

	while true
		message = wait(0, m.port)
		if message <> Invalid then
			messageType = type(message)
			if messageType = "roSocketEvent" then
				messageSocketId = stri(message.getSocketID())
				if messageSocketId = udpSocketId
					if udpSocket.isReadable() then
						receivedString = udpSocket.receiveStr(udpSocket.getCountRcvBuf())
						verifyAndHandleRequest(receivedString, udpSocket)
					end if
				else
					logWarn("Received roSocketEvent for unknown socket")
				end if
			else if messageType = "roSGNodeEvent" then
				fieldName = message.getField()
				if message.getField() = "renderThreadResponse" then
					response = message.getData()
					request = m.activeRequests[response.id]
					m.activeRequests.delete(response.id)
					sendBackResponse(request, response)
				else
					logWarn(fieldName + " not handled")
				end if
			else
				logWarn(messageType + " type not handled")
			end if
		end if
	end while
end sub

sub verifyAndHandleRequest(receivedString as String, socket as Object)
	request = parseJson(receivedString)
	if NOT isAA(request) then
		logError("Received message did not contain valid request " + receivedString)
		return
	end if

	if (NOT isInteger(request.callbackPort)) then
		logError("Received message did not have callbackPort " + receivedString)
		return
	end if

	request["callbackHost"] = socket.getReceivedFromAddress().getHostName()

	requestType = getStringAtKeyPath(request, "type")

	if m.validRequestTypes[requestType] = true then
		if NOT isNonEmptyAA(request.args) then
			sendBackError(request, "No args supplied for request type '" + requestType + "'")
			return
		end if

		m.activeRequests[request.id] = request
		m.top.renderThreadRequest = request
	else if requestType = "handshake" then
		logLevel = getStringAtKeyPath(request, "args.logLevel")
		if logLevel = "verbose" then
			m.logLevel = 5
		else if logLevel = "debug" then
			m.logLevel = 4
		else if logLevel = "info" then
			m.logLevel = 3
		else if logLevel = "warn" then
			m.logLevel = 2
		else if logLevel = "error" then
			m.logLevel = 1
		else if logLevel = "off" then
			m.logLevel = 0
		end if

		version = getVersion()
		if getStringAtKeyPath(request, "args.version") = version then
			sendBackResponse(request, {
				"success": true
				"version": version
			})
		end if
	else
		sendBackError(request, "request type '" + requestType + "' not currently handled")
	end if
end sub

sub sendBackError(request as Object, message as String)
	sendBackResponse(request, buildErrorResponseObject(message))
end sub

sub sendBackResponse(request as Object, response as Dynamic)
	if isAA(response) then
		formattedResponse = formatJson(response)
	else
		formattedResponse = response
	end if

	callbackUrl = getCallbackUrl(request)
	http = createObject("roUrlTransfer")
	http.setUrl(callbackUrl)
	http.addHeader("Content-Type", "application/json")

	code = http.postFromString(formattedResponse)
	logVerbose("Sent callback to: " + callbackUrl + " and received response code: " + code.toStr(), formattedResponse)
end sub
