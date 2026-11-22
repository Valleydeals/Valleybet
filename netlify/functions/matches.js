exports.handler = async function () {
  const SOURCE_URL = process.env.BETPAWA_FEED_URL;

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=30"
  };

  function normalizeMatch(match, index) {
    return {
      id: String(match.id || match.matchId || index + 1),

      league:
        match.league ||
        match.competition ||
        match.tournament ||
        "Unknown League",

      home:
        match.home ||
        match.homeTeam ||
        match.home_team ||
        match.team1 ||
        "Home",

      away:
        match.away ||
        match.awayTeam ||
        match.away_team ||
        match.team2 ||
        "Away",

      time:
        match.time ||
        match.kickoff ||
        match.startTime ||
        match.date ||
        "",

      status:
        match.status ||
        "upcoming",

      odds: {
        home:
          Number(match.odds?.home || match.homeOdds || 0),

        draw:
          Number(match.odds?.draw || match.drawOdds || 0),

        away:
          Number(match.odds?.away || match.awayOdds || 0)
      },

      markets: match.markets || [],

      score: match.score || null
    };
  }

  try {
    // Authorized feed configured
    if (SOURCE_URL) {
      const response = await fetch(SOURCE_URL, {
        headers: {
          Accept: "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(
          `Source returned HTTP ${response.status}`
        );
      }

      const data = await response.json();

      const rawMatches = Array.isArray(data)
        ? data
        : data.matches || data.events || [];

      const matches = rawMatches.map(normalizeMatch);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          source: "authorized-feed",
          count: matches.length,
          updatedAt: new Date().toISOString(),
          matches
        })
      };
    }

    // Demo fallback
    const demoMatches = [
      {
        id: "demo-1",
        league: "Premier League",
        home: "Manchester City",
        away: "Liverpool",
        time: "18:00",
        status: "upcoming",
        odds: {
          home: 2.1,
          draw: 3.4,
          away: 3.2
        }
      },
      {
        id: "demo-2",
        league: "La Liga",
        home: "Real Madrid",
        away: "Barcelona",
        time: "20:00",
        status: "upcoming",
        odds: {
          home: 2.45,
          draw: 3.2,
          away: 2.75
        }
      }
    ];

    const matches = demoMatches.map(normalizeMatch);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        source: "demo",
        count: matches.length,
        updatedAt: new Date().toISOString(),
        matches
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        source: "error",
        error: error.message,
        matches: []
      })
    };
  }
};