# ForgeFit Watch App — Sensor Setup

Technical reference for pedometer and heart rate integration in the Wear OS watch view.

---

## Architecture

The watch view activates when `?watch=1` is in the URL or screen width ≤ 320px.  
URL: `https://forgefit.rakshitr.co.in/app/?watch=1`

```
Watch View Features
├── Live clock (30s tick)
├── Stats grid: streak, water, steps, heart rate, BMI
├── Pedometer — DeviceMotion API (auto-starts)
├── Heart Rate — Web Bluetooth + motion fallback
├── Alarm checker
└── Quick-log buttons: workout, water
```

---

## Pedometer

### How It Works

Uses the **DeviceMotion API** (`window.DeviceMotionEvent`). Reads raw accelerometer
data at the device's native rate (typically 60Hz on Wear OS). Each sample computes
the acceleration magnitude:

```
magnitude = √(ax² + ay² + az²)
```

When the difference between consecutive magnitudes exceeds a threshold (`STEP_THRESHOLD = 12 m/s²`)
and at least 300ms has passed since the last counted step (`STEP_COOLDOWN`), a step is recorded.

Steps sync to the backend every 10 steps via `PATCH /api/logs/daily`.

### Platform Support

| Platform | Works? | Permission Required |
|---|---|---|
| Wear OS (Chrome browser) | ✅ Yes | None |
| Android Chrome (phone) | ✅ Yes | None |
| Wear OS (Capacitor APK) | ✅ Yes | `ACTIVITY_RECOGNITION` |
| iOS Safari 13+ | ✅ Yes | User gesture required (`DeviceMotionEvent.requestPermission()`) |
| Desktop Chrome | ❌ No | No accelerometer hardware |
| Firefox Android | ✅ Yes | None |

### Accuracy

- Works well for walking/running detection
- Can over/under count during non-walking movement (car travel, arm gestures)
- Not suitable for medical tracking — for fitness awareness only
- Typical accuracy: ±10-15% compared to dedicated hardware step counter

### Tuning Parameters

In `frontend/public/app/index.html`, find the watch section:

```javascript
const STEP_THRESHOLD = 12;  // m/s² — lower = more sensitive, higher = fewer false positives
const STEP_COOLDOWN = 300;  // ms — minimum time between steps (300ms = max 200 steps/min)
```

For a faster walker, lower `STEP_THRESHOLD` to 10.  
For fewer false positives, raise `STEP_THRESHOLD` to 14.

### Capacitor APK — Additional Setup

For the Capacitor APK (`capacitor-phone/` or `capacitor-watch/`), add to
`android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.ACTIVITY_RECOGNITION"/>
<uses-feature android:name="android.hardware.sensor.stepcounter"/>
<uses-feature android:name="android.hardware.sensor.stepdetector"/>
```

For direct hardware step counter access (more accurate than accelerometer math),
install the Capacitor Motion plugin:

```bash
npm install @capacitor/motion
npx cap sync android
```

Then replace the DeviceMotion listener with:

```javascript
import { Motion } from '@capacitor/motion';

// Request permission (Android 10+)
await Motion.requestPermissions();

// Listen to pedometer events directly
Motion.addListener('accel', event => {
  // event.acceleration.x, .y, .z
});
```

---

## Heart Rate

### Two Methods

**Method 1 — Web Bluetooth (accurate, requires BLE HR device)**

Connects to any Bluetooth Low Energy device broadcasting the standard
**GATT Heart Rate Service (UUID 0x180D)**, Heart Rate Measurement characteristic (UUID 0x2A37).

Compatible devices include:
- Polar H10, H9, OH1 chest straps
- Garmin HRM-Pro
- Mi Band 6/7/8 (with HR broadcasting enabled)
- Most Fitbit devices
- Generic BLE HR bands from Amazon
- Galaxy Watch 4/5/6 (in HR broadcast mode)

**Method 2 — Motion estimate (fallback, no extra hardware)**

When no Bluetooth HR device is found, estimates heart rate from wrist acceleration
rhythm using zero-crossing analysis over a 5-second rolling window.

```
estimated_bpm = (zero_crossings_in_5s / 2) × (60 / 5)
```

Accuracy: ±10–15 BPM. Works best when the watch is on the wrist and the user is
at rest or in a steady activity. Not suitable for clinical use.

### Bluetooth HR Setup Requirements

| Requirement | Detail |
|---|---|
| Browser | Chrome or Chromium only (not Safari, not Firefox) |
| Protocol | HTTPS required (Web Bluetooth blocked on HTTP) |
| Android version | 6.0+ (API 23+) |
| Device | Must be in pairing/advertising mode |
| Range | Typically 10m Bluetooth range |

### Enabling HR Broadcast on Galaxy Watch

If using Galaxy Watch as the HR source:

1. Samsung Health app → Settings → Measurement units
2. Or use the Galaxy Wearable app → Watch settings → Health → Heart rate

Note: Galaxy Watch 4/5/6 does not natively broadcast GATT HR service.
For direct watch HR in the Capacitor APK, use Samsung Health SDK (requires
Samsung developer account and Play Store distribution).

### Capacitor APK — Permissions

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<!-- Heart rate sensor (for hardware HR on watch) -->
<uses-permission android:name="android.permission.BODY_SENSORS"/>
<uses-feature android:name="android.hardware.sensor.heartrate"/>

<!-- Bluetooth LE (for external HR devices) -->
<uses-permission android:name="android.permission.BLUETOOTH" android:maxSdkVersion="30"/>
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" android:usesPermissionFlags="neverForLocation"/>
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT"/>
<uses-feature android:name="android.hardware.bluetooth_le" android:required="false"/>
```

For native HR sensor reading (built-in watch sensor), use the Health plugin:

```bash
npm install @capacitor-community/health
npx cap sync android
```

```javascript
import { Health } from '@capacitor-community/health';

await Health.requestAuthorization({
  read: ['heart_rate'],
  write: []
});

const results = await Health.query({
  startDate: new Date(Date.now() - 3600000),
  endDate: new Date(),
  dataType: 'heart_rate'
});

const latestHR = results.data[results.data.length - 1]?.value;
```

---

## Backend — Saving Sensor Data

Both pedometer and heart rate data syncs to the backend:

**Steps** — saved via `PATCH /api/logs/daily`:
```javascript
apiFetch('/logs/daily', {
  method: 'PATCH',
  body: JSON.stringify({ steps: watchStepCount })
});
```

**Heart rate** — saved as a note in `POST /api/logs/metric`:
```javascript
apiFetch('/logs/metric', {
  method: 'POST',
  body: JSON.stringify({ notes: `HR: ${bpm} bpm` })
});
```

To add a dedicated heart rate column to the database, run this SQL:

```sql
ALTER TABLE metric_logs ADD COLUMN IF NOT EXISTS heart_rate_bpm INTEGER;
```

Then update the API route `backend/src/routes/logs.js` to accept `heart_rate_bpm`
as an optional field in the POST body.

---

## Watch APK — Complete Checklist

```
1. Build APK using WebIntoApp or GoNative
   URL: https://forgefit.rakshitr.co.in/app/?watch=1
   Package: co.rakshitr.forgefit.watch

2. OR use Capacitor (capacitor-watch/ in the ZIP):
   cd capacitor-watch
   npm install
   npx cap add android
   cp AndroidManifest.wear.xml android/app/src/main/AndroidManifest.xml
   npx cap open android
   Build → Generate Signed APK

3. Install via WiFi ADB:
   Watch: Settings → Developer Options → Debug over WiFi → ON → note IP
   Computer: adb connect WATCH_IP:5555
             adb -s WATCH_IP:5555 install forgefit-watch.apk

4. After install:
   - App appears in watch app drawer
   - Opens watch view automatically (no ?watch=1 needed in APK — config URL has it)
   - Pedometer auto-starts
   - Tap MEASURE HR to start heart rate
```
