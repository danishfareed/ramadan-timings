

export const ExamplesSection = () => {
  return (
    <div className="examples-section">
      <h2 className="mb-2">Comprehensive Feature Showcase</h2>
      <p className="subtitle mb-4">Here are 3 real-world production examples for every feature inside the zero-dependency library.</p>

      <div className="example-grid">
        {/* Feature 1 */}
        <div className="feature-block">
          <h3>1. Core: `getDayFastingTimes`</h3>
          <p>The standard function for daily calculations based on geographic coordinates.</p>

          <div className="example-cards">
            <div className="ex-card">
              <h4>Ex 1: Daily Dashboard App (Mecca)</h4>
              <pre><code>{`const times = getDayFastingTimes(new Date(), {
  latitude: 21.4225,
  longitude: 39.8262,
  timezoneOffsetMinutes: 180,
  imsakMarginMinutes: 10
});
// Generates today's full fasting schedule`}</code></pre>
            </div>
            <div className="ex-card">
              <h4>Ex 2: Smartwatch Integration (Dubai)</h4>
              <pre><code>{`// Lightweight payload for watch complication
const { fajr, maghrib } = getDayFastingTimes(date, {
  latitude: 25.2048,
  longitude: 55.2708,
  timezoneOffsetMinutes: 240
});
console.log(formatDuration(maghrib - fajr));`}</code></pre>
            </div>
            <div className="ex-card">
              <h4>Ex 3: Iftar Notification Service (New York)</h4>
              <pre><code>{`const times = getDayFastingTimes(date, config);
// Schedule cron job to send SMS 
scheduleSms('+123456', times.maghrib, 
  "Time to break your fast!"
);`}</code></pre>
            </div>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="feature-block">
          <h3>2. Range: `getRamadanFastingTimes`</h3>
          <p>Calculate an entire date range in a single, perfectly optimized call.</p>

          <div className="example-cards">
            <div className="ex-card">
              <h4>Ex 1: Mosque PDF Calendar Generator</h4>
              <pre><code>{`const monthData = getRamadanFastingTimes(
  new Date(2025, 2, 1), new Date(2025, 2, 30),
  mosqueConfig
);
generatePdfTable(monthData);`}</code></pre>
            </div>
            <div className="ex-card">
              <h4>Ex 2: "Full Month" App View</h4>
              <pre><code>{`// React component state
const [calendar, setCalendar] = useState([]);
useEffect(() => {
  setCalendar(getRamadanFastingTimes(
    start, end, userLocation
  ));
}, []);`}</code></pre>
            </div>
            <div className="ex-card">
              <h4>Ex 3: Corporate Timetable API</h4>
              <pre><code>{`app.get('/api/timetable/:month', (req, res) => {
  const data = getRamadanFastingTimes(start, end, config);
  res.json({ success: true, data });
});`}</code></pre>
            </div>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="feature-block">
          <h3>3. Core: `getDayPrayerTimes`</h3>
          <p>For standard prayer apps that don't need fasting metrics like `imsak` padding.</p>

          <div className="example-cards">
            <div className="ex-card">
              <h4>Ex 1: Minimalist Prayer UI</h4>
              <pre><code>{`const prayers = getDayPrayerTimes(date, config);
return (
  <Widget>
    <Row label="Fajr" time={prayers.fajr} />
    <Row label="Sunrise" time={prayers.sunrise} />
    <Row label="Dhuhr" time={prayers.dhuhr} />
    <Row label="Asr" time={prayers.asr} />
    <Row label="Maghrib" time={prayers.maghrib} />
    <Row label="Isha" time={prayers.isha} />
  </Widget>
)`}</code></pre>
            </div>
            <div className="ex-card">
              <h4>Ex 2: Adhan Clock Display</h4>
              <pre><code>{`const times = getDayPrayerTimes(now, currentCity);
if (now.getTime() >= times.maghrib.getTime()) {
  playAdhanAudio('maghrib');
}`}</code></pre>
            </div>
            <div className="ex-card">
              <h4>Ex 3: Travel Prayer Calculator</h4>
              <pre><code>{`// Recalculate based on GPS during roadtrip
navigator.geolocation.watchPosition(pos => {
  const times = getDayPrayerTimes(new Date(), {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
    timezoneOffsetMinutes: getLocalOffset()
  });
});`}</code></pre>
            </div>
          </div>
        </div>

        {/* Feature 4 */}
        <div className="feature-block">
          <h3>4. Safety: `highLatitudeMode`</h3>
          <p>Provide fallback Sharia-compliant algorithms for extreme northern latitudes where the sun doesn't fully set.</p>

          <div className="example-cards">
            <div className="ex-card">
              <h4>Ex 1: 'middle-of-night' (Oslo)</h4>
              <pre><code>{`// Splits the night exactly in half
const times = getDayFastingTimes(date, {
  ...config,
  highLatitudeMode: 'middle-of-night'
});`}</code></pre>
            </div>
            <div className="ex-card">
              <h4>Ex 2: 'one-seventh' (London Summer)</h4>
              <pre><code>{`// Fajr starts at the last 1/7th of the night
const times = getDayFastingTimes(date, {
  ...config,
  highLatitudeMode: 'one-seventh'
});`}</code></pre>
            </div>
            <div className="ex-card">
              <h4>Ex 3: 'angle-based' (Reykjavik)</h4>
              <pre><code>{`// Scales proportional to the 18deg twilight angle
const times = getDayFastingTimes(date, {
  ...config,
  highLatitudeMode: 'angle-based'
});`}</code></pre>
            </div>
          </div>
        </div>

        {/* Feature 5 */}
        <div className="feature-block">
          <h3>5. Extended: City Search (`getFastingTimesByCity`)</h3>
          <p>Uses the native `fetch` API and free Open-Meteo geocoding to automatically resolve names to coordinates.</p>

          <div className="example-cards">
            <div className="ex-card">
              <h4>Ex 1: Discord Bot Command</h4>
              <pre><code>{`client.on('message', async msg => {
  if (msg.startsWith('/ramadan ')) {
    const city = msg.split(' ')[1];
    const { times } = await getFastingTimesByCity(city);
    msg.reply(\`Fajr in \${city} is \${times.fajr}\`);
  }
});`}</code></pre>
            </div>
            <div className="ex-card">
              <h4>Ex 2: User Onboarding Flow</h4>
              <pre><code>{`// React submit handler
const handleCitySubmit = async (city) => {
  const { locationName, times } = await getFastingTimesByCity(city);
  saveUserPref(locationName);
  setTodayTimes(times);
};`}</code></pre>
            </div>
            <div className="ex-card">
              <h4>Ex 3: Travel Itinerary Planner</h4>
              <pre><code>{`const itinerary = ['Paris', 'Rome', 'Cairo'];
for (const city of itinerary) {
  const data = await getFastingTimesByCity(city, travelDate);
  pdf.addPage(city, data.times);
}`}</code></pre>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
