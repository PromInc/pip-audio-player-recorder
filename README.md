# pip-audio-player-recorder
Audio Player &amp; Recorder (Live Stream)

- A web based Digital Audio Recorder (aka DAR or DVR) software
- Many configurable options to control the features
- Record subclips of the live stream
  - Download recorded subclips
  - Upload recorded subclips to a remote server

![pip-audio-recorder-screenshot-1](https://github.com/PromInc/pip-audio-player-recorder/assets/7319505/766d9ddc-2e76-4569-bf4b-f4a19cf28899)

![pip-audio-recorder-screenshot-2](https://github.com/PromInc/pip-audio-player-recorder/assets/7319505/26d90b5b-a9e9-4da4-8b40-d2cfd9e9b326)

## Live Demo
A live demo of this audio file and live stream audio player can be found at [PromInc Productions](https://promincproductions.com/blog/code/pip-audio-player-recorder/)

## Usage
- Load the CSS file in the `<head>` of the page
- Load the JS file in the `<head>` of the page
- Create an emptty HTML `<div>` with an uniqe `id`
- Define the configuration
- Load the player

```
<head>
  <link type="text/css" rel="stylesheet" href="css/pip-audio-player.css">
  <link rel="stylesheet" href="font-pip-audio-player-recorder-1.0/style.css">
  <script type="text/javascript" src="js/pip-audio-player.js"></script>
</head>

<body>
  <div id="pip-dar"></div>
  <script type="text/javascript">
    var options = {
      element: '#pip-dar',
      source: 'https://corn.kvsc.org/broadband',
      audioId: 'kv-live-stream',
      autoPlay: true,
      playerTimeDisplay: 'timestamp',
      triggerLabel: 'Play Livestream',
      skipAmountForward: 5,
      skipAmountBack: 5,
      allowReload: true,
      hideStop: true,
      streamInfoUrl: 'https://kvsc.org/now_playing_clean.txt',
      visualizerShow: true,
      visualizerHeight: 50,
      enableRecorder: true,
      recordedFileUploadUrl: 'https://example.com/audio-upload.php',
      recordedFileExtension: 'mp3'
    };
    pipAudioPlayerLoad( options );
  </script>
</body>
```

## Configuration Options

| Option Name | Required | Default Value | Description | Version |
| ----------- | -------- | ------------- | ----------- | ----------- |
| `audioId` | No | `pip-audio-player` | ID of the player `<audio>` element. | 1.0.0 |
| `type` | No | `audio/mpeg` | Audio format. | 1.0.0 |
| `preload` | No | `preload` | Set the `preload` attribute on the `<audio>` element. | 1.0.0 |
| `autoTrigger` | No | `false` | Auto-click the play button.  Note: if `true` with `autoPlay` = `true` browsers may not autoplay out of respect to users. | 1.0.0 |
| `triggerLabel` | No | `'Start Audio'` | Text on the button to trigger the player. | 1.0.0 |
| `autoPlay` | No | `false` | Will the audio auto-play? | 1.0.0 |
| `playerTimeDisplay` | No | `false` | Show time or date/time formatted times.  Options: `false`, `timestamp`, `datetime` | 1.0.0 |
| `playerTimeLocale` | No | `en-us` | Locale to display date and timestamp in | 1.0.2 |
| `hideStop` | No | `false` | Hide the Stop button. | 1.0.0 |
| `hideVolume` | No | `false` | Hide the volume slider. | 1.0.0 |
| `hideMute` | No | `false` | Hide the mute button. | 1.0.0 |
| `allowReload` | No | `false` | Show the Reload button to restart the player. | 1.0.0 |
| `showSeekBar` | No | `true` | Should the seek bar (time history) be displayed? | 1.0.0 |
| `skipAmountPadding` | No | `.5` | In Seconds.  A buffer amount in time to be subtracted when skipping to ensure that the stream continues to play. | 1.0.0 |
| `skipAmountBack` | No | `5` | In Seconds.  What time interval to jump backwards in time. | 1.0.0 |
| `skipAmountForward` | No | `5` | In Seconds.  What time interval to jump forwards in time. | 1.0.0 |
| `streamInfoUrl` | No | `false` | If the live stream provides a URL that will display stream information (ie. dj, station name, etc.), set it here to have that data fetched.  Providing a value will turn this feature on. | 1.0.0 |
| `visualizerShow` | No | `false` | Should the visualizer (realtime audio waveform) display? | 1.0.0 |
| `visualizerHeight` | No | `60` | Height in pixels for the visualizer. | 1.0.0 |
| `enableRecorder` | No | `false` | Enable recoding functionality.  Clips are recorded locally in memory and can be downloaded to the machine hard drive. | 1.0.0 |
| `recordedFileUploadUrl` | No | `false` | If set, and upload to server button is enabled.  This value is the URL that the audio stream file should be sent to. | 1.0.0 |
| `recordedFileExtension` | No | `false` | File extension that recorded clips will have.  If not set, the default clip format will be used, typically `weba`.  Do not include a leading period (`.`). | 1.0.0 |
| `recorderNamingCallback` | No | `false` | The default naming of a recorded clip is the date/time stamp.  The name can be altered, but there may be situations where custom logic is needed to generate a default name.  Use this setting to name a function to call to generate a default recorded clip name. | 1.0.0 |

## Icongraphy
The player button icons are part of the FontAwesome icon font.  The icons have been in the FontAwesome set for a long time - tested on version 4.0 and working.

If your site already includes the FontAwesome library then the supplied icons are not required and this can be safely excluded:
- `<link rel="stylesheet" href="font-pip-audio-player-recorder-1.0/style.css">`
- Directory of `font-pip-audio-player-recorder-1.0/`

## Code Examples
Some example code clips to help extend the default functionality.

### Audio File Player
While this player works great with live streams, it's also an audio file player as well for pre-recorded audio.

```
<script type="text/javascript">
var options = {
	element: '#pip-dar-demo-2',
	source: 'a-great-song.mp3',
	audioId: 'audio-file',
	autoTrigger: true,
	triggerLabel: 'Play Audio File',
	skipAmountForward: 5,
	skipAmountBack: 5,
	allowReload: false,
	hideStop: false,
};
pipAudioPlayerLoad( options );
</script>
```

### Recorded Clip Naming Callback
When recording clips, the default naming convention is recording end date/time.  That may not be the desired naming convention.  A custom Javaascript function declared before calling `pipAudioPlayerLoad( { ... } );`.  This function name needs to be set to the `recorderNamingCallback` argument.

```
function customDefaultRecordedClipName() {
  let time = new Date();
  return window.location.pathname + '-' + time.getFullYear() + '-' + ( time.getMonth() + 1 ) + '-' + time.getDate();
}
```

### Upload File Endpoint (PHP)
To upload recorded clips to a server, save this code to a PHP file on the server.  The path to this file would be set to the `recordedFileUploadUrl` argument.

```
<?php
$SUCCESS = 'success';
$ERROR = 'error';

$saveDir = 'audio/';

if( isset( $_POST["audioBase64"] ) && !empty( $_POST["audioBase64"] ) ) {
	$audioBase64 = $_POST["audioBase64"];
} else {
	echo $ERROR;
	return;
}

if( isset( $_POST["clipName"] ) && !empty( $_POST["clipName"] ) ) {
	$clipName = $_POST["clipName"];
} else {
	$clipName = time();
}

if( isset( $_POST["clipFormat"] ) && !empty( $_POST["clipFormat"] ) ) {
	$clipExt = $_POST["clipFormat"];
} else {
	$clipExt = 'weba';
}

$saveFilePath = $saveDir . $clipName . '.' . $clipExt;

if( file_put_contents( $saveFilePath, base64_decode( $audioBase64 ) ) ) {
	echo $SUCCESS;
} else {
	echo $ERROR;
}
```


---
# Changelog
## v1.0.3 (2024-02-06)
- Enhancement: support for audio files
- Bug Fix: cross origin for non-stream files
## v1.0.2 (2024-02-01)
- Enhancement: Added player option for playerTimeLocale
## v1.0.1 (2024-01-23)
- Bug Fix: clicking the upload button more than once would result in multiple success checkmarks
## v1.0.0 (2024-01-21)
- Initial commit with live stream audio player, recorder, station info, and visualizer

