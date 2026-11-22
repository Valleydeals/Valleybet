exports.handler = async function () {
  const url = "https://www.betpawa.co.ke/events?categoryId=2";

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const html = await response.text();

    const scripts = [
      ...html.matchAll(/<script[^>]*src=["']([^"']+)["']/gi)
    ].map(match => match[1]);

    const dataScripts = [
      ...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)
    ]
      .map(match => match[1])
      .filter(script =>
        script.includes("__NEXT_DATA__") ||
        script.includes("events") ||
        script.includes("odds")
      );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        success: true,
        status: response.status,
        htmlLength: html.length,
        scripts,
        dataScripts: dataScripts.map(script => script.substring(0, 3000)),
        htmlContainsNextData: html.includes("__NEXT_DATA__")
      }, null, 2)
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};