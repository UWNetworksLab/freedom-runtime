window.freedom.on(window.freedom.events.READY, function() {
	_.each(window.freedom.providers, function(x) {
		console.log("provider found:" + x);
	});
	
	window.freedom.getProvider("js/interface/storage", ["platformstorage.userPersistance"], function(storage) {
		storage.get("defineasconstant_BUNDLES", function(result) {
			console.log("value of defineasconstant_BUNDLES: " + result[0]["defineasconstant_BUNDLES"]);
		});
	})
}, true);