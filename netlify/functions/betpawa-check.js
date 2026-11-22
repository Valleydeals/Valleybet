exports.handler = async function () {
  const url = "https://www.betpawa.co.ke/events?categoryId=2";

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const html = await response.text();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        success: response.ok,
        status: response.status,
        contentType: response.headers.get("content-type"),
        htmlLength: html.length,
        pageTitle: html.match(/<title[^>]*>(.*?)<\/title>/i)?.[1] || null,
        containsFootball: html.toLowerCase().includes("football"),
        preview: html.substring(0, 1500)
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