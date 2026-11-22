exports.handler = async function (event) {
  const matchId = event.queryStringParameters?.matchId;

  if (!matchId) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        success: false,
        message: "matchId is required"
      })
    };
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify({
      success: true,
      matchId,
      markets: [],
      message: "Markets endpoint is ready"
    })
  };
};