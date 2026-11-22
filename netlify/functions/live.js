exports.handler = async function () {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-cache"
    },
    body: JSON.stringify({
      success: true,
      liveMatches: [],
      updatedAt: new Date().toISOString(),
      message: "Live matches endpoint is ready"
    })
  };
};