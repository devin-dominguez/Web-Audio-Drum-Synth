var snareTrigger = document.getElementById("snareTrigger");
snareTrigger.onclick = function(e) {
	snare.trigger(settings.snare);
};

var kickTrigger = document.getElementById("kickTrigger");
kickTrigger.onclick = function(e) {
	kick.trigger(settings.kick);
};

var closedHatTrigger = document.getElementById("closedHatTrigger");
closedHatTrigger.onclick = function(e) {
	highHat.trigger(settings.closedHat);
};

var openHatTrigger = document.getElementById("openHatTrigger");
openHatTrigger.onclick = function(e) {
	highHat.trigger(settings.openHat);
};

var percussionTrigger = document.getElementById("percussionTrigger");
percussionTrigger.onclick = function(e) {
	percussion.trigger(settings.percussion);
};