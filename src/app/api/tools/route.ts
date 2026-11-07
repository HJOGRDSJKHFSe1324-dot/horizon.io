export async function GET() {
  return Response.json({
    tools: [
      { name: "web_search", method: "GET", path: "/api/tools/search?q=", description: "Search the web (DuckDuckGo instant answers)" },
      { name: "browse_url", method: "GET", path: "/api/tools/browse?url=", description: "Fetch and extract text from a URL" },
      { name: "calculate", method: "GET", path: "/api/tools/calc?expr=", description: "Evaluate arithmetic safely" },
      { name: "convert", method: "GET", path: "/api/tools/convert?value=&from=&to=", description: "Unit conversions" },
      { name: "weather", method: "GET", path: "/api/tools/weather?city=", description: "Current weather for a city" },
      { name: "time", method: "GET", path: "/api/tools/time", description: "Current UTC time" },
      { name: "location", method: "GET", path: "/api/tools/location", description: "Approximate location from IP" },
      { name: "quote", method: "GET", path: "/api/tools/quote", description: "Random inspirational quote" },
      { name: "joke", method: "GET", path: "/api/tools/joke", description: "Programming joke" },
      { name: "dictionary", method: "GET", path: "/api/tools/dictionary?word=", description: "Dictionary definition" },
      { name: "country", method: "GET", path: "/api/tools/country?name=", description: "Country facts" },
      { name: "news", method: "GET", path: "/api/tools/news", description: "Top Hacker News stories" },
      { name: "chart", method: "POST", path: "/api/tools/chart", description: "Generate an SVG bar chart" },
      { name: "banner", method: "POST", path: "/api/tools/banner", description: "Generate an SVG banner image" },
    ],
  });
}