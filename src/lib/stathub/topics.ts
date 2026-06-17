import type { Topic } from "./types";

export const TOPICS: Topic[] = [
  {
    id: "economy",
    label: "Economy",
    icon: "◈",
    color: "#6366f1",
    description: "GDP, trade balances, inflation and macroeconomic indicators",
    intro:
      "Track the pulse of global and national economies through GDP growth, inflation, trade balances, and productivity. Understand how recessions, recoveries, and structural shifts reshape economic landscapes over time.",
  },
  {
    id: "population",
    label: "Population",
    icon: "◉",
    color: "#a855f7",
    description: "Demographics, migration, urbanization and age structure",
    intro:
      "Explore how populations grow, age, and move. From fertility rates to urbanization, demographic data reveals the human story behind every policy and market decision.",
  },
  {
    id: "health",
    label: "Health",
    icon: "♡",
    color: "#ec4899",
    description: "Life expectancy, disease burden, healthcare spending",
    intro:
      "Measure the wellbeing of nations through life expectancy, disease prevalence, and healthcare investment. Health data connects policy, economics, and human outcomes.",
  },
  {
    id: "education",
    label: "Education",
    icon: "✎",
    color: "#f59e0b",
    description: "Literacy, enrollment, attainment and education spending",
    intro:
      "Quantify human capital through literacy, enrollment, and attainment. Education indicators forecast economic potential and social mobility for generations.",
  },
  {
    id: "technology",
    label: "Technology",
    icon: "⬡",
    color: "#a78bfa",
    description: "AI, internet adoption, R&D and digital infrastructure",
    intro:
      "Follow the acceleration of digital transformation — from AI markets to broadband penetration. Technology data charts the frontier of innovation and its economic ripple effects.",
  },
  {
    id: "energy",
    label: "Energy",
    icon: "⚡",
    color: "#f97316",
    description: "Consumption, renewables, production and efficiency",
    intro:
      "Map the global energy transition — fossil fuels to renewables, consumption to production. Energy data is the backbone of climate policy and economic planning.",
  },
  {
    id: "climate",
    label: "Climate",
    icon: "🌍",
    color: "#10b981",
    description: "Emissions, temperature, carbon and environmental impact",
    intro:
      "Measure our changing planet through emissions, temperature anomalies, and carbon intensity. Climate data anchors the most consequential decisions of our era.",
  },
  {
    id: "employment",
    label: "Employment",
    icon: "⚒",
    color: "#3b82f6",
    description: "Unemployment, wages, labor force and job sectors",
    intro:
      "Track labor market health through unemployment rates, wage growth, and workforce participation. Employment data signals economic vitality and social stability.",
  },
  {
    id: "finance",
    label: "Finance",
    icon: "$",
    color: "#8b5cf6",
    description: "Markets, interest rates, debt and financial flows",
    intro:
      "Navigate financial systems through interest rates, stock markets, and sovereign debt. Financial data connects monetary policy to everyday economic reality.",
  },
  {
    id: "agriculture",
    label: "Agriculture",
    icon: "🌾",
    color: "#84cc16",
    description: "Crop yields, food production, land use and food security",
    intro:
      "Monitor the systems that feed the world — crop yields, arable land, and food security. Agricultural data links climate, economics, and survival.",
  },
  {
    id: "transportation",
    label: "Transportation",
    icon: "✈",
    color: "#06b6d4",
    description: "Mobility, logistics, EV adoption and infrastructure",
    intro:
      "Follow the movement of people and goods — from air travel to electric vehicles. Transportation data reveals economic connectivity and the energy transition in motion.",
  },
  {
    id: "trade",
    label: "Trade",
    icon: "⇄",
    color: "#f43f5e",
    description: "Imports, exports, tariffs and global supply chains",
    intro:
      "Trace the flow of goods across borders — exports, imports, and trade balances. Trade data maps economic interdependence and geopolitical leverage.",
  },
];

export const TOPIC_MAP: Record<string, Topic> = Object.fromEntries(
  TOPICS.map((t) => [t.id, t])
);
