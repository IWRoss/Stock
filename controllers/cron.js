const { calculateStockPrice } = require("../utils");

// fs
const fs = require("fs");

module.exports = (session) => {
  const cron = require("node-cron");

  const { getProfitAndLoss, xero } = require("./xero");

  const { sendStockChangeMessageToSlack } = require("./slack");

  const runTime = parseInt(process.env.DEBUG_CRON)
    ? "* * * * *"
    : "*/10 * * * *";

  const runCron = async () => {
    console.log("Cron job started");

    // Run the cron job every hour
    const task = cron.schedule(
      runTime,
      async () => {
        console.log("Running cron job");

        const tokenSet = xero.readTokenSet();

        if (tokenSet.expired()) {
          console.log("Token expired, refreshing");
          await xero.refreshToken();
        }

        const stockChangeData = await getProfitAndLoss();

        console.log("Stock prices:", stockChangeData);

        // If stockChangeData matches archivedStockChangeData, do nothing
        if (
          session.archivedStockChangeData &&
          calculateStockPrice(
            session.archivedStockChangeData.revenue,
            session.archivedStockChangeData.profit
          ).toFixed(2) ===
            calculateStockPrice(
              stockChangeData.revenue,
              stockChangeData.profit
            ).toFixed(2)
        ) {
          console.log("No change in stock");
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
