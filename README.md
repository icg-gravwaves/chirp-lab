# Chirp Lab

A browser-based outreach game: reproduce a rising gravitational-wave-style chirp with your voice, then find it through increasing simulated noise and signal consistency checks.

## Run

Serve `dist/` with any static web server, or run `npm start` and open http://localhost:8765. Deployment requires HTTPS for microphone access. The app has no JavaScript dependencies; optional web fonts come from Google Fonts. Run tests with `npm test` (Node.js 20 or later).

## Play

Select **Start** and allow the microphone. The reference chirp plays first; then stay quiet during the three-second countdown, then hum or whistle a low-to-high sweep for 1.5 seconds. The first countdown second measures the room noise. The microphone turns off after each attempt; press the button again to retry. You can cancel during the countdown or recording. The reference chirp also lasts 1.5 seconds.

Five levels introduce simulated noise, an envelope consistency check, and a sine-Gaussian veto analogy. Select a low, standard, or whistle register in **Inside the detector**. Progress is stored locally in the browser.

## Scientific scope

This is an educational simulation, not a gravitational-wave detection pipeline. The target is an accelerating frequency sweep rather than a physical binary waveform. Noise is mixed numerically into the analysis, not played aloud.

- **Chirp match** compares spectral peaks with the expected rising frequency at relative times within the detected attempt. It is not matched-filter SNR.
- **chisquared** compares chirp-ridge energy in six equal-expected-power time regions. Its noise scale and threshold are heuristic. It is not the Allen frequency-bin chi-squared test or a calibrated reduced chi-squared statistic.
- **chisquared_sgveto** uses Gaussian-windowed sine/cosine projections above the final target frequency, normalised by microphone background power. This illustrates a sine-Gaussian veto; it is not PyCBC's implementation or a calibrated statistic. Vocal harmonics may trigger it.

See the [PyCBC veto documentation](https://pycbc.org/pycbc/latest/html/pycbc.vetoes.html) for scientific implementations. Gameplay thresholds need audience and microphone testing.

## Privacy and compatibility

Microphone samples are processed in browser memory, with no audio upload or recording persistence. Only level progress is written to local storage. Close the page or press **Cancel recording** to stop the microphone. Browser permission and a user gesture are required before listening begins.

Capture uses Web Audio's ScriptProcessorNode for compatibility. This API is deprecated; browsers that remove it require an AudioWorklet implementation. Background tabs may throttle capture.

## Source and branding

`dist/app.js` controls the experience, `dist/dsp.js` calculates scores. Tests exercise noise, silence, inconsistent envelopes, glitches, and the sound segmentation helper.

The logo pairs an open orbit with a waveform increasing in amplitude and frequency. `dist/assets/chirp-lab.svg` is the transparent mark; `dist/assets/chirp-lab-mark.svg` is the dark tile and favicon. Colours: lime `#d6f489`, dark teal `#10191d`, cyan `#72d4d2`.

## GitHub Pages

The Pages workflow tests the application and deploys `dist/` on every push to `main`. In repository **Settings → Pages**, the build source must be **GitHub Actions**. Workflow permissions grant Pages deployment access only to the deployment job. Assets use relative URLs for project-site hosting.

University of Portsmouth and PyCBC logos link to their respective websites. The original assets are from [Portsmouth's official site](https://www.port.ac.uk/themes/custom/portsmouth/logo.svg) and the [PyCBC logo repository](https://github.com/gwastro/pycbc-logo). A thin white outline is applied at display time to improve contrast on the dark background.
