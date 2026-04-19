# Observer Engine Design

**Date:** 2026-04-18
**Status:** Proposed
**Location:** wildvine-os workspace (`crates/`)
**Products served:** Proactiva (workflow diagnostics), Performia (real-time instrument teaching)

---

## 1. Problem

Proactiva needs to observe how people actually use their computers to diagnose operational waste. Performia needs to observe a musician in real time and provide immediate feedback on pitch, dynamics, and technique. Both need screen, camera, and audio capture — but with fundamentally different latency requirements.

No existing wildvine-os crate handles media capture. The coordinator already delegates to local and cloud models. The observer engine provides the missing input layer.

## 2. Architecture Overview

Four new crates in the wildvine-os workspace. Two handle raw capture (audio and vision, separated because their timing domains are incompatible). One orchestrates capture streams, analysis, and feedback. One provides real-time DSP for the audio fast path.

```
vine-core/            # Existing. Add: CaptureBackend trait, shared observer types.
vine-capture-audio/   # NEW. CoreAudio HAL capture via coreaudio-rs.
vine-capture-vision/  # NEW. ScreenCaptureKit + AVFoundation via objc2.
vine-dsp/             # NEW. Real-time audio DSP (pitch, dynamics, onset).
vine-observer/        # NEW. Orchestrator: combines streams, routes to coordinator.
```

### Data flow

```
                         +-----------+
                         | vine-core |  (types, traits)
                         +-----+-----+
                               |
              +----------------+----------------+
              |                                 |
    +---------v----------+          +-----------v-----------+
    | vine-capture-audio |          | vine-capture-vision   |
    | (coreaudio-rs)     |          | (objc2-screencapture)  |
    | HAL callback       |          | ScreenCaptureKit       |
    | -> SPSC ring buf   |          | AVFoundation camera    |
    +----+----------+----+          +-----------+-----------+
         |          |                           |
         |    +-----v------+                    |
         |    | vine-dsp   |                    |
         |    | (real-time) |                    |
         |    | pitch/onset |                    |
         |    +-----+------+                    |
         |          |                           |
         |   Tier 1 feedback (< 3ms)            |
         |          |                           |
    +----v----------v---------------------------v----+
    |              vine-observer                     |
    |  - Frame scheduling (diagnostic/realtime)      |
    |  - Audio feature extraction (Tier 2)           |
    |  - Privacy layer (PII redaction)               |
    |  - Routes to vine-coordinator for LLM analysis |
    |  - Failure recovery, backpressure              |
    |  - Observability (metrics, health)             |
    +------------------------+-----------------------+
                             |
                    +--------v---------+
                    | vine-coordinator |  (existing)
                    | Gemma 4 / Claude |
                    +--------+---------+
                             |
                  +----------v-----------+
                  | vine-gateway         |  (existing)
                  | API endpoints        |
                  | -> Proactiva dashboard|
                  | -> Performia UI      |
                  +----------------------+
```

### Two-tier feedback model

| Tier | Latency | Method | Use |
|------|---------|--------|-----|
| Tier 1 | 1-3 ms | Pure DSP in vine-dsp | Pitch detection, tuning, dynamics, onset, tempo. No LLM. |
| Tier 2 | 1-3 sec | LLM via vine-coordinator | Musical coaching, workflow muddle analysis, technique advice. |

Tier 1 exists only for Performia's real-time audio path. Proactiva operates entirely at Tier 2.

---

## 3. vine-capture-audio

### Purpose

Capture audio from CoreAudio HAL devices (PreSonus Quantum 2626 and others). Provide a lock-free, real-time-safe interface for consumers.

### Dependencies

- `coreaudio-rs` / `coreaudio-sys` for CoreAudio HAL bindings (proven, stable).
- `rtrb` for lock-free SPSC ring buffer (designed for real-time audio in Rust).

NOT `objc2-core-audio`. The CoreAudio HAL is a C API. `coreaudio-rs` wraps it correctly.

### Key types

```rust
/// Configuration for an audio capture session.
pub struct AudioCaptureConfig {
    pub device_uid: String,       // CoreAudio device UID
    pub sample_rate: u32,         // e.g. 96000
    pub buffer_size: u32,         // e.g. 32-64 samples
    pub channels: Vec<u16>,       // which hardware inputs to capture
}

/// Handle to a running audio capture session.
pub struct AudioCapture {
    consumer: rtrb::Consumer<f32>,  // read side of ring buffer
    config: AudioCaptureConfig,
    // internal: HAL IOProc handle, device ID
}

impl AudioCapture {
    pub fn start(config: AudioCaptureConfig) -> Result<Self, CaptureError>;
    pub fn stop(&mut self) -> Result<(), CaptureError>;
    pub fn consumer(&self) -> &rtrb::Consumer<f32>;
    pub fn sample_rate(&self) -> u32;
    pub fn channels(&self) -> &[u16];
}
```

### CoreAudio HAL callback rules

The IOProc callback runs on a real-time thread. The following are absolute constraints:

**MUST NOT** do in the callback:
- Allocate or free memory (no `Vec::push`, `Box::new`, `String::from`)
- Take any lock (`Mutex`, `RwLock`, `println!`)
- Perform I/O (file, network, logging)
- Call Objective-C methods (autorelease pool allocations)
- Touch tokio or any async runtime
- Signal a condition variable

**CAN** do:
- Copy samples into the pre-allocated `rtrb` ring buffer
- Update atomic counters/flags
- Arithmetic on sample data

The callback writes interleaved `f32` samples directly into the `rtrb::Producer`. If the buffer is full, newest samples overwrite oldest (producer never blocks). An `AtomicBool` overflow flag is set so the consumer can detect data loss.

### Ring buffer sizing

At 96kHz mono f32: 384 KB/sec. A 4-second buffer = 1.5 MB. This absorbs worst-case consumer stalls (model inference taking 2-3 seconds). For multi-channel (e.g., stereo): double accordingly. Use `mlock` on buffer pages to prevent swap-induced page faults.

### Device lifecycle

- Enumerate devices via `AudioObjectGetPropertyData` with `kAudioHardwarePropertyDevices`.
- Listen for `kAudioDevicePropertyDeviceIsAlive` and `kAudioHardwarePropertyDevices` property changes.
- On disconnect: stop IOProc, notify vine-observer, attempt reconnection with exponential backoff.
- On sleep/wake: re-validate device, re-check sample rate (may reset to default).

---

## 4. vine-dsp

### Purpose

Real-time audio analysis that runs at Tier 1 latency (sub-3ms). No LLM, no network, no allocation. Pure signal processing.

### Capabilities

| Analysis | Algorithm | Window size | Latency |
|----------|-----------|-------------|---------|
| Pitch detection | YIN autocorrelation | 128-256 samples (1.3-2.7ms at 96kHz) | < 1ms compute |
| Onset detection | Spectral flux | 256 samples | < 0.5ms compute |
| Dynamics (RMS/peak) | RMS over window | 32-64 samples | < 0.1ms compute |
| Tempo/beat tracking | Onset accumulator | Multi-frame | < 0.5ms compute |
| Tuning (cents deviation) | Derived from pitch | Same as pitch | Included in pitch |

### Interface

```rust
/// Real-time DSP processor. Reads from ring buffer, writes to atomic state.
pub struct DspPipeline {
    config: DspConfig,
}

/// Current analysis state, updated atomically.
/// Read lock-free by UI/feedback threads.
pub struct DspState {
    pub pitch_hz: AtomicF32,
    pub pitch_note: AtomicU8,       // MIDI note number
    pub pitch_cents: AtomicI8,      // deviation from equal temperament
    pub rms_db: AtomicF32,
    pub onset_detected: AtomicBool,
    pub tempo_bpm: AtomicF32,
    pub updated_at: AtomicU64,      // timestamp (ns)
}

pub struct DspConfig {
    pub sample_rate: u32,
    pub pitch_window: usize,    // 128-256
    pub enabled: DspFeatures,   // bitflags: PITCH | DYNAMICS | ONSET | TEMPO
}
```

The DSP pipeline runs on a dedicated high-priority thread, pinned to a performance core. It reads from the same `rtrb` ring buffer as the Tier 2 consumer (via fan-out: two consumers reading independently, or a second ring buffer fed from the first on the consumer side).

### Fan-out strategy

The HAL callback writes to one primary ring buffer. A fan-out thread (normal priority) reads from it and writes to two secondary ring buffers:
1. DSP ring buffer (small, 256 samples, read by vine-dsp at callback rate)
2. Analysis ring buffer (large, 4 seconds, read by vine-observer for Tier 2 LLM)

This avoids multiple consumers on a single SPSC buffer (which would require SPMC or unsafe tricks).

---

## 5. vine-capture-vision

### Purpose

Capture screen frames and camera frames on macOS. Deliver JPEG-encoded images to vine-observer.

### Dependencies

- `objc2-screen-capture-kit` for ScreenCaptureKit (macOS 12.3+).
- `objc2-avfoundation` for camera capture.
- `turbojpeg` or macOS `ImageIO` via `core-graphics` for JPEG encoding.

### Key types

```rust
pub enum VisionSource {
    Screen { display_id: u32 },
    Camera { device_uid: String },
}

pub enum FrameCadence {
    /// Performia: continuous capture for visual feedback
    Realtime { fps: u8 },                      // 1-5 fps
    /// Proactiva: periodic + event-driven
    Diagnostic { interval_secs: u32, on_app_switch: bool },
}

pub struct VisionCaptureConfig {
    pub source: VisionSource,
    pub cadence: FrameCadence,
    pub max_dimension: u32,     // downscale longest edge to this (default 864)
    pub jpeg_quality: u8,       // 60-80
}

pub struct CapturedFrame {
    pub source: VisionSource,
    pub timestamp: Instant,
    pub jpeg_data: Vec<u8>,
    pub resolution: (u32, u32),
}
```

### Resolution and encoding

Full retina capture is wasteful. LLM vision encoders resize internally to 224-768px. Downscaling before encoding saves CPU and bandwidth.

| Resolution | JPEG encode time | JPEG size (q80) | Recommended for |
|------------|-----------------|-----------------|-----------------|
| 3456x2234 (full retina) | 8-15ms | ~1.5 MB | Never |
| 1728x1117 (half) | 3-5ms | ~500 KB | High detail needed |
| 864x558 (quarter) | < 1ms | ~200 KB | Default. Text still legible. |

Default: `max_dimension: 864`. Use `turbojpeg` (libjpeg-turbo, NEON-optimized on ARM). Do NOT use the pure-Rust `image` crate encoder (2-4x slower).

### Scheduling

- `Realtime`: `tokio::interval` at configured fps.
- `Diagnostic`: `tokio::interval` at `interval_secs`, PLUS event trigger from macOS accessibility APIs (`AXObserver`) on active window change. On window change, capture immediately regardless of timer.

### Permissions

macOS requires user consent for screen recording (System Preferences > Privacy > Screen Recording). The crate must:
1. Check permission status via `CGPreflightScreenCaptureAccess()`.
2. If not granted, call `CGRequestScreenCaptureAccess()` (opens System Preferences).
3. Detect grant/revocation at runtime.
4. Surface clear error to vine-observer if denied (not crash, not silent failure).

Camera permission follows similar flow via `AVCaptureDevice.authorizationStatus`.

---

## 6. vine-observer

### Purpose

Orchestrator crate. Combines capture streams, manages analysis scheduling, enforces privacy, routes to vine-coordinator, handles failures, and exposes metrics.

### Responsibilities

1. **Session management** — Start/stop capture sessions with combined config.
2. **Tier 2 analysis scheduling** — Read audio features and vision frames, construct prompts, send to vine-coordinator.
3. **Privacy layer** — PII redaction on vision frames before any model call.
4. **Backpressure** — If the model is busy, drop incoming frames (don't queue unboundedly).
5. **Failure recovery** — Device disconnect, permission revocation, model OOM.
6. **Observability** — Latency histograms, dropout counters, buffer fill levels, inference timing.
7. **API surface** — Endpoints for vine-gateway so dashboards can read observations.

### Session config

```rust
pub struct ObserverSession {
    pub mode: ObserverMode,
    pub vision: Option<VisionCaptureConfig>,
    pub audio: Option<AudioCaptureConfig>,
    pub dsp: Option<DspConfig>,             // Tier 1 (Performia only)
    pub tier2: Tier2Config,
}

pub enum ObserverMode {
    /// Proactiva: periodic screenshots, workflow analysis, privacy-sensitive
    Diagnostic {
        engagement_id: String,
        privacy: PrivacyConfig,
    },
    /// Performia: real-time feedback, camera + audio, user's own device
    Realtime {
        session_id: String,
        feedback_channel: FeedbackSink,
    },
}

pub struct Tier2Config {
    pub model: ModelPreference,             // local_gemma | cloud_claude | auto
    pub vision_query_interval_secs: u32,    // min time between vision queries
    pub audio_analysis_interval_secs: u32,  // min time between audio analyses
    pub max_queued_queries: usize,          // backpressure limit (default 2)
}
```

### Tier 2 audio analysis pipeline

Raw audio never goes to the LLM. The pipeline extracts features and sends structured text:

```
Ring buffer (4s window)
  -> Feature extraction (every 2-4 seconds):
     - Pitch contour (series of note names + cents deviation)
     - Onset/note event list with timestamps
     - Dynamics envelope (RMS over time)
     - Tempo estimate
  -> Construct prompt:
     "The student played the following sequence over the last 4 seconds:
      Notes: A4(-12c) 450ms, B4(+3c) 320ms, C#5(-8c) 510ms
      Dynamics: mp -> mf -> f
      Tempo: ~92 BPM (target: 90 BPM)
      Assess intonation, rhythm accuracy, and dynamic control."
  -> vine-coordinator (Gemma 4 26B local, streaming response)
  -> Streamed text feedback -> Performia UI
```

### Tier 2 vision analysis pipeline

```
Captured JPEG frame
  -> Privacy filter (Proactiva mode only):
     - Detect and redact PII (names, emails, passwords, banking)
     - Blur non-work regions if configured
     - Drop frame entirely if sensitive content detected
  -> Construct prompt:
     Proactiva: "Describe what this employee is doing. Identify any
                 operational waste: unnecessary context switching,
                 manual data entry, duplicate work, meetings with
                 no artifacts being produced."
     Performia: "The student is practicing guitar. Assess their hand
                 position, posture, and any visible tension."
  -> vine-coordinator (Gemma local or Claude cloud)
  -> Response -> ActivityLog (Proactiva) or feedback UI (Performia)
```

### Backpressure

If the model is still processing query N when query N+1 is ready:
- **Drop the new query.** Do not queue it.
- Increment a `queries_dropped` counter.
- The next capture cycle will generate a fresh query with more recent data anyway.
- Exception: allow up to `max_queued_queries` (default 2) in the queue for burst tolerance.

### Failure recovery

| Failure | Detection | Recovery |
|---------|-----------|----------|
| Audio device disconnect | `kAudioDevicePropertyDeviceIsAlive` listener | Stop IOProc, notify UI, retry with backoff |
| Screen permission revoked | `SCStream` delegate error callback | Stop capture, surface error to UI, poll for re-grant |
| Camera claimed by other app | `AVCaptureSession` interruption notification | Pause camera, resume when available |
| Model OOM | vine-coordinator error response | Fall back to smaller model (E4B), or pause Tier 2 |
| macOS sleep/wake | `NSWorkspace` notification | Re-validate all devices, re-check sample rates |
| Display config change | `CGDisplayReconfigurationCallback` | Re-enumerate displays, restart screen capture |
| Ring buffer overflow | Atomic overflow flag | Log, increment counter, continue (data loss is acceptable) |

### Observability

Exposed via vine-gateway API and logged to ActivityLog:

- `observer.audio.callback_jitter_us` — histogram of HAL callback timing deviation
- `observer.audio.buffer_fill_pct` — ring buffer fill level
- `observer.audio.dropouts` — counter of ring buffer overflows
- `observer.vision.capture_latency_ms` — time to capture + encode a frame
- `observer.vision.frames_dropped` — frames skipped due to backpressure
- `observer.tier2.inference_latency_ms` — model round-trip time
- `observer.tier2.queries_dropped` — queries dropped due to backpressure
- `observer.dsp.pitch_latency_us` — Tier 1 pitch detection latency

---

## 7. Privacy Architecture (Proactiva mode)

This section applies only to Proactiva diagnostic mode, where screenshots of employee computers are captured. Performia captures the user's own camera/audio and does not have the same privacy constraints.

### Requirements

1. **On-device PII redaction before any model call.** Raw screenshots must never reach a cloud model. Local Gemma can see raw frames. Cloud models see only redacted frames or text summaries.
2. **Visible capture indicator.** When screen capture is active, a persistent on-screen indicator must be visible to the employee. No silent surveillance.
3. **Configurable exclusion regions.** Employees or IT admins can exclude specific apps or screen regions from capture.
4. **Audit log of all captures.** Every frame captured is logged (timestamp, hash, what was sent to model, redactions applied). Stored locally, available for review.
5. **Data retention policy.** Raw frames deleted after N days (configurable, default 7). Analysis summaries retained longer. Employee can request deletion.
6. **Consent record.** The system records that the employee acknowledged and consented to capture, with timestamp.

### Privacy config

```rust
pub struct PrivacyConfig {
    pub redact_pii: bool,                    // default true
    pub show_capture_indicator: bool,        // default true, should not be false
    pub excluded_apps: Vec<String>,          // e.g. ["1Password", "Messages"]
    pub excluded_regions: Vec<ScreenRegion>, // pixel regions to blur
    pub retention_days: u32,                 // default 7
    pub cloud_model_policy: CloudPolicy,     // never_raw | redacted_only | summaries_only
}

pub enum CloudPolicy {
    NeverRaw,       // only send to local model
    RedactedOnly,   // send redacted frames to cloud
    SummariesOnly,  // send text summaries only, never images
}
```

### Implementation notes

- PII detection: run a fast local pass (regex for emails, phone numbers, SSN patterns) plus Gemma E4B for visual PII (names on screen, login forms, banking UIs).
- Redaction: gaussian blur over detected regions before forwarding frame.
- This is a legal minefield. Each deployment jurisdiction needs legal review. GDPR in particular considers employee consent invalid due to power imbalance — "legitimate interest" with a DPIA is the likely lawful basis in EU contexts.

---

## 8. Platform Abstraction

macOS-only for now. But Proactiva's enterprise market is mostly Windows. Define traits now to keep platform code isolated.

```rust
/// Implemented per-platform. macOS is the only implementation today.
pub trait AudioBackend: Send + 'static {
    fn enumerate_devices(&self) -> Result<Vec<AudioDeviceInfo>, CaptureError>;
    fn start(&mut self, config: &AudioCaptureConfig) -> Result<rtrb::Consumer<f32>, CaptureError>;
    fn stop(&mut self) -> Result<(), CaptureError>;
}

pub trait VisionBackend: Send + 'static {
    fn check_permission(&self) -> PermissionStatus;
    fn request_permission(&self);
    fn start(&mut self, config: &VisionCaptureConfig, sink: FrameSink) -> Result<(), CaptureError>;
    fn stop(&mut self) -> Result<(), CaptureError>;
}
```

Future Windows implementation would use WASAPI (audio), DXGI Desktop Duplication (screen), and Media Foundation (camera). None share API surface with macOS, but the trait boundary means vine-observer and vine-dsp are unchanged.

---

## 9. Integration with Existing Crates

### vine-core

Add to existing crate:
- `CaptureBackend` traits (above)
- `CaptureError` error type
- Shared observer types (`ObserverMode`, `PrivacyConfig`)

### vine-coordinator

No changes needed. vine-observer calls it the same way vine-daemon already does — construct a prompt with optional image attachment, get a streaming response. The coordinator's model delegation handles routing to Gemma local vs Claude cloud.

### vine-gateway

Add API endpoints:
- `POST /api/observer/start` — start an observer session
- `POST /api/observer/stop` — stop session
- `GET /api/observer/status` — current session state, metrics
- `GET /api/observer/dsp` — current Tier 1 DSP state (pitch, dynamics)
- `GET /api/observer/activity` — recent Tier 2 analysis results
- `WS /ws/observer` — real-time stream of DSP state + Tier 2 feedback

### vine-daemon

Add observer as an optional subsystem started via CLI:
- `wildvine observe --mode diagnostic --engagement eng-001`
- `wildvine observe --mode realtime --audio-device "Quantum 2626"`

### ActivityLog

Tier 2 analysis results logged with:
- `Scope::Company("pacific-ridge")` for Proactiva
- `Scope::Session("performia-lesson-001")` for Performia

---

## 10. Model Strategy

| Model | Role | When used |
|-------|------|-----------|
| **Gemma 4 26B A4B** (local) | Primary analysis | All Tier 2 queries. Sees raw frames (local, no privacy risk). |
| **Gemma 4 E4B** (local) | Fallback / PII detection | When 26B is overloaded. Fast PII scan on frames. |
| **Claude** (cloud) | Deep analysis | End-of-day Proactiva muddle reports. Sees only redacted frames or text summaries per CloudPolicy. |
| **DSP** (no model) | Tier 1 real-time | Pitch, dynamics, onset. Sub-3ms. |

### Audio and the LLM

Raw audio is never sent to the LLM. Audio features are extracted and serialized as structured text:

```json
{
  "window_seconds": 4.0,
  "notes": [
    {"pitch": "A4", "cents": -12, "onset_ms": 0, "duration_ms": 450, "velocity": 0.7},
    {"pitch": "B4", "cents": 3, "onset_ms": 520, "duration_ms": 320, "velocity": 0.8}
  ],
  "dynamics_envelope": [0.5, 0.6, 0.75, 0.8],
  "tempo_bpm": 92,
  "target_tempo_bpm": 90
}
```

This is faster (text tokens vs audio tokens), produces better feedback (the model reasons about musical concepts, not waveforms), and works with any text LLM.

---

## 11. What This Design Does NOT Cover

These are noted for future work. Do not build them now.

- **Windows/Linux platform backends** — trait is defined, implementation deferred.
- **Backend API for Proactiva dashboard** — the dashboard currently uses mock data. Connecting it to vine-gateway's observer endpoints is a separate task.
- **Automated muddle classification** — the LLM produces free-text analysis. Mapping that to `MuddleCategory` types automatically is future work.
- **Multi-user / multi-engagement** — one observer session at a time for now.
- **Audio output for Performia** — the observer captures input only. Playing back metronome, accompaniment, or model-generated audio is a separate system.
- **Fine-tuning or training** — Gemma 4 is used as-is. If diagnostic quality is insufficient, fine-tuning on workflow observation data is a later consideration.

---

## 12. Implementation Order

1. **vine-capture-audio** — CoreAudio HAL capture with `coreaudio-rs` + `rtrb`. Test with Quantum 2626. Verify zero-allocation callback, measure jitter.
2. **vine-dsp** — YIN pitch detection, RMS dynamics, spectral flux onset. Test against known audio (tuner reference tones). Verify sub-3ms latency.
3. **vine-capture-vision** — ScreenCaptureKit screen capture. Permission flow. JPEG encoding at 864px. Test diagnostic cadence.
4. **vine-observer** — Wire capture crates to vine-coordinator. Tier 2 analysis pipeline. Backpressure. Basic failure recovery.
5. **Privacy layer** — PII redaction pipeline. Capture indicator. Audit logging.
6. **Gateway integration** — API endpoints. WebSocket stream. Connect Proactiva dashboard.
7. **Observability** — Metrics, health checks, latency histograms.

Steps 1-2 can proceed in parallel (audio capture + DSP). Step 3 is independent. Steps 4-7 are sequential.
