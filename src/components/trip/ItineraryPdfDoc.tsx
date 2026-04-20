"use client";

/**
 * @react-pdf/renderer document describing the full itinerary PDF.
 *
 * Client-side generation: no server route, no headless Chrome, no
 * per-export cost. Layout mirrors the on-screen trip page so users
 * get a familiar document they can print or email. Every day is
 * fully expanded (not summarised) — the PDF is the archival copy
 * of the trip, so users can keep it offline.
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type { Itinerary, DayPlan, Hotel, Activity } from "@/types/itinerary";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1F2933",
    lineHeight: 1.4,
  },
  hero: {
    width: "100%",
    height: 180,
    marginBottom: 14,
    borderRadius: 6,
    objectFit: "cover",
  },
  title: {
    fontSize: 24,
    fontFamily: "Times-Roman",
    marginBottom: 4,
    color: "#C35A30",
  },
  subtitle: {
    fontSize: 11,
    color: "#555",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Times-Roman",
    marginTop: 12,
    marginBottom: 6,
    color: "#1F2933",
    borderBottomWidth: 0.5,
    borderBottomColor: "#DDD",
    paddingBottom: 3,
  },
  row: { flexDirection: "row", marginBottom: 2 },
  label: { width: 80, color: "#888" },
  value: { flex: 1 },
  dayHeader: {
    marginTop: 14,
    marginBottom: 4,
    fontFamily: "Times-Roman",
    fontSize: 14,
    color: "#C35A30",
  },
  dayMeta: { fontSize: 9, color: "#888", marginBottom: 6 },
  blockLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginTop: 6,
    marginBottom: 2,
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  activity: { marginBottom: 3, paddingLeft: 8 },
  activityName: { fontFamily: "Helvetica-Bold", color: "#1F2933" },
  activityDesc: { color: "#555", fontSize: 9 },
  tipBox: {
    marginTop: 8,
    padding: 6,
    backgroundColor: "#F6F1E6",
    borderLeftWidth: 2,
    borderLeftColor: "#C35A30",
    fontSize: 9,
    fontStyle: "italic",
    color: "#555",
  },
  hotelCard: {
    marginBottom: 6,
    padding: 6,
    border: "0.5pt solid #DDD",
    borderRadius: 3,
  },
  hotelName: { fontFamily: "Helvetica-Bold" },
  hotelMeta: { fontSize: 9, color: "#555", marginTop: 2 },
  tierBadge: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#C35A30",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  tip: {
    fontSize: 9,
    color: "#555",
    marginBottom: 3,
    paddingLeft: 8,
  },
  footer: {
    marginTop: 24,
    fontSize: 8,
    color: "#AAA",
    textAlign: "center",
  },
});

function ActivityLine({ activity }: { activity: Activity }) {
  return (
    <View style={styles.activity}>
      <Text>
        <Text style={{ color: "#888" }}>{activity.time}  </Text>
        <Text style={styles.activityName}>{activity.name}</Text>
        {activity.duration ? (
          <Text style={{ color: "#888" }}> · {activity.duration}</Text>
        ) : null}
      </Text>
      {activity.description ? (
        <Text style={styles.activityDesc}>{activity.description}</Text>
      ) : null}
    </View>
  );
}

function DayBlock({
  day,
  cityLabel,
}: {
  day: DayPlan;
  cityLabel: { city: string; country: string } | null;
}) {
  return (
    <View wrap={false}>
      <Text style={styles.dayHeader}>
        Day {day.dayNumber}
        {day.title ? ` — ${day.title}` : ""}
      </Text>
      <Text style={styles.dayMeta}>
        {day.date}
        {cityLabel ? `  ·  ${cityLabel.city}, ${cityLabel.country}` : ""}
      </Text>
      {day.morning.length > 0 && (
        <>
          <Text style={styles.blockLabel}>Morning</Text>
          {day.morning.map((a, i) => (
            <ActivityLine key={i} activity={a} />
          ))}
        </>
      )}
      {day.afternoon.length > 0 && (
        <>
          <Text style={styles.blockLabel}>Afternoon</Text>
          {day.afternoon.map((a, i) => (
            <ActivityLine key={i} activity={a} />
          ))}
        </>
      )}
      {day.evening.length > 0 && (
        <>
          <Text style={styles.blockLabel}>Evening</Text>
          {day.evening.map((a, i) => (
            <ActivityLine key={i} activity={a} />
          ))}
        </>
      )}
      {day.tip && <Text style={styles.tipBox}>Tip: {day.tip}</Text>}
    </View>
  );
}

function HotelEntry({ hotel }: { hotel: Hotel }) {
  return (
    <View style={styles.hotelCard}>
      {hotel.tier && (
        <Text style={styles.tierBadge}>{hotel.tier}</Text>
      )}
      <Text style={styles.hotelName}>{hotel.name}</Text>
      <Text style={styles.hotelMeta}>
        {hotel.pricePerNight} / night  ·  {hotel.rating.toFixed(1)}★
      </Text>
    </View>
  );
}

function cityForDay(
  itinerary: Itinerary,
  dayNumber: number
): { city: string; country: string } | null {
  if (!itinerary.cityPlan) return null;
  for (const c of itinerary.cityPlan) {
    if (dayNumber >= c.startDay && dayNumber <= c.endDay) {
      return { city: c.city, country: c.country };
    }
  }
  return null;
}

export function ItineraryPdfDoc({ itinerary }: { itinerary: Itinerary }) {
  const hotelsByCity = itinerary.hotelsByCity ?? null;

  return (
    <Document title={`Trip to ${itinerary.destination}`}>
      <Page size="A4" style={styles.page}>
        {itinerary.heroImage ? (
          // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt prop
          <Image src={itinerary.heroImage} style={styles.hero} />
        ) : null}
        <Text style={styles.title}>{itinerary.destination}</Text>
        <Text style={styles.subtitle}>
          {itinerary.startDate} → {itinerary.endDate} · {itinerary.travelers}{" "}
          traveler{itinerary.travelers > 1 ? "s" : ""} ·{" "}
          {itinerary.travelStyle}
        </Text>

        {itinerary.flights && itinerary.flights.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Flights</Text>
            {itinerary.flights.map((f, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.label}>{f.airline}</Text>
                <Text style={styles.value}>
                  {f.originAirport ?? "—"} → {f.destinationAirport ?? "—"} ·{" "}
                  {f.price} · {f.stops === 0 ? "direct" : `${f.stops} stop(s)`}
                </Text>
              </View>
            ))}
          </>
        )}

        <Text style={styles.sectionTitle}>Hotels</Text>
        {hotelsByCity && Object.keys(hotelsByCity).length > 0 ? (
          Object.entries(hotelsByCity).map(([city, list]) => (
            <View key={city} style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 3 }}>
                {city}
              </Text>
              {list.map((h, i) => (
                <HotelEntry key={`${city}-${i}`} hotel={h} />
              ))}
            </View>
          ))
        ) : (
          itinerary.hotels.map((h, i) => <HotelEntry key={i} hotel={h} />)
        )}

        {itinerary.tips && itinerary.tips.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Travel tips</Text>
            {itinerary.tips.map((tip, i) => (
              <Text key={i} style={styles.tip}>• {tip}</Text>
            ))}
          </>
        )}

        <Text style={styles.sectionTitle}>Day by day</Text>
        {itinerary.days.map((day) => (
          <DayBlock
            key={day.dayNumber}
            day={day}
            cityLabel={cityForDay(itinerary, day.dayNumber)}
          />
        ))}

        <Text style={styles.footer}>
          Generated by Daytrip · {new Date().toISOString().slice(0, 10)}
        </Text>
      </Page>
    </Document>
  );
}
