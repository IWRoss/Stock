/**
 * Slack controller
 *
 * This controller handles all of our interactions with Slack
 */
const { WebClient } = require("@slack/web-api");

// Create a new instance of the WebClient class with the token read from your environment variable
const slack = new WebClient(process.env.SLACK_TOKEN);

const { cloneDeep } = require("lodash");

const templates = require("../templates/index");

const { percentDiff, calculateStockPrice } = require("../utils/index");

const sendStockChangeMessageToSlack = async (stockChangeData) => {
  const template = cloneDeep(templates.stockChangeMessage);

  const { prev, current } = Object.keys(stockChangeData).reduce((acc, key) => {
    acc[key] = {
      ...stockChangeData[key],
      stockPrice: calculateStockPrice(
        stockChangeData[key].revenue,
        stockChangeData[key].profit
      ),
    };

    return acc;
  }, {});

  const change = {
    stockPrice: current.stockPrice - prev.stockPrice,
    percent: percentDiff(current.stockPrice, prev.stockPrice),
    direction: current.stockPrice > prev.stockPrice ? "up" : "down",
    verb: current.stockPrice > prev.stockPrice ? "increased" : "decreased",
    emoji:
      current.stockPrice > prev.stockPrice
        ? ":chart_with_upwards_trend:"
        : ":chart_with_downwards_trend:",
  };

  // Set the text of the message
  template.blocks[0].text.text = `${change.emoji} Stock price ${
    change.verb
  } by ${change.percent.toFixed(2)}%`;

  // Set the fields of the message
  template.blocks[1].fields[0].text = `New stock price: \`£${current.stockPrice.toFixed(
    2
  )}\``;
  template.blocks[1].fields[1].text = `Difference: \`£${change.stockPrice.toFixed(
    2
  )}\``;

  // Send a message to the channel
  try {
    const result = await slack.chat.postMessage({
      channel: process.env.SLACK_CHANNEL_ID,
      ...template,
    });
  } catch (error) {
    console.error(error);
  }
};

module.exports = {
  sendStockChangeMessageToSlack,
};
