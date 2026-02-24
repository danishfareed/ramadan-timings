import { useState, useEffect } from 'react';
import {
  getDayFastingTimes,
  getDayPrayerTimes,
  getRamadanFastingTimes,
  formatLocalTime
} from '@danishfareed/ramadan-timings';
import type { HighLatitudeMode } from '@danishfareed/ramadan-timings';

function CodeSnippet({ title, code }: { title: string, code: string }) {
  return (
    <div className="code-section">
      <div className="code-header">
        <span>{title}</span>
        <span>TypeScript</span>
      </div>
      <pre><code>{code}</code></pre>
    </div>
  );
}

function HeroSection() {
  const [location, setLocation] = useState<{ lat: number; lng: number; offset: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocation({ lat: 21.4225, lng: 39.8262, offset: 180 });
  }, []);

  const handleGetLocation = () => {
    setLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          offset: -new Date().getTimezoneOffset()
        });
        setLoading(false);
      },
      (err) => {
        setError(err.message || 'Unable to retrieve your location');
        setLoading(false);
      }
    );
  };

  const times = location ? getDayFastingTimes(new Date(), {
    latitude: location.lat,
    longitude: location.lng,
    timezoneOffsetMinutes: location.offset,
    imsakMarginMinutes: 10,
    fajrTwilightAngle: 18
  }) : null;

  return (
    <section className="feature-section hero-section">
      <header>
        <h1>Ramadan Timings</h1>
        <p className="subtitle">
          Highly accurate, zero-dependency solar calculator for daily fasting and prayer windows, built entirely in TypeScript.
        </p>
        <div className="npm-badge">npm i @danishfareed/ramadan-timings</div>
      </header>

      <div className="controls max-w">
        <button onClick={handleGetLocation} disabled={loading}>
          {loading ? <span>Locating...</span> : '📍 Use My Location'}
        </button>
        {location && (
          <div className="location-info">
            {location.lat.toFixed(4)}°, {location.lng.toFixed(4)}° (UTC{location.offset >= 0 ? '+' : ''}{location.offset / 60})
          </div>
        )}
      </div>

      {error && <div className="error max-w">{error}</div>}

      {times ? (
        <div className="grid">
          <div className="card">
            <div className="card-title">Imsak</div>
            <div className="card-time">{formatLocalTime(times.imsak, location!.offset)}</div>
            <div className="card-sub">-10 min margin</div>
          </div>
          <div className="card highlight">
            <div className="card-title">Fajr</div>
            <div className="card-time">{formatLocalTime(times.fajr, location!.offset)}</div>
            <div className="card-sub">Start Fasting</div>
          </div>
          <div className="card">
            <div className="card-title">Sunrise</div>
            <div className="card-time">{formatLocalTime(times.sunrise, location!.offset)}</div>
            <div className="card-sub">End of Fajr</div>
          </div>
          <div className="card">
            <div className="card-title">Dhuhr</div>
            <div className="card-time">{formatLocalTime(times.solarNoon, location!.offset)}</div>
          </div>
          <div className="card highlight">
            <div className="card-title">Maghrib</div>
            <div className="card-time">{formatLocalTime(times.maghrib, location!.offset)}</div>
            <div className="card-sub">Break Fast</div>
          </div>
        </div>
      ) : (
        location && <div className="error max-w">Times cannot be computed for this extreme latitude today (try High Latitude mode).</div>
      )}

      <CodeSnippet
        title="Live Fasting Utility"
        code={`import { getDayFastingTimes, formatLocalTime } from '@danishfareed/ramadan-timings';

const times = getDayFastingTimes(new Date(), {
  latitude: ${location?.lat?.toFixed(4) || '21.4225'},
  longitude: ${location?.lng?.toFixed(4) || '39.8262'},
  timezoneOffsetMinutes: ${location?.offset || 180},
  imsakMarginMinutes: 10,
  fajrTwilightAngle: 18
});

console.log('Fajr:', formatLocalTime(times.fajr, ${location?.offset || 180}));`}
      />
    </section>
  );
}

function RamadanCalendarSection() {
  const [year] = useState(new Date().getFullYear());
  // Arbitrary approx 30 days for demo purposes
  const startDate = new Date(year, 2, 1);
  const endDate = new Date(year, 2, 30);

  const monthTimes = getRamadanFastingTimes(startDate, endDate, {
    latitude: 51.5074, // London
    longitude: -0.1278,
    timezoneOffsetMinutes: 0
  });

  return (
    <section className="feature-section split-layout">
      <div className="feature-text">
        <h2>1. Generate a Full Month Calendar</h2>
        <p>Perfect for mosque websites or PDF generators. Use <code>getRamadanFastingTimes</code> to calculate an entire range of dates in a single call.</p>
        <p className="detailText">Example: London (51.5074, -0.1278)</p>
        <CodeSnippet
          title="Monthly Generator"
          code={`const monthTimes = getRamadanFastingTimes(
  new Date(2025, 2, 1),
  new Date(2025, 2, 30),
  {
    latitude: 51.5074,
    longitude: -0.1278,
    timezoneOffsetMinutes: 0,
    imsakMarginMinutes: 10
  }
);

// Returns an array of FastingTimes objects`}
        />
      </div>
      <div className="feature-demo table-container">
        <table className="calendar-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Imsak</th>
              <th>Fajr</th>
              <th>Maghrib</th>
            </tr>
          </thead>
          <tbody>
            {monthTimes.map((t, i) => t ? (
              <tr key={i}>
                <td>{t.date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}</td>
                <td>{formatLocalTime(t.imsak, 0)}</td>
                <td className="text-primary">{formatLocalTime(t.fajr, 0)}</td>
                <td className="text-primary">{formatLocalTime(t.maghrib, 0)}</td>
              </tr>
            ) : null).slice(0, 8)}
            <tr>
              <td colSpan={4} className="text-center italic">... 22 more days generated</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PrayerTimesSection() {
  const times = getDayPrayerTimes(new Date(), {
    latitude: 41.0082, // Istanbul
    longitude: 28.9784,
    timezoneOffsetMinutes: 180
  });

  return (
    <section className="feature-section split-layout reverse">
      <div className="feature-text">
        <h2>2. Build a Core Prayer Widget</h2>
        <p>If you don't need fasting-specific fields like `imsak` or `fastingDurationMinutes`, use <code>getDayPrayerTimes</code> for a lighter payload tailored for standard Islamic prayer apps.</p>
        <p className="detailText">Example: Istanbul (41.0082, 28.9784)</p>
        <CodeSnippet
          title="Prayer Times API"
          code={`const prayers = getDayPrayerTimes(new Date(), {
  latitude: 41.0082,
  longitude: 28.9784,
  timezoneOffsetMinutes: 180,
  fajrTwilightAngle: 18
});

console.log(prayers.dhuhr);`}
        />
      </div>
      <div className="feature-demo">
        <div className="widget-card">
          <div className="widget-header">Istanbul Prayers Today</div>
          <div className="widget-row"><span>Fajr</span> <b>{times ? formatLocalTime(times.fajr, 180) : '--:--'}</b></div>
          <div className="widget-row"><span>Sunrise</span> <b>{times ? formatLocalTime(times.sunrise, 180) : '--:--'}</b></div>
          <div className="widget-row highlight-row"><span>Dhuhr</span> <b>{times ? formatLocalTime(times.dhuhr, 180) : '--:--'}</b></div>
          <div className="widget-row"><span>Maghrib</span> <b>{times ? formatLocalTime(times.maghrib, 180) : '--:--'}</b></div>
        </div>
      </div>
    </section>
  );
}

function HighLatitudeSection() {
  const [mode, setMode] = useState<HighLatitudeMode>('middle-of-night');

  // Summer in Tromso where sun doesn't set past 18 deg
  const summerDate = new Date(2025, 6, 1);
  const config = {
    latitude: 69.6492, // Tromsø, Norway
    longitude: 18.9553,
    timezoneOffsetMinutes: 120, // UTC+2 summer
    highLatitudeMode: mode
  };

  const times = getDayFastingTimes(summerDate, config);

  return (
    <section className="feature-section split-layout">
      <div className="feature-text">
        <h2>3. Handle Extreme Northern Cities</h2>
        <p>In places like Tromsø during summer, the sun never dips 18° below the horizon, causing standard astronomy algorithms to fail. Enable a <code>highLatitudeMode</code> fallback to safely compute alternative Sharia-compliant times.</p>

        <div className="toggle-group">
          {(['none', 'middle-of-night', 'one-seventh', 'angle-based'] as HighLatitudeMode[]).map(m => (
            <button key={m} className={mode === m ? 'active' : 'outline'} onClick={() => setMode(m)}>
              {m}
            </button>
          ))}
        </div>

        <CodeSnippet
          title="High Latitude Fallbacks"
          code={`const times = getDayFastingTimes(new Date(2025, 6, 1), {
  latitude: 69.6492, // Tromsø (Summer)
  longitude: 18.9553,
  timezoneOffsetMinutes: 120,
  highLatitudeMode: '${mode}'
});

// Returns ${times ? 'valid Date objects via fallback calculation' : 'null (standard calculation impossible)'}`}
        />
      </div>

      <div className="feature-demo flex-center">
        {times ? (
          <div className="card fallback-card">
            <div className="badge">Fallback Active</div>
            <div className="card-title">Tromsø Fajr</div>
            <div className="card-time">{formatLocalTime(times.fajr, 120)}</div>
            <div className="card-sub">Computed via {mode}</div>
          </div>
        ) : (
          <div className="card error-card">
            <div className="card-title">Calculation Failed</div>
            <div className="card-sub mt">In 'none' mode, returning null because the sun never reaches 18° depression.</div>
          </div>
        )}
      </div>
    </section>
  );
}

function App() {
  return (
    <div className="container">
      <HeroSection />

      <div className="divider"></div>

      <RamadanCalendarSection />
      <PrayerTimesSection />
      <HighLatitudeSection />

      <footer>
        <p>Built to showcase <a href="https://github.com/danishfareed/ramadan-timings" target="_blank" rel="noreferrer">@danishfareed/ramadan-timings</a>.</p>
        <p className="mt">Zero dependencies. 100% TypeScript. Fully documented.</p>
      </footer>
    </div>
  );
}

export default App;
