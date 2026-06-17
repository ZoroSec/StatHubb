import type { Country } from "./types";

export const COUNTRIES: Country[] = [
  {
    id: "india",
    name: "India",
    iso: "IN",
    flag: "🇮🇳",
    region: "South Asia",
    overview:
      "The world's most populous nation and fifth-largest economy, India combines rapid digital transformation with deep demographic dividend. Its services-led growth, thriving tech sector, and massive infrastructure push position it as a defining 21st-century economy.",
    indicators: [
      { label: "GDP", value: "$3.9T", trend: "up" },
      { label: "Population", value: "1.43B", trend: "up" },
      { label: "GDP Growth", value: "7.8%", trend: "up" },
      { label: "Median Age", value: "28.4 yrs", trend: "neutral" },
    ],
  },
  {
    id: "united-states",
    name: "United States",
    iso: "US",
    flag: "🇺🇸",
    region: "North America",
    overview:
      "The world's largest economy by nominal GDP, the United States drives global technology, finance, and consumer markets. Its diversified economy, innovation ecosystem, and deep capital markets set the pace for the global economy.",
    indicators: [
      { label: "GDP", value: "$27.4T", trend: "up" },
      { label: "Population", value: "335M", trend: "up" },
      { label: "GDP Growth", value: "2.5%", trend: "up" },
      { label: "Median Age", value: "38.9 yrs", trend: "neutral" },
    ],
  },
  {
    id: "china",
    name: "China",
    iso: "CN",
    flag: "🇨🇳",
    region: "East Asia",
    overview:
      "The world's second-largest economy and largest manufacturer, China is navigating a transition from export-led growth to domestic consumption and high-tech innovation, while managing demographic headwinds.",
    indicators: [
      { label: "GDP", value: "$17.8T", trend: "up" },
      { label: "Population", value: "1.41B", trend: "down" },
      { label: "GDP Growth", value: "5.2%", trend: "up" },
      { label: "Median Age", value: "39.8 yrs", trend: "up" },
    ],
  },
  {
    id: "japan",
    name: "Japan",
    iso: "JP",
    flag: "🇯🇵",
    region: "East Asia",
    overview:
      "The world's fourth-largest economy, Japan is a leader in advanced manufacturing, robotics, and technology. It faces unique demographic challenges with an aging population while maintaining high living standards.",
    indicators: [
      { label: "GDP", value: "$4.2T", trend: "down" },
      { label: "Population", value: "124M", trend: "down" },
      { label: "GDP Growth", value: "1.9%", trend: "up" },
      { label: "Median Age", value: "49.9 yrs", trend: "up" },
    ],
  },
  {
    id: "germany",
    name: "Germany",
    iso: "DE",
    flag: "🇩🇪",
    region: "Europe",
    overview:
      "Europe's largest economy and a global manufacturing powerhouse, Germany leads in automotive, machinery, and chemicals. It anchors the EU while navigating energy transition and demographic shifts.",
    indicators: [
      { label: "GDP", value: "$4.5T", trend: "down" },
      { label: "Population", value: "84M", trend: "up" },
      { label: "GDP Growth", value: "-0.1%", trend: "down" },
      { label: "Median Age", value: "46.7 yrs", trend: "up" },
    ],
  },
  {
    id: "united-kingdom",
    name: "United Kingdom",
    iso: "GB",
    flag: "🇬🇧",
    region: "Europe",
    overview:
      "A services-driven economy centered on London's financial district, the UK combines world-class universities, creative industries, and a tech sector that punches above its weight post-Brexit.",
    indicators: [
      { label: "GDP", value: "$3.3T", trend: "up" },
      { label: "Population", value: "68M", trend: "up" },
      { label: "GDP Growth", value: "0.5%", trend: "up" },
      { label: "Median Age", value: "40.6 yrs", trend: "up" },
    ],
  },
  {
    id: "brazil",
    name: "Brazil",
    iso: "BR",
    flag: "🇧🇷",
    region: "South America",
    overview:
      "Latin America's largest economy, Brazil is an agricultural and resource powerhouse with a diversified industrial base. It navigates cyclical challenges while leveraging its environmental and demographic assets.",
    indicators: [
      { label: "GDP", value: "$2.1T", trend: "up" },
      { label: "Population", value: "216M", trend: "up" },
      { label: "GDP Growth", value: "2.9%", trend: "up" },
      { label: "Median Age", value: "33.5 yrs", trend: "neutral" },
    ],
  },
  {
    id: "south-africa",
    name: "South Africa",
    iso: "ZA",
    flag: "🇿🇦",
    region: "Africa",
    overview:
      "Africa's most industrialized economy, South Africa leads in mining, finance, and services on the continent. It faces structural challenges of inequality and unemployment while remaining a gateway to African markets.",
    indicators: [
      { label: "GDP", value: "$380B", trend: "down" },
      { label: "Population", value: "60M", trend: "up" },
      { label: "GDP Growth", value: "0.6%", trend: "down" },
      { label: "Median Age", value: "28.0 yrs", trend: "neutral" },
    ],
  },
];

export const COUNTRY_MAP: Record<string, Country> = Object.fromEntries(
  COUNTRIES.map((c) => [c.id, c])
);
