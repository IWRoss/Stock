module.exports = {
  blocks: [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: ":chart_with_upwards_trend: Stock price increased by 1.56%",
        emoji: true,
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: "New stock price: `£4.57`",
        },
        {
          type: "mrkdwn",
          text: "Difference: `+£0.07`",
        },
      ],
    },
  ],
};
