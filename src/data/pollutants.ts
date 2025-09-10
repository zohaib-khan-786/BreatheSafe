export const pollutantData = [
  {
    heading: "Good",
    details: [
      "Ozone (O₃)",
      "Nitrogen Dioxide (NO₂)",
      "Sulphur Dioxide (SO₂)",
      "PM2.5",
      "PM10 ",
    ],
    indexes: ["0–33", "0–67", "0–88", "0–11", "0–16"],
    color: { bg: "bg-safe/5", solid: "bg-safe", text: "text-white" },
  },
  {
    heading: "Fair",
    details: [
      "Ozone (O₃)",
      "Nitrogen Dioxide (NO₂)",
      "Sulphur Dioxide (SO₂)",
      "PM2.5",
      "PM10 ",
    ],
    indexes: ["34–66", "68–134", "89–177", "12–23", "17–33"],
    color: { bg: "bg-info/5", solid: "bg-info", text: "text-white" },
  },
  {
    heading: "Moderate",
    details: [
      "Ozone (O₃)",
      "Nitrogen Dioxide (NO₂)",
      "Sulphur Dioxide (SO₂)",
      "PM2.5",
      "PM10 ",
    ],
    indexes: ["67–100", "135–200", "178–266", "24–35", "34–50"],
    color: { bg: "bg-warning/5", solid: "bg-warning", text: "text-white" },
  },
  {
    heading: "Poor",
    details: [
      "Ozone (O₃)",
      "Nitrogen Dioxide (NO₂)",
      "Sulphur Dioxide (SO₂)",
      "PM2.5",
      "PM10 ",
    ],
    indexes: ["101–120", "201–267", "267–354", "36–41", "51–58"],
    color: { bg: "bg-orange-500/5", solid: "bg-orange-500", text: "text-white" },
  },
  {
    heading: "Very Poor",
    details: [
      "Ozone (O₃)",
      "Nitrogen Dioxide (NO₂)",
      "Sulphur Dioxide (SO₂)",
      "PM2.5",
      "PM10 ",
    ],
    indexes: ["121–187", "268–334", "355–443", "42–47", "59–66"],
    color: { bg: "bg-danger/5", solid: "bg-danger", text: "text-white" },
  },
  {
    heading: "Extremely Poor",
    details: [
      "Ozone (O₃)",
      "Nitrogen Dioxide (NO₂)",
      "Sulphur Dioxide (SO₂)",
      "PM2.5",
      "PM10 ",
    ],
    indexes: [">=188", ">=335", ">=444", ">=48", ">=67"],
    color: { bg: "bg-hazardous/5", solid: "bg-hazardous", text: "text-white" },
  },
];
