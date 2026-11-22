exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({
        success: false,
        message: "Use POST to import matches"
      })
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");

    const matches = body.matches || [];

    if (!Array.isArray(matches)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "matches must be an array"
        })
      };
    }

    const importedMatches = matches.map((match, index) => ({
      id: String(match.id || `match-${index + 1}`),
      league: match.league || "Unknown League",
      home: match.home || "Home Team",
      away: match.away || "Away Team",
      kickoff: match.kickoff || match.time || null,
      status: match.status || "upcoming",
      markets: Array.isArray(match.markets)
        ? match.markets.map(market => ({
            name: market.name || "Unknown Market",
            selections: Array.isArray(market.selections)
              ? market.selections.map(selection => ({
                  name: selection.name,
                  odds: Number(selection.odds)
                }))
              : []
          }))
        : []
    }));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        success: true,
        imported: importedMatches.length,
        matches: importedMatches
      })
    };

  } catch (error) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};