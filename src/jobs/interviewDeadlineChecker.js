// server/src/jobs/interviewDeadlineChecker.js
const cron = require('node-cron');
const db = require('../config/db');

// Schedule to run every hour (at minute 0)
const scheduleJob = () => {
    cron.schedule('0 * * * *', async () => {
        console.log('Running interview deadline check...');
        try {
            const [expiredInterviews] = await db.query(
                `SELECT id FROM interviews WHERE status = 'scheduled' AND confirmation_deadline < NOW()`
            );

            if (expiredInterviews.length > 0) {
                const idsToDecline = expiredInterviews.map(i => i.id);
                await db.query('UPDATE interviews SET status = ? WHERE id IN (?)', ['declined', idsToDecline]);
                console.log(`Auto-declined ${idsToDecline.length} expired interview confirmations.`);
                // Optionally: Send notifications to candidates/recruiters
            } else {
                console.log('No expired interview confirmations found.');
            }
        } catch (error) {
            console.error('Error in interview deadline checker job:', error);
        }
    });
    console.log("Interview deadline checker job scheduled.");
};

module.exports = { scheduleJob };