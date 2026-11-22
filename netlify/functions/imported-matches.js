const pool = require("./db");

exports.handler = async function (event) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-cache"
  };

  try {
    const matchResult = await pool.query(`
      SELECT *
      FROM imported_matches
      ORDER BY kickoff ASC NULLS LAST
    `);

    const matches = matchResult.rows;

    if (matches.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          count: 0,
          matches: [],
          message: "No imported matches yet"
        })
      };
    }

    const marketResult = await pool.query(`
      SELECT
        m.id AS market_id,
        m.match_id,
        m.market_name,
        s.selection_name,
        s.odds
      FROM imported_markets m
      LEFT JOIN imported_selections s
        ON s.market_id = m.id
      ORDER BY m.id, s.id
    `);

    const marketMap = {};

    for (const row of marketResult.rows) {
      if (!marketMap[row.match_id]) {
        marketMap[row.match_id] = {};
      }

      if (!marketMap[row.match_id][row.market_id]) {
        marketMap[row.match_id][row.market_id] = {
          name: row.market_name,
          selections: []
        };
      }

      if (row.selection_name !== null) {
        marketMap[row.match_id][row.market_id]
          .selections.push({
            name: row.selection_name,
            odds: Number(row.odds)
          });
      }
    }

    const formattedMatches = matches.map(match => {
      const matchMarkets =
        marketMap[match.id] || {};

      return {
        id: match.id,
        league: match.league,
        home: match.home_team,
        away: match.away_team,
        kickoff: match.kickoff,
        time: match.kickoff,
        status: match.status,
        source: match.source,
        updatedAt: match.updated_at,

        markets: Object.values(matchMarkets),

        odds: {
          home: 0,
          draw: 0,
          away: 0
        }
      };
    });

    // Extract 1X2 odds for compatibility with existing frontend
    for (const match of formattedMatches) {
      const market = match.markets.find(
        m => m.name.toLowerCase() === "1x2"
      );

      if (market) {
        for (const selection of market.selections) {
          if (selection.name === "1") {
            match.odds.home = selection.odds;
          }

          if (selection.name === "X") {
            match.odds.draw = selection.odds;
          }

          if (selection.name === "2") {
            match.odds.away = selection.odds;
          }
        }
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        count: formattedMatches.length,
        updatedAt: new Date().toISOString(),
        matches: formattedMatches
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        matches: []
      })
    };
  }
};