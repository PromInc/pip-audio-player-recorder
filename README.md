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

| Option Name | Required | Default Value | Description |
| ----------- | -------- | ------------- | ----------- |
| `audioId` | No | `pip-audio-player` | ID of the player `<audio>` element |
| `type` | No | `audio/mpeg` | Audio format |
| `preload` | No | `preload` | |
| `autoTrigger` | No | `false` | |
| `triggerLabel` | No | `'Start Audio'` | |
| `autoPlay` | No | `false` | |
| `playerTimeDisplay` | No | `false` | |
| `hideStop` | No | `false` | |
| `hideVolume` | No | `false` | |
| `hideMute` | No | `false` | |
| `allowReload` | No | `false` | |
| `showSeekBar` | No | `true` | |
| `skipAmountPadding` | No | `.5` | |
| `skipAmountBack` | No | `5` | |
| `skipAmountForward` | No | `5` | |
| `streamInfoUrl` | No | `false` | |
| `visualizerShow` | No | `false` | |
| `visualizerHeight` | No | `60` | |
| `enableRecorder` | No | `false` | |
| `recordedFileUploadUrl` | No | `false` | |
| `recordedFileExtension` | No | `false` | |
| `recorderNamingCallback` | No | `false` | |






## TODO's
- Example of PHP audio upload script
- Example of `recorderNamingCallback`
- Table of configuration options
