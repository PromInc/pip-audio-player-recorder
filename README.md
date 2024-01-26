# pip-audio-player-recorder
Audio Player &amp; Recorder (Live Stream)

- A web based Digital Audio Recorder (aka DAR or DVR) software
- Many configurable options to control the features
- Record subclips of the live stream
  - Download recorded subclips
  - Upload recorded subclips to a remote server

## Usage
- Load the CSS file in the `<head>` of the page
- Load the JS file in the `<head>` of the page
- Create an emptty HTML `<div>` with an uniqe `id`
- Define the configuration
- Load the player





```
<head>
  <link type="text/css" rel="stylesheet" href="css/pip-audio-player.css">
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
| `showSeekBar` | No | `true` | | 1.0.0 |
| `skipAmountPadding` | No | `.5` | | 1.0.0 |
| `skipAmountBack` | No | `5` | | 1.0.0 |
| `skipAmountForward` | No | `5` | | 1.0.0 |
| `streamInfoUrl` | No | `false` | | 1.0.0 |
| `visualizerShow` | No | `false` | | 1.0.0 |
| `visualizerHeight` | No | `60` | | 1.0.0 |
| `enableRecorder` | No | `false` | | 1.0.0 |
| `recordedFileUploadUrl` | No | `false` | | 1.0.0 |
| `recordedFileExtension` | No | `false` | | 1.0.0 |
| `recorderNamingCallback` | No | `false` | | 1.0.0 |






## TODO's
- Example of PHP audio upload script
- Example of `recorderNamingCallback`
- Table of configuration options



---
# Changelog
## v1.0.1 (2024-01-23)
- Bug Fix: clicking the upload button more than once would result in multiple success checkmarks
## v1.0.0 (2024-01-21)
- Initial commit with live stream audio player, recorder, station info, and visualizer

