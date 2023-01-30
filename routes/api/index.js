const express = require("express"),
  router = express.Router();

const actions = {};

/**
 * POST /api/slack
 *
 * This route is used to handle all Slack actions.
 */
router.post("/xero/callback", async (req, res) => {
  // Parse the request payload
  const payload = JSON.parse(req.body.payload);

  console.log(payload);

  // try {
  //   if (payload.type === "block_actions") {
  //     // Call the appropriate action handler
  //     await actions[payload.actions[0].action_id](payload);
  //   }

  //   if (payload.type === "view_submission") {
  //     // Call the appropriate action handler
  //     await actions[payload.view.callback_id](payload);
  //   }
  // } catch {
  //   // Dump action to console
  //   console.log(payload);
  // }

  res.send();
});

module.exports = router;
