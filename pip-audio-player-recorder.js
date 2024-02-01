/* pip-audio-player-recorder v1.0.2 */
/*
Notes:
- The DVR (or DAR) is based on the KVSC live stream
	- Using our hourly audio is just adding more delay and possibilities for issues I feel
	- Plus I need to fiugre out how to live-stream something that is already live-streamed and I didn't find any quick/easy solutions
	- This relies on what is buffered in your browser (ie. what has played)
- I'll continue to explore my "capture audio trivia" solution
- Could still develop an in/out method to subclip from our hourly audio to capture things like audio trivia
*/

// TODO: can I make this universal to detect if it's a stream vs file (ie. has end durration or not) and then accomodate accordingly  (should but need to test)

// TODO: add keyboard shortcuts

// TODO: if recording and the player stop button is pressed, stop the recording as well.

// TODO: [future feature] cache the response from the now_playing stream info and sync it up with timestamps so that it can change as you go back in time

// TODO: can I get the play bar indicator to not jump so much?  Look at how it's being updateed?  Add some animation logic somehow?

// TODO: BUG enabling the visualizer results in inability to record clips (throws error after clip is recorded)


function pipAudioPlayerLoad( options = {} ) {
	var playerOptionsDefault = {
		audioId: 'pip-audio-player',
		type: 'audio/mpeg',
		preload: 'preload',
		autoTrigger: false,
		triggerLabel: 'Start Audio',
		autoPlay: false,
		playerTimeDisplay: false,
		playerTimeLocale: 'en-us',
		hideStop: false,
		hideVolume: false,
		hideMute: false,
		allowReload: false,
		showSeekBar: true,
		skipAmountPadding: .5,
		skipAmountBack: 5,
		skipAmountForward: 5,
		streamInfoUrl: false,
		visualizerShow: false,
		visualizerHeight: 60,
		enableRecorder: false,
		recordedFileUploadUrl: false,
		recordedFileExtension: false,
		recorderNamingCallback: false,
	};

	let playerOptions = {
		...playerOptionsDefault,
		...options
	};

	if( !playerOptions.element || !playerOptions.source ) {
		return false;
	}
	
	var playerContainer = document.querySelector(playerOptions.element);
	if( !playerContainer ) {
		return false;
	}
	
	playerContainer.classList.add('pip-audio-player-container');
	playerContainer.classList.add( "center" );

	// define variables
	let playerLoaded = false;
	let playerState = 'not-started';
	let muteState = false;
	let volumeState = 75;
	let isStream = false;
	let isStreamInfoFetch = false;
	let streamInfoFetchInterval;
	let mediaCurrentTime = 0;
	let mediaDuration = 0;
	let playStartEpoch = 0;
	let defaultTimeDisplay = '00:00';
	let buttonColorActive = '#ff0000';

	// for audio recorder
	let audioPlayerStream;
	let audioTrack;
	let audioStream;
	let mediaStreamConstraints;
	let mediaRecorder;
	let mediaRecorderChunks = [];
	let capturedAudioBlobs = [];

	// for visualizer
	let canvasCtx;
	let audioCtx;

	// add loader
	var elemLoader = document.createElement("div");
	elemLoader.classList.add( "pip-audio-player-loader" );
	elemLoader.classList.add( "hide" );
	elemLoader.innerHTML = '<div>Loading...</div><div class="lds-ellipsis"><div></div><div></div><div></div><div></div></div>';
	playerContainer.appendChild(elemLoader);

	// add trigger button
	var elemTrigger = document.createElement("div");
	elemTrigger.classList.add( "pip-audio-player-trigger" );
	playerContainer.appendChild(elemTrigger);

	var elemBtnTrigger = document.createElement("button");
	elemBtnTrigger.classList.add('trigger');
	elemBtnTrigger.innerText = playerOptions.triggerLabel;
	elemTrigger.appendChild(elemBtnTrigger);
	
	let buttonColorDefault = window.getComputedStyle(elemTrigger.querySelector('button')).backgroundColor;

	// add stream info
	if( playerOptions.streamInfoUrl ) {
		var elemStreamInfo = document.createElement("div");
		elemStreamInfo.classList.add( "pip-audio-player-stream-info" );
		playerContainer.appendChild(elemStreamInfo);
	}

	// add continer for buttons
	var elemBtnContainer = document.createElement("div");
	elemBtnContainer.classList.add( "pip-audio-player-buttons" );
	playerContainer.appendChild(elemBtnContainer);

	// add empty seek bar element
	if( playerOptions.showSeekBar ) {
		var elemSeekWrapper = document.createElement("div");
		elemSeekWrapper.classList.add( "pip-audio-player-seek-wrapper" );
		playerContainer.appendChild(elemSeekWrapper);
		var elemSeekCurrent = document.createElement("span");
		var elemSeekRange = document.createElement("input");
		var elemSeekDuration = document.createElement("span");
	}
	
	if( playerOptions.playerTimeDisplay ) {
		var elemPlayerTimeWrapper = document.createElement("div");
		elemPlayerTimeWrapper.classList.add( "pip-audio-player-time" );
		elemPlayerTimeWrapper.classList.add( "hide" );
		playerContainer.appendChild(elemPlayerTimeWrapper);

		// container for start and end times
		var elemPlayerTimeContainerOverall = document.createElement("div");
		elemPlayerTimeWrapper.appendChild(elemPlayerTimeContainerOverall);

		// stream start time
		var elemPlayerTimeStart = document.createElement("span");
		elemPlayerTimeStart.classList.add("time");
		elemPlayerTimeStart.classList.add("time-start");
		elemPlayerTimeContainerOverall.appendChild(elemPlayerTimeStart);

		var elemPlayerTimeStartLabel = document.createElement("span");
		elemPlayerTimeStartLabel.classList.add("label");
		elemPlayerTimeStartLabel.innerText = 'Start: ';
		elemPlayerTimeStart.appendChild(elemPlayerTimeStartLabel);

		var elemPlayerTimeStartDisplay = document.createElement("span");
		elemPlayerTimeStartDisplay.classList.add("display");
		elemPlayerTimeStart.appendChild(elemPlayerTimeStartDisplay);

		// stream current time
		var elemPlayerTimeCurrent = document.createElement("span");
		elemPlayerTimeCurrent.classList.add("time");
		elemPlayerTimeCurrent.classList.add("time-current");
		elemPlayerTimeContainerOverall.appendChild(elemPlayerTimeCurrent);

		var elemPlayerTimeCurrentLabel = document.createElement("span");
		elemPlayerTimeCurrentLabel.classList.add("label");
		elemPlayerTimeCurrentLabel.innerText = 'Current: ';
		elemPlayerTimeCurrent.appendChild(elemPlayerTimeCurrentLabel);

		var elemPlayerTimeCurrentDisplay = document.createElement("span");
		elemPlayerTimeCurrentDisplay.classList.add("display");
		elemPlayerTimeCurrent.appendChild(elemPlayerTimeCurrentDisplay);

		// stream end time
		var elemPlayerTimeEnd = document.createElement("span");
		elemPlayerTimeEnd.classList.add("time");
		elemPlayerTimeEnd.classList.add("time-end");
		elemPlayerTimeContainerOverall.appendChild(elemPlayerTimeEnd);

		var elemPlayerTimeEndLabel = document.createElement("span");
		elemPlayerTimeEndLabel.classList.add("label");
		elemPlayerTimeEndLabel.innerText = 'End: ';
		elemPlayerTimeEnd.appendChild(elemPlayerTimeEndLabel);

		var elemPlayerTimeEndDisplay = document.createElement("span");
		elemPlayerTimeEndDisplay.classList.add("display");
		elemPlayerTimeEnd.appendChild(elemPlayerTimeEndDisplay);
	}

	// create empty elements
	var elemAudio = document.createElement('audio');
	elemAudio.id = playerOptions.audioId;
	var elemBtnPlayPause = document.createElement("button");
	var elemBtnBack = document.createElement("button");
	var elemBtnForward = document.createElement("button");
	var elemBtnLive = document.createElement("button");
	var elemBtnStop = document.createElement("button");
	var elemBtnReload = document.createElement("button");
	var elemBtnMute = document.createElement("button");
	var elemRangeVolume = document.createElement("input");
	var elemVisualizer = document.createElement("canvas");

	var elemBtnRecordStart = document.createElement("button");
	var elemBtnRecordStop = document.createElement("button");
	var elemBtnRecordDownload = document.createElement("button");
	var elemBtnRecordUpload = document.createElement("button");
	var recordedClipsWrapper = document.createElement("section");

	loadVisualizer();

	// load the audio source
	elemBtnTrigger.addEventListener('click', (event) => {
		showLoader();
		hideTrigger();

		if( playerOptions.controls ) {
			elemAudio.controls = playerOptions.controls;
		}
		if( playerOptions.preload ) {
			elemAudio.preload = playerOptions.preload;
		}
		if( playerOptions.enableRecorder ) {
			// TODO: only do this if the playerOptions.source comes from a different origin as this player
			elemAudio.crossOrigin = 'anonymous';
		}
		elemAudio.src = playerOptions.source;
		elemAudio.type = playerOptions.type;
		elemAudio.volume = volumeState / 100;
		playerContainer.appendChild(elemAudio);
	});
	if( playerOptions.autoTrigger ) {
		// NOTE: this may not function as expected due to Chrome (and other browsers) preventing auto-play
		elemBtnTrigger.click();
	}

	// wait for audio file to finish loading
	elemAudio.addEventListener('canplay', (event) => loadAudioElement(event));

	function showLoader() {
		elemLoader.classList.remove('hide');
	}

	function hideLoader() {
		elemLoader.classList.add('hide');
	}

	function showTrigger() {
		elemTrigger.classList.remove('hide');
	}

	function hideTrigger() {
		elemTrigger.classList.add('hide');
	}

	function showPlayerTime() {
		if( playerOptions.playerTimeDisplay ) {
			elemPlayerTimeWrapper.classList.remove( "hide" );
		}
	}

	function hidePlayerTime() {
		elemPlayerTimeWrapper.classList.add( "hide" );
	}

	function createButtonsPlayer() {
		if( playerLoaded ) {
			return;
		}

		// play / pause
		elemBtnPlayPause.classList.add('play-pause');
		elemBtnPlayPause.title = "Play / Pause audio";
		elemBtnPlayPause.innerHTML = '<i class="fa fa-play" aria-hidden="true"></i>';
		elemBtnContainer.appendChild(elemBtnPlayPause);

		elemBtnPlayPause.addEventListener("click", () => {
			playerStart();
		}, false, );

		// skip back
		elemBtnBack.classList.add('jump-back');
		elemBtnBack.title = "Go back " + playerOptions.skipAmountBack + " seconds";
		elemBtnBack.innerHTML = '<i class="fa fa-step-backward" aria-hidden="true"></i>';
		elemBtnContainer.appendChild(elemBtnBack);

		elemBtnBack.addEventListener("click", () => {
			playerSkipBack();
		}, false, );

		// skip forward
		elemBtnForward.classList.add('jump-forward');
		elemBtnForward.title = "Go forward " + playerOptions.skipAmountForward + " seconds";
		elemBtnForward.innerHTML = '<i class="fa fa-step-forward" aria-hidden="true"></i>';
		elemBtnContainer.appendChild(elemBtnForward);

		elemBtnForward.addEventListener("click", () => {
			playerSkipForward();
		}, false, );

		if( isStream ) {
			// skip to realtime
			elemBtnLive.classList.add('live');
			elemBtnLive.title = 'Jump to "now" in audio stream';
			elemBtnLive.innerText = "Live";
			elemBtnLive.innerHTML = '<i class="fa fa-fast-forward" aria-hidden="true"></i>';
			elemBtnContainer.appendChild(elemBtnLive);
			
			elemBtnLive.addEventListener("click", () => {
				playerSkipLive();
			}, false, );

			// stop player
			if( !playerOptions.hideStop ) {
				elemBtnStop.classList.add('stop');
				elemBtnStop.title = "Stop audio player";
				elemBtnStop.innerHTML = '<i class="fa fa-stop" aria-hidden="true"></i>';
				elemBtnContainer.appendChild(elemBtnStop);
				elemBtnStop.addEventListener("click", () => {
					stopPlayer();
				}, false, );
			}

			// reload player
			if( playerOptions.allowReload ) {
				elemBtnReload.classList.add('reload');
				elemBtnReload.title = "Reload audio player, refreshing audio source";
				elemBtnReload.innerHTML = '<i class="fa fa-refresh" aria-hidden="true"></i>';
				elemBtnContainer.appendChild(elemBtnReload);
				elemBtnReload.addEventListener("click", () => {
					reloadPlayer();
				}, false, );
			}
		}

		if( playerOptions.enableRecorder ) {
			createButtonsRecorder();

			// create container to list recorded clips
			recordedClipsWrapper.classList.add('recorded-clips-wrapper');
			playerContainer.appendChild( recordedClipsWrapper );
		}

		if( !playerOptions.hideVolume ) {
			// volume range
			elemRangeVolume.type = 'range';
			elemRangeVolume.title = 'Volume';
			elemRangeVolume.max = '100';
			elemRangeVolume.value = volumeState;
			elemRangeVolume.classList.add('volume');
			elemBtnContainer.appendChild(elemRangeVolume);

			elemRangeVolume.addEventListener('input', (e) => {
				const value = e.target.value;
				volumeState = value;

				// outputContainer.textContent = value;
				elemAudio.volume = value / 100;
			});
		}

		if( !playerOptions.hideMute ) {
			// mute button
			elemBtnMute.classList.add('mute');
			elemBtnMute.title = 'Mute';
			elemBtnMute.innerText = "Mute";
			elemBtnMute.innerHTML = '<i class="fa fa-volume-off" aria-hidden="true"></i>';
			elemBtnContainer.appendChild(elemBtnMute);

			elemBtnMute.addEventListener('click', () => {
				if( !muteState ) {
					elemAudio.muted = true;
					muteState = true;
					elemAudio.volume = 0;
					elemBtnMute.style.backgroundColor = buttonColorActive;
				} else {
					muteState = false;
					if( playerState != 'paused' ) {
						elemAudio.muted = false;
					}
					elemAudio.volume = volumeState / 100;
					elemBtnMute.style.backgroundColor = buttonColorDefault;
				}
			});
		}
	}

	function createButtonsRecorder() {
		if( playerLoaded ) {
			return;
		}
		if( !playerOptions.enableRecorder ) {
			return;
		}

		// start
		elemBtnRecordStart.classList.add('recorder');
		elemBtnRecordStart.classList.add('record-start');
		elemBtnRecordStart.title = "Start recording subclip";
		elemBtnRecordStart.innerHTML = '<i class="fa fa-circle" aria-hidden="true"></i>';
		elemBtnContainer.appendChild(elemBtnRecordStart);

		elemBtnRecordStart.addEventListener("click", () => {
			recordingStart();
		}, false, );

		// stop
		elemBtnRecordStop.classList.add('recorder');
		elemBtnRecordStop.classList.add('record-stop');
		elemBtnRecordStop.classList.add('hide');
		elemBtnRecordStop.title = "Stop recording subclip";
		elemBtnRecordStop.innerHTML = '<i class="fa fa-circle-thin" aria-hidden="true"></i><span class="duration"></span>';
		elemBtnContainer.appendChild(elemBtnRecordStop);

		elemBtnRecordStop.addEventListener("click", () => {
			recordingStop();
		}, false, );
	}

	function loadAudioElement() {
		if( playerLoaded ) {
			return;
		}
		hideLoader();
		
		isStream = elemAudio.duration == 'Infinity';

		// add seek bar elements
		if( playerOptions.showSeekBar ) {
			elemSeekCurrent.classList.add('time');
			elemSeekCurrent.classList.add('current-time');
			elemSeekCurrent.innerText = defaultTimeDisplay;
			elemSeekWrapper.appendChild(elemSeekCurrent);

			elemSeekRange.classList.add('seek-slider');
			elemSeekRange.type = "range";
			elemSeekRange.value = 0;
			elemSeekRange.max = 0;
			elemSeekWrapper.appendChild(elemSeekRange);

			elemSeekDuration.classList.add('time');
			elemSeekDuration.classList.add('duration');
			elemSeekDuration.innerText = defaultTimeDisplay;
			elemSeekWrapper.appendChild(elemSeekDuration);

			elemSeekRange.addEventListener('input', () => {
				elemAudio.currentTime = elemSeekRange.value;
				elemSeekCurrent.textContent = mediaDuration;
			});
		}

		createButtonsPlayer();

		if( playerOptions.autoPlay ) {
			playerStart();
		}

		elemAudio.addEventListener('timeupdate', () => {
			whilePlaying();
		});

		elemAudio.addEventListener('play', (activeAudioElem) => {
			playStartEpoch = (Date.now() / 1000);
			elemPlayerTimeStartDisplay.innerHTML = calculateTime( 0 );

			if( playerOptions.enableRecorder ) {
				// create stream object for recording
				audioPlayerStream = elemAudio.captureStream ? elemAudio.captureStream() : elemAudio.mozCaptureStream();
				audioTrack = audioPlayerStream.getAudioTracks()[0];

				audioStream = new MediaStream();
				audioStream.addTrack(audioTrack);

				mediaStreamConstraints = {
				  audio: {
					deviceId: 'default',
					groupId: 'default',
					autoGainControl: false,
					channelCount: 2,
					echoCancellation: true,
					latency: 0,
					noiseSuppression: true,
					sampleRate: 48000,
					sampleSize: 16,
					volume: 1.0,
					mediaSource: playerOptions.source
				  }
				};
				mediaRecorder = new MediaRecorder(audioStream, mediaStreamConstraints);
			}

			if( playerOptions.visualizerShow ) {
				startVisualizer( activeAudioElem.target, elemVisualizer );
			}
		});

		isStreamInfoFetch = false;
		if( isStream && playerOptions.streamInfoUrl ) {
			isStreamInfoFetch = true;
			getStreamInfo();

			streamInfoFetchInterval = setInterval(function() {
				getStreamInfo();
			}, 5000);
		}

		playerLoaded = true;
	}

	function getIsPlaying( player ) {
		let atStart = ( player.currentTime == 0 ? true : false );
		if( ( atStart && player.paused ) || ( player.ended && player.readyState == 0 ) ) {
			return false
		}
		return true
	}

	function playerStart() {
		if( playerState == 'not-started' || playerState == 'paused' || playerState == 'stopped' ) {
			// player is paused/not-playing/in-audible
			if( isStream ) {
				elemAudio.muted = false;
				elemAudio.currentTime = mediaCurrentTime;
			}
			if( !getIsPlaying(elemAudio) ) {
				elemAudio.play();
			}
			elemBtnPlayPause.innerHTML = '<i class="fa fa-pause" aria-hidden="true"></i>';
			playerState = 'playing';
			showPlayerTime();
		} else {
			// player is playing
			if( !isStream ) {
				elemAudio.pause();
			} else {
				mediaCurrentTime = elemAudio.currentTime;
				elemAudio.muted = true;
			}
			elemBtnPlayPause.innerHTML = '<i class="fa fa-play" aria-hidden="true"></i>';
			playerState = 'paused';
		}
	}

	function playerSkipBack() {
		elemAudio.currentTime -= playerOptions.skipAmountBack;
	}

	function playerSkipForward() {
		let jumpTo = elemAudio.currentTime + playerOptions.skipAmountForward;
		if( jumpTo >= ( (Date.now() / 1000) - playStartEpoch ) ) {
			jumpTo = ( (Date.now() / 1000) - playStartEpoch ) - playerOptions.skipAmountPadding;
		}
		elemAudio.currentTime = jumpTo;
	}

	function playerSkipLive() {
		jumpTo = ( (Date.now() / 1000) - playStartEpoch ) - playerOptions.skipAmountPadding;
		mediaCurrentTime = jumpTo;
		playerState = 'paused';
		playerStart();
	}

	function stopPlayer() {
		// NOTE: going from play to stop, wait, then play restarts the previous clip.  It doesn't properly reset things.
		elemAudio.pause();
		playerState = 'stopped';
		isStreamInfoFetch = false;
		elemBtnPlayPause.innerHTML = '<i class="fa fa-play" aria-hidden="true"></i>';
		mediaCurrentTime = 0;
		mediaDuration = 0;
		playStartEpoch = 0;
		setAudioDuration();
		displayCurrentTime();
		displayDuration();
		elemPlayerTimeStartDisplay.innerHTML = calculateTime( playStartEpoch );
		setSliderMax();

		clearInterval(streamInfoFetchInterval);

		// kill audio recording
		audioPlayerStream;
		audioTrack;
		audioStream;
		mediaRecorder;
	}

	function reloadPlayer() {
		stopPlayer();
		hidePlayerTime();
		playerContainer.innerHTML = "";
		playerOptions.autoTrigger = true;
		pipAudioPlayerLoad( playerOptions );
		showPlayerTime();
	}

	function whilePlaying() {
		if( !playerOptions.showSeekBar ) {
			return;
		}

		if( isStream && playerState == 'paused' ) {
			elemSeekRange.value = mediaCurrentTime;
		} else {
			elemSeekRange.value = Math.floor( elemAudio.currentTime );
		}
		displayCurrentTime();
		if( isStream ) {
			setAudioDuration();
			displayDuration();
			setSliderMax();
		}

		elemPlayerTimeCurrentDisplay.innerHTML = calculateTime( elemSeekRange.value );
	}

	function setAudioDuration() {
		if( !playerOptions.showSeekBar ) {
			return;
		}

		let audioDuration = elemAudio.duration;
		if( isStream ) {
			if( playerState == 'stopped' ) {
				audioDuration = 0;
			} else {
				audioDuration = ( elemAudio.currentTime == 0 && playStartEpoch == 0 ? 0 : ( (Date.now() / 1000) - playStartEpoch ) );
			}
		}
		mediaDuration = Math.floor( audioDuration );
	}

	function setSliderMax() {
		if( !playerOptions.showSeekBar ) {
			return;
		}

		elemSeekRange.max = mediaDuration;
	}

	function displayDuration() {
		if( !playerOptions.showSeekBar ) {
			return;
		}

		elemSeekDuration.textContent = calculateDuration( mediaDuration );
		elemPlayerTimeEndDisplay.innerHTML = calculateTime( mediaDuration );
	}

	function displayCurrentTime() {
		if( !playerOptions.showSeekBar ) {
			return;
		}

		let displayCurrentTime = elemAudio.currentTime;
		if( isStream ) {
			if( playerState == 'stopped' ) {
				displayCurrentTime = 0;
			} else if( playerState == 'paused' ) {
				displayCurrentTime = mediaCurrentTime;
			}
		}
		elemSeekCurrent.textContent = calculateDuration( displayCurrentTime );
	}

	function calculateDuration( secs ) {
		if( !playerOptions.showSeekBar ) {
			return;
		}

		const hours = Math.floor( secs / ( 60 * 60 ) );
		const minutes = Math.floor( secs / 60 );
		const seconds = Math.floor( secs % 60 );
		const returnedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
		const returnedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
		return ( hours > 0 ? hours + ':' : '' ) + returnedMinutes + ':' + returnedSeconds;
	}

	function calculateTime( secs ) {
		if( !playerOptions.playerTimeDisplay ) {
			return;
		}

		if( playerState == 'stopped' ) {
			return '--';
		}

		let epochCalculated = ( playStartEpoch * 1000 ) + ( secs * 1000 );
		return getTimeStringFromEpoch( epochCalculated );
	}

	function getTimeStringFromEpoch( epoch ) {
		let dateObj = new Date( epoch );
		if( playerOptions.playerTimeDisplay == 'timestamp' ) {
			return dateObj.toLocaleTimeString()			
		} else if( playerOptions.playerTimeDisplay == 'datetime' ) {
			return dateObj.toLocaleDateString(playerOptions.playerTimeLocale, { year:"numeric", month:"short", day:"numeric"}) + '<br/>' + dateObj.toLocaleTimeString()
		}		
	}

	function getStreamInfo() {
		if( isStreamInfoFetch && playerOptions.streamInfoUrl ) {
			var requestUrl = playerOptions.streamInfoUrl;
			requestUrl += ( requestUrl.indexOf('?') > -1 ? '&' : '?' );
			requestUrl += 'nocache=' + (Date.now() / 1000);
			fetch( requestUrl )
				.then(
					function( response ) {
						if( response.status !== 200 ) {
							console.error('Error fetching stream info Status Code: ' + response.status );
							return;
						}

						// Examine the text in the response
						response.json().then(function(data) {
							elemStreamInfo.innerHTML = '';
							if( data.show_name ) {
								var elemStreamName = document.createElement("h3");
								elemStreamName.innerHTML = data.show_name;
								elemStreamInfo.appendChild(elemStreamName);
							}
							if( data.dj_name ) {
								var elemStreamDj = document.createElement("div");
								elemStreamDj.innerHTML = '<b>DJ</b>: ' + data.dj_name;
								elemStreamInfo.appendChild(elemStreamDj);
							}
							var songHtml = '';
							if( data.song ) {
								songHtml += '<b>Song</b>: ' + data.song;
							}
							if( data.artist ) {
								songHtml += ' by ' + data.artist;
							}
							if( songHtml ) {
								var elemStreamSong = document.createElement("div");
								elemStreamSong.innerHTML = songHtml;
								elemStreamInfo.appendChild(elemStreamSong);
							}
						});
					}
				)
				.catch(function(err) {
					console.error('Fetch Error :-S', err);
				});
		}
	}

	function loadVisualizer() {
		if( playerOptions.visualizerShow ) {
			elemVisualizer.classList.add('visualizer');
			elemVisualizer.height = playerOptions.visualizerHeight;
			playerContainer.appendChild(elemVisualizer);
		}
	}

	function startVisualizer( audioElem, canvas ) {
		if( playerOptions.visualizerShow ) {
			if (!audioCtx) {
				audioCtx = new AudioContext();
			}

			const canvasCtx = canvas.getContext("2d");
			audioPlayerStream = elemAudio.captureStream ? elemAudio.captureStream() : elemAudio.mozCaptureStream();
			audioTrack = audioPlayerStream.getAudioTracks()[0];

			audioStream = new MediaStream();
			audioStream.addTrack(audioTrack);

			const source = audioCtx.createMediaStreamSource(audioStream);

			const analyser = audioCtx.createAnalyser();
			analyser.fftSize = 2048;
			const bufferLength = analyser.frequencyBinCount;
			const dataArray = new Uint8Array(bufferLength);

			source.connect(analyser);

			draw();
			function draw() {
				const WIDTH = canvas.width;
				const HEIGHT = canvas.height;

				requestAnimationFrame(draw);

				analyser.getByteTimeDomainData(dataArray);

				canvasCtx.fillStyle = "rgb(200, 200, 200)";
				canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

				canvasCtx.lineWidth = 2;
				canvasCtx.strokeStyle = "rgb(0, 0, 0)";

				canvasCtx.beginPath();

				let sliceWidth = (WIDTH * 1.0) / bufferLength;
				let x = 0;

				for (let i = 0; i < bufferLength; i++) {
					let v = dataArray[i] / 128.0;
					let y = (v * HEIGHT) / 2;

					if (i === 0) {
						canvasCtx.moveTo(x, y);
					} else {
						canvasCtx.lineTo(x, y);
					}

					x += sliceWidth;
				}

				canvasCtx.lineTo(canvas.width, canvas.height / 2);
				canvasCtx.stroke();
			}
		}
	}

	function recordingStart() {
		if( playerState == 'not-started' || playerState == 'paused' || playerState == 'stopped' ) {
			playerStart();
		}

		// recording duration
		var recordingDuration = 0;
		captureRecordingDuration = setInterval(function() {
			recordingDuration += 1;
			document.querySelector('.record-stop .duration').innerText = ' '+recordingDuration;
		}, 1000);

		mediaRecorderChunks = [];
		mediaRecorder.start();
		elemBtnRecordStart.classList.add('hide');

		elemBtnRecordStop.classList.remove('hide');
		elemBtnRecordStop.style.background = buttonColorActive;

		mediaRecorder.ondataavailable = function (e) {
			mediaRecorderChunks.push(e.data);
		};

		mediaRecorder.onstop = function (e) {
			// recording duration clear
			clearInterval( captureRecordingDuration );
			var recordingEpochEnd = Math.floor( Date.now());
			var recordingEpochStart = recordingEpochEnd - ( recordingDuration * 1000 );

			document.querySelector('.record-stop .duration').innerText = '';

			var defaultClipName;

			if( playerOptions.recorderNamingCallback ) {
				defaultClipName = self[playerOptions.recorderNamingCallback]();
			}

			if( !defaultClipName ) {
				var now = new Date;
				defaultClipName = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0') + 'T' + String(now.getHours()).padStart(2,'0') + '-' + String(now.getMinutes()).padStart(2,'0') + '-' + String(now.getSeconds()).padStart(2,'0');
			}

			const clipName = prompt(
				"Enter a name for the recorded audio clip?",
				defaultClipName
			);

			const clipFormat = mediaRecorder.mimeType
				.replace('audio/','')
				.split(';')
				[0]
				.replace('webm','weba')
				.replace('mpeg','mp3')
				.replace('wave','wav')
				.replace('x-wav','wav')
				.replace('x-pn-wav','wav')
				;

			var lastClipKey = Object.keys(Object.fromEntries(Object.entries(capturedAudioBlobs).sort())).pop();
			var lastClipInt = ( lastClipKey ? parseInt( lastClipKey.split('-')[1] ) : 0 );

			const recordedClipId = 'clip-' + (lastClipInt + 1);

			const recordedClipContainer = document.createElement("article");
			recordedClipContainer.classList.add("clip");
			recordedClipContainer.id = recordedClipId;
			recordedClipContainer.dataset.clipName = clipName;
			recordedClipContainer.dataset.clipFormat = clipFormat;


			// collected the recorded audio into an audio element
			const recordedAudioElemWrapper = document.createElement("div");
			recordedAudioElemWrapper.classList.add('clip-wrapper');
			const recordedAudioElem = document.createElement("audio");
			recordedAudioElem.setAttribute("controls", "");
			const recordedAudioElemInfo = document.createElement("div");
			recordedAudioElemInfo.classList.add('clip-info');

			recordedAudioElem.controls = true;
			const mediaRecorderBlob = new Blob(mediaRecorderChunks, { type: mediaRecorder.mimeType });

			const audioURL = window.URL.createObjectURL(mediaRecorderBlob);
			recordedAudioElem.src = audioURL;

			capturedAudioBlobs[recordedClipId] = mediaRecorderBlob;

			// download button
			const recordedClipDownloadButtonLink = document.createElement("a");
			recordedClipDownloadButtonLink.download = clipName; 
			recordedClipDownloadButtonLink.href = audioURL; 
			recordedClipDownloadButtonLink.innerHTML = '<i class="fa fa-download" aria-hidden="true"></i>';

			const recordedClipDownloadButton = document.createElement("button");
			recordedClipDownloadButton.title = "Download this clip";
			recordedClipDownloadButton.className = "download";
			recordedClipDownloadButton.appendChild(recordedClipDownloadButtonLink);

			recordedClipDownloadButton.onclick = () => { 
				/* After download revoke the created URL using URL.revokeObjectURL()
				method to avoid possible memory leak. Though, the browser automatically
				revokes the created URL when the document is unloaded, but still
				it is good to revoke the created URLs */
				URL.revokeObjectURL(recordedAudioElem); 
			};

			// delete button
			const recordedClipDeleteButton = document.createElement("button");
			recordedClipDeleteButton.title = "Delete this clip";
			recordedClipDeleteButton.className = "delete";
			recordedClipDeleteButton.innerHTML = '<i class="fa fa-trash" aria-hidden="true"></i>';

			const recordedClipLabel = document.createElement("span");
			recordedClipLabel.classList.add('clip-name');
			if (clipName === null) {
				recordedClipLabel.textContent = "Recorded Clip";
			} else {
				recordedClipLabel.textContent = clipName;
			}

			// upload button
			const recordedClipUploadButton = document.createElement("button");
			if( playerOptions.recordedFileUploadUrl ) {
				recordedClipUploadButton.title = "Upload this clip";
				recordedClipUploadButton.className = "upload";
				recordedClipUploadButton.innerHTML = '<i class="fa fa-upload" aria-hidden="true"></i>';

				recordedClipUploadButton.onclick = (event) => { 
					sendAudioFileToServer(event);
				};
			}

			// edit clip label
			const recordedClipLabelEditButton = document.createElement("button");
			recordedClipLabelEditButton.title = "Edit clip name";
			recordedClipLabelEditButton.className = "edit";
			recordedClipLabelEditButton.innerHTML = '<i class="fa fa-pencil-square-o" aria-hidden="true"></i>';

			recordedClipLabelEditButton.onclick = function () {
				const recordedClipLabelExisting = recordedClipLabel.textContent;
				const recordedClipLabelNew = prompt("Change name for your sound clip?");
				if( recordedClipLabelNew === null ) {
					recordedClipLabel.textContent = recordedClipLabelExisting;
					recordedClipContainer.dataset.clipName = recordedClipLabelExisting;
				} else {
					recordedClipLabel.textContent = recordedClipLabelNew;
					recordedClipContainer.dataset.clipName = recordedClipLabelNew;
				}
			};

			const recordedClipInfoStart = document.createElement("span");
			recordedClipInfoStart.classList.add('clip-time-start');
			recordedClipInfoStart.classList.add('time');
			recordedClipInfoStart.innerHTML = '<span class="label">Start:</span>' + getTimeStringFromEpoch( recordingEpochStart );
			recordedAudioElemInfo.appendChild(recordedClipInfoStart);

			const recordedClipInfoEnd = document.createElement("span");
			recordedClipInfoEnd.classList.add('clip-time-end');
			recordedClipInfoEnd.classList.add('time');
			recordedClipInfoEnd.innerHTML = '<span class="label">End:</span>' + getTimeStringFromEpoch( recordingEpochEnd );
			recordedAudioElemInfo.appendChild(recordedClipInfoEnd);

			const recordedClipInfoDuration = document.createElement("span");
			recordedClipInfoDuration.classList.add('clip-time-end');
			recordedClipInfoDuration.classList.add('time');
			recordedClipInfoDuration.innerHTML = '<span class="label">Seconds:</span>' + recordingDuration;
			recordedAudioElemInfo.appendChild(recordedClipInfoDuration);

			recordedClipDeleteButton.onclick = function (e) {
				var clipId = e.target.closest("article.clip").id;
				delete capturedAudioBlobs[clipId];
				e.target.closest("article.clip").remove();
			};

			// add recorded clip to list of recordings
			recordedClipContainer.appendChild(recordedAudioElemWrapper);
			recordedClipContainer.appendChild(recordedAudioElemInfo);
			recordedAudioElemWrapper.appendChild(recordedAudioElem);
			recordedAudioElemWrapper.appendChild(recordedClipLabel);
			recordedAudioElemWrapper.appendChild(recordedClipLabelEditButton);
			recordedAudioElemWrapper.appendChild(recordedClipDownloadButton);
			recordedAudioElemWrapper.appendChild(recordedClipDeleteButton);
			if( playerOptions.recordedFileUploadUrl ) {
				recordedAudioElemWrapper.appendChild(recordedClipUploadButton);
			}
			recordedClipsWrapper.appendChild(recordedClipContainer);

			// inform clip has been added for listeners to act upon
			var postMessageBody = {
				title: 'pip-audio-player-recorder-clip-complete',
				clipId: recordedClipId,
				clipName: clipName
			}
			window.parent.postMessage(postMessageBody, window.location.origin);

		};
	}

	function recordingStop() {
		mediaRecorder.stop();
		elemBtnRecordStart.classList.remove('hide');
		elemBtnRecordStop.classList.add('hide');
	}

	function sendAudioFileToServer(event) {
		if( !playerOptions.recordedFileUploadUrl ) {
			return false;
		}

		var audioContainer = event.target.closest('article.clip');
		if( !parent ) {
			return false;
		}

		var clipId = audioContainer.id;
		var clipName = audioContainer.dataset.clipName;
		var clipFormat = audioContainer.dataset.clipFormat;
		if( playerOptions.recordedFileExtension ) {
			clipFormat = playerOptions.recordedFileExtension;
		}
		var clipBlob = capturedAudioBlobs[clipId];

		window.sendAudioFileToServerId = clipId;

		// clear any existing success indicators
		if( document.getElementById(clipId).querySelector('button.upload i.fa-check') ) {
			document.getElementById(clipId).querySelector('button.upload i.fa-check').remove();
		}

		// get audio stream
		const reader = new FileReader();
		reader.readAsDataURL(clipBlob);
		reader.onloadend = function() {
			// get base64
			let base64 = reader.result;

			// get only base64 data
			base64 = base64.split(',')[1];
		 
			// create an instance for AJAX
			var ajax = new XMLHttpRequest();

			ajax.onreadystatechange = () => {
				if( ajax.readyState === 4 ) {
					var response = ajax.response;
					if( response == 'success' ) {
						document.getElementById(window.sendAudioFileToServerId).querySelector('button.upload').innerHTML += '<i class="fa fa-check" aria-hidden="true" style="margin-left: 10px; color: #f7ff60;"></i>';
						window.sendAudioFileToServerId = '';
					}
				}
			};

			// set request method as POST, set URL and set asynchronous to true
			ajax.open("POST", playerOptions.recordedFileUploadUrl, true );

			// send base64 string to server
			const formData = new FormData();
			formData.append("clipName", clipName);
			formData.append("clipFormat", clipFormat);
			formData.append("audioBase64", base64);
			ajax.send(formData);
		}
	};

}
