var self = require('sdk/self');

var buttons = require('sdk/ui/button/action');
var tabs = require('sdk/tabs');

//const Cc = Components.classes;
let { Cc, Ci} = require('chrome');

function TracingListener() {
}


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
      console.log(this.receivedData.length);
      try {
        xhr.open("POST", "http://forex.champalimaud.pt/sink/", true);

        var response = "Address: " + request.name + "\n\n"

        for(var i = 0; i < this.receivedData.length; i++)
          response += this.receivedData[i];

        response += "\n"
        xhr.send(response);
      } catch(error) {
        console.log("Could not send request to server: ", error);
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


function eToroObserver()
{
  this.register();
}


eToroObserver.prototype =
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
var observer = new eToroObserver();


var button = require("sdk/ui/button/action").ActionButton({
  id: "style-tab",
  label: "Style Tab",
  icon: "./icon-16.png",
  onClick: function() {
    require("sdk/tabs").activeTab.attach({
      contentScript: 'setInterval(function() { document.getElementsByClassName("p-instrument-body")[0].scrollTop += 1000; }, 500);'
    });
  }
});


var button = require("sdk/ui/button/action").ActionButton({
  id: "style-tab",
  label: "Style Tab",
  icon: "./icon-16.png",
  onClick: function() {

    xhr.onreadystatechange = function() {
      if(xhr.readyState == 4) {
        console.log(xhr.responseText);
      }
    }

    //require("sdk/tabs").activeTab.attach({
      //contentScript: 'setInterval(function() { document.getElementsByClassName("p-instrument-body")[0].scrollTop += 1000; }, 500);'
    //});
  }
});


/**
 * Create a button
 */
/*var button = buttons.ActionButton({
  id: 'mozilla-link',
  label: 'Visit Mozilla',
  icon: {
    "16": "./icon-16.png",
    "32": "./icon-32.png",
    "64": "./icon-64.png"
  },
  onClick: handleClick
});

function handleClick(state)
{
  tabs.open("http://www.mozilla.org");
  console.log("Hi");
}*/
