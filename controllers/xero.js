const { XeroClient } = require("xero-node");

const fs = require("fs");
const path = require("path");

const xero = new XeroClient({
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  redirectUris: [process.env.XERO_REDIRECT_URI],
  scopes: [...process.env.XERO_SCOPES.split(",")],
});

const { cloneDeep } = require("lodash");

/**
 * Store token set in local file so we can retrieve it if the app crashes
 */
const storeTokenSet = (tokenSet) => {
  const tokenSetCopy = cloneDeep(tokenSet);

  // Write the tokenSetCopy to a file
  fs.writeFileSync(
    path.join(__dirname, "../tokenSet.json"),
    JSON.stringify(tokenSetCopy)
  );

  console.log("Token set stored");
};

/**
 * Get the token set from the local file
 * @returns {object} tokenSet
 */
const getTokenSet = () => {
  try {
    const tokenSet = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../tokenSet.json"))
    );

    return tokenSet;
  } catch (error) {
    console.log("No token set found");
    return null;
  }
};

/**
 * Authorize Xero from local token
 */
const authorizeXero = async () => {
  const tokenSet = getTokenSet();

  if (!tokenSet) {
    console.log("No token set found");
    return;
  }

  xero.setTokenSet(tokenSet);

  console.log("Xero authorized");
};

const getAccessToken = async (req, res) => {
  // Get URL params from req
  const { code } = req.query;

  // Store the code in the session
  req.session.code = code;

  // Exchange the code for an access token
  const tokenSet = await xero.apiCallback(req.url);

  // Store the token set in the session
  req.session.tokenSet = tokenSet;

  console.log("Got a new access token");

  await xero.setTokenSet(tokenSet);

  if (tokenSet.expired()) {
    await xero.refreshToken();
  }

  storeTokenSet(tokenSet);

  res.redirect("/");

  res.send();

  return tokenSet;
};

/**
 *
 */
const getProfitAndLoss = async () => {
  // Get old report from session

  try {
    // Get the Profit and Loss report
    const report = await xero.accountingApi.getReportProfitAndLoss(
      process.env.XERO_TENANT_ID,
      // One year ago as YYYY-MM-DD
      new Date(new Date().setFullYear(new Date().getFullYear() - 1))
        .toISOString()
        .split("T")[0],
      // Today as YYYY-MM-DD
      new Date().toISOString().split("T")[0]
    );

    return getRevenueAndProfit(report);
  } catch (error) {
    console.error(error);

    return false;
  }
};

/**
 * Flatten the Profit and Loss report to cells
 */
const flattenReport = (report) => {
  const rows = report.body.reports[0].rows;

  const cells = [];

  rows.forEach((row) => {
    if (row.rows) {
      row.rows.forEach((row) => {
        cells.push(row.cells);
      });
    } else {
      cells.push(row.cells);
    }
  });

  return cells;
};

/**
 * Get Revenue and Profit from Xero report
 */
const getRevenueAndProfit = (report) => {
  const cells = flattenReport(report);

  const revenueRow = cells.find(
    (row) => row[0]?.value === "Total Total Income"
  );

  const profitRow = cells.find((row) => row[0]?.value === "Operating Profit");

  return {
    revenue: revenueRow[1]?.value,
    profit: profitRow[1]?.value,
  };
};

module.exports = { xero, getAccessToken, getProfitAndLoss, authorizeXero };
