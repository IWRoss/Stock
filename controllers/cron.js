module.exports = (session) => {
  const cron = require("node-cron");

  const { getProfitAndLoss, xero } = require("./xero");

  const { sendStockChangeMessageToSlack } = require("./slack");

  const runTime = parseInt(process.env.DEBUG_CRON) ? "* * * * *" : "0 * * * *";

  const runCron = async () => {
    console.log("Cron job started");

    // Run the cron job every hour
    const task = cron.schedule(
      runTime,
      async () => {
        if (session.tokenSet.expired()) {
          await xero.refreshToken();
        }

        const stockChangeData = await getProfitAndLoss();

        // If stockChangeData matches archivedStockChangeData, do nothing
        if (
          session.archivedStockChangeData &&
          JSON.stringify(session.archivedStockChangeData) ===
            JSON.stringify(stockChangeData)
        ) {
          return;
        }

        if (session.archivedStockChangeData) {
          sendStockChangeMessageToSlack({
            prev: session.archivedStockChangeData,
            current: stockChangeData,
          });
        }

        session.archivedStockChangeData = stockChangeData;
      },
      {
        scheduled: true,
      }
    );

    task.start();
  };

  return {
    runCron,
  };
};
