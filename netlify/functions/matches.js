exports.handler = async function () {

  const SOURCE_URL = process.env.BETPAWA_FEED_URL;

  try {

    // Real authorized data source configured
    if (SOURCE_URL) {

      const response = await fetch(SOURCE_URL, {
        headers: {
          "Accept": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Source returned HTTP ${response.status}`);
      }

      const data = await response.json();

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=30"
        },
        body: JSON.stringify({
          success: true,
          source: "authorized-feed",
          matches: data
        })
      };
    }

    // Temporary demo data while configuring the source
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        success: true,
        source: "demo",
        matches: [
          {
            id: "demo-1",
            league: "Premier League",
            home: "Manchester City",
            away: "Liverpool",
            time: "18:00",
            status: "upcoming",
            odds: {
              home: 2.10,
              draw: 3.40,
              away: 3.20
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
              draw: 3.20,
              away: 2.75
            }
          }
        ]
      })
    };

  } catch (error) {

    return {
      statusCode: 500,
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