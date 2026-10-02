import { conditionText, weatherLine, windText } from "./weatherText";

describe("weatherText", () => {
  it("sentence-cases the feed's Title Case conditions", () => {
    expect(conditionText("Mostly Cloudy")).toBe("Mostly cloudy");
    expect(conditionText("Clear")).toBe("Clear");
  });

  it("spaces the unit and adds the direction when known", () => {
    expect(windText(13, "SSW")).toBe("Wind 13 mph SSW");
    expect(windText(4.6, null)).toBe("Wind 5 mph");
  });

  it("builds the full line in one order", () => {
    expect(
      weatherLine({
        temp_f: 68.4,
        condition: "Partly Cloudy",
        wind_speed_mph: 5,
        wind_direction: "W",
        precipitation_pct: 0,
      })
    ).toBe("68°F · Partly cloudy · Wind 5 mph W · Precip 0%");
  });

  it("skips missing parts and the ones turned off", () => {
    expect(
      weatherLine(
        { temp_f: 70, condition: "Clear", wind_speed_mph: 3 },
        { temp: false }
      )
    ).toBe("Clear · Wind 3 mph");
  });
});
