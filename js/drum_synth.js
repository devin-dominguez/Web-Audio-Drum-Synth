"use strict";

//----------------------------------------------------
//WEB AUDIO SETUP AND HACKY STUFF
//----------------------------------------------------
var audio = new AudioContext();

var out = audio.createGain();
out.gain.value = .75;
out.connect(audio.destination);

//create 1 second of looped white noise
function createNoiseSource(duration) {
	var bufferSize = duration * audio.sampleRate;
	var buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
	var samples = buffer.getChannelData(0);

	for (var i = 0; i < bufferSize; i++) {
		samples[i] = Math.random() * 2 - 1;
	}

	var noise = audio.createBufferSource();
	noise.buffer = buffer;
	noise.loop = true;
	return noise;
}

var noiseSource = createNoiseSource(1);
noiseSource.start();

//create audio rate dc offset for filtered envelopes
//essentially a straight up 
var sigCos = new Float32Array(2);
sigCos[0] = 0;
sigCos[1] = 1;

var sigSin = new Float32Array(2);
sigSin[0] = 0;
sigSin[1] = 0;

var sigWave = audio.createPeriodicWave(sigCos, sigSin);

var sig = audio.createOscillator();
sig.setPeriodicWave(sigWave);
sig.start();
sig.frequency.value = 0;
sig.frequency.setValueAtTime(0, audio.currentTime);

//default settings
var settings = {
	snare: {
		decay: 100,
		sustain: 125,
		release: 50,
		sustainLevel: .125,
		freq: 750,
		Q: 4,
		sineLevel: .045
	},
	kick: {
		decay: 50,
		sustain: 60,
		release: 100,
		sustainLevel: .125,
		freqStart: 100,
		freqEnd: 50
	},
	closedHat: {
		decay: 25,
		sustain: 15,
		release: 20,
		sustainLevel: .125,
		freq: 4000,
		Q: 20,
		sineLevel: 0
	},
	openHat: {
		decay: 150,
		sustain: 250,
		release: 750,
		sustainLevel: .25,
		freq: 4000,
		Q: 20,
		sineLevel: 0

	},
	percussion :{

	}
};

//----------------------------------------------------
//NOISE DRUM
//----------------------------------------------------
function NoiseDrum() {
	var filter = audio.createBiquadFilter();
	filter.type = "bandpass";

	var amp = audio.createGain();
	amp.gain.value = 0;

	var sine = audio.createOscillator();
	sine.type = "sine";
	sine.start();

	var sineAmp = audio.createGain();
	sineAmp.gain.value = 0;

	var env = audio.createGain();
	env.gain.value = 0;

	var envFilter = audio.createBiquadFilter();
	envFilter.type = "lowpass";
	envFilter.Q = 0;
	envFilter.frequency = 24;

	sig.connect(env);
	env.connect(envFilter);
	envFilter.connect(amp.gain);

	noiseSource.connect(filter);
	filter.connect(amp);

	sine.connect(sineAmp);
	sineAmp.connect(amp);

	//amp.connect(out);
	
	return {
		connect: function(target) {
			amp.connect(target);
		},
		disconnect: function(target) {
			amp.disconnect(target);
		},
		trigger: function(args, time, velocity) {
			//ARGS = decay, sustain, release, sustainLevel, freq, Q, sineLevel
			var now = time || audio.currentTime;
			var level = velocity * velocity || .5625;
			var decay = args.decay / 1000;
			var sustain = args.sustain / 1000;
			var release = args.release / 1000;
			var sustainLevel = args.sustainLevel;
			var sineLevel = args.sineLevel;
			var freq = args.freq;
			var Q = args.Q;

			filter.frequency.setValueAtTime(freq, now);
			filter.Q.setValueAtTime(Q, now);

			sine.frequency.setValueAtTime(freq / 4, now);
			sineAmp.gain.setValueAtTime(sineLevel, now);

			env.gain.cancelScheduledValues(now);
			env.gain.linearRampToValueAtTime(0, now + .005);
			env.gain.linearRampToValueAtTime(1, now + .01);
			env.gain.linearRampToValueAtTime(sustainLevel, now + .01 + decay);
			env.gain.setValueAtTime(sustainLevel, now + .01 + decay + sustain);
			env.gain.linearRampToValueAtTime(0, now + .01 + decay + sustain + release);
		}
	};
}

//----------------------------------------------------
//SINE DRUM
//----------------------------------------------------
function SineDrum() {
	var amp = audio.createGain();
	amp.gain.value = 0;

	var sine = audio.createOscillator();
	sine.type = "sine";
	sine.start();
	sine.frequency.setValueAtTime(settings.kick.freqStart, audio.currentTime);

	var env = audio.createGain();
	env.gain.value = 0;

	var envFilter = audio.createBiquadFilter();
	envFilter.type = "lowpass";
	envFilter.Q = 0;
	envFilter.frequency = 48;

	sig.connect(env);
	env.connect(envFilter);
	envFilter.connect(amp.gain);

	sine.connect(amp);
	//amp.connect(out);
	
	return {
		connect: function(target) {
			amp.connect(target);
		},
		disconnect: function(target) {
			amp.disconnect(target);
		},
		trigger: function(args, time, velocity) {
			//ARGS = decay, sustain, release, sustainLevel, freqStart, freqEnd
			var now = time || audio.currentTime;
			var level = velocity * velocity || .5625;
			var decay = args.decay / 1000;
			var sustain = args.sustain / 1000;
			var release = args.release / 1000;
			var sustainLevel = args.sustainLevel * level;
			var freqStart = args.freqStart;
			var freqEnd = args.freqEnd;

			sine.frequency.cancelScheduledValues(now + .009);
			sine.frequency.setValueAtTime(freqStart, now + .01);
			sine.frequency.exponentialRampToValueAtTime(freqEnd, now + .01 + decay + sustain + release);

			env.gain.cancelScheduledValues(now);
			env.gain.linearRampToValueAtTime(0, now + .009);
			env.gain.linearRampToValueAtTime(level, now +.01);
			env.gain.linearRampToValueAtTime(sustainLevel, now + .01 + decay);
			env.gain.setValueAtTime(sustainLevel, now + .01 + decay + sustain);
			env.gain.linearRampToValueAtTime(0, now + .01 + decay + sustain + release);
		}
	};
}

//----------------------------------------------------
//SETUP CHANNELS
//----------------------------------------------------

var snare = new NoiseDrum();
snare.connect(out);
var kick = new SineDrum();
kick.connect(out);
var highHat = new NoiseDrum();
highHat.connect(out);