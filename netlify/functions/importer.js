const pool = require("./db");

exports.handler = async function (event) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  };

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        error: "POST method required"
      })
    };
  }

  // Protect the import endpoint
  const secret = process.env.IMPORT_SECRET;

  if (!secret || event.headers["x-import-secret"] !== secret) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({
        success: false,
        error: "Unauthorized"
      })
    };
  }

  let body;

  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: "Invalid JSON"
      })
    };
  }

  if (!Array.isArray(body.matches)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: "matches must be an array"
      })
    };
  }

  const client = await pool.connect();

  let imported = 0;

  try {
    await client.query("BEGIN");

    for (const match of body.matches) {
      if (!match.id || !match.home || !match.away) {
        continue;
      }

      const matchId = String(match.id);

      await client.query(
        `INSERT INTO imported_matches
         (id, league, home_team, away_team, kickoff, status, source, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (id)
         DO UPDATE SET
           league = EXCLUDED.league,
           home_team = EXCLUDED.home_team,
           away_team = EXCLUDED.away_team,
           kickoff = EXCLUDED.kickoff,
           status = EXCLUDED.status,
           source = EXCLUDED.source,
           updated_at = NOW()`,
        [
          matchId,
          match.league || "Unknown League",
          match.home,
          match.away,
          match.kickoff || match.time || null,
          match.status || "upcoming",
          match.source || "authorized_import"
        ]
      );

      // Replace old markets for this match
      await client.query(
        "DELETE FROM imported_markets WHERE match_id = $1",
        [matchId]
      );

      for (const market of match.markets || []) {
        const marketResult = await client.query(
          `INSERT INTO imported_markets
           (match_id, market_name, updated_at)
           VALUES ($1, $2, NOW())
           RETURNING id`,
          [matchId, market.name || "Unknown Market"]
        );

        const marketId = marketResult.rows[0].id;

        for (const selection of market.selections || []) {
          const odds = Number(selection.odds);

          if (
            selection.name &&
            Number.isFinite(odds) &&
            odds > 1
          ) {
            await client.query(
              `INSERT INTO imported_selections
               (market_id, selection_name, odds, updated_at)
               VALUES ($1, $2, $3, NOW())`,
              [
                marketId,
                selection.name,
                odds
              ]
            );
          }
        }
      }

      imported++;
    }

    await client.query("COMMIT");

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        imported,
        message: `${imported} matches saved successfully`
      })
    };

  } catch (error) {
    await client.query("ROLLBACK");

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };

  } finally {
    client.release();
  }
};