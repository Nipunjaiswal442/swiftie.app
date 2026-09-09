import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Maya's daily round-up of complaints, requests and reports for the admin
// console. 03:30 UTC = 09:00 IST, so it's waiting when the day starts in India.
crons.daily(
  "maya daily admin digest",
  { hourUTC: 3, minuteUTC: 30 },
  internal.adminDigest.generateDailyDigest,
  { trigger: "cron" }
);

export default crons;
