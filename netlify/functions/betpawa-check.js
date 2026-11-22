exports.handler = async function () {
  const pageUrl = "https://www.betpawa.co.ke/events?categoryId=2";

  try {
    const pageResponse = await fetch(pageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const html = await pageResponse.text();

    const scriptPaths = [
      ...html.matchAll(/<script[^>]*src=["']([^"']+)["']/gi)
    ].map(match => match[1]);

    const results = [];

    for (const path of scriptPaths.slice(0, 8)) {
      const scriptUrl = new URL(path, pageUrl).href;

      try {
        const response = await fetch(scriptUrl);
        const script = await response.text();

        const keywords = [
          "events",
          "odds",
          "markets",
          "football",
          "fixtures"
        ];

        const found = keywords.filter(keyword =>
          script.toLowerCase().includes(keyword)
        );

        results.push({
          script: scriptUrl,
          status: response.status,
          size: script.length,
          keywordsFound: found
        });

      } catch (error) {
        results.push({
          script: scriptUrl,
          error: error.message
        });
      }
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        success: true,
        scriptsChecked: results.length,
        results
      }, null, 2)
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};