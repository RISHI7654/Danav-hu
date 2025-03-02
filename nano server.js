const puppeteer = require("puppeteer");
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");

const app = express();
const PASSWORD = "indra123";  // Change this password

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname)); // Serve index.html

// ** Login Page **
app.post("/start", (req, res) => {
    if (req.body.password === PASSWORD) {
        res.send("<h2>✅ Login Successful! Bot is running...</h2>");
        startMultiBot();
    } else {
        res.send("<h2>❌ Incorrect Password!</h2>");
    }
});

// ** Multi-Account Bot Start Function **
async function startMultiBot() {
    const FACEBOOK_URL = "https://mbasic.facebook.com";

    const accounts = JSON.parse(fs.readFileSync("accounts.json"));
    
    for (const acc of accounts) {
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();

        console.log(`🔹 Logging in: ${acc.name}`);

        // ** Load Cookies **
        if (fs.existsSync(`${acc.name}_cookies.json`)) {
            const cookies = JSON.parse(fs.readFileSync(`${acc.name}_cookies.json`));
            await page.setCookie(...cookies);
            console.log(`✅ Cookies loaded for ${acc.name}`);
        }

        // ** Login Check **
        await page.goto(FACEBOOK_URL, { waitUntil: "load" });

        if (page.url().includes("login")) {
            console.log(`❌ Cookies expired for ${acc.name}. Please login manually.`);
            await page.type('input[name="email"]', acc.email, { delay: 50 });
            await page.type('input[name="pass"]', acc.password, { delay: 50 });
            await page.click('input[name="login"]');
            await page.waitForNavigation({ waitUntil: "load" });

            // ** Save Cookies **
            const cookies = await page.cookies();
            fs.writeFileSync(`${acc.name}_cookies.json`, JSON.stringify(cookies, null, 2));
            console.log(`✅ Cookies saved for ${acc.name}`);
        } else {
            console.log(`✅ Already logged in: ${acc.name}`);
        }

        let postUrl = "https://mbasic.facebook.com/YOUR_POST_ID";
        let pollUrl = "https://mbasic.facebook.com/YOUR_POLL_ID";

        await autoComment(page, postUrl, "🔥 Auto Comment by Facebook Multi Bot!");
        await autoReact(page, postUrl, "LOVE");
        await autoShare(page, postUrl);
        await autoFollow(page, "https://mbasic.facebook.com/YOUR_PROFILE");
        await autoVotePoll(page, pollUrl);

        await browser.close();
    }
}

// ** Auto Comment **
async function autoComment(page, postUrl, commentText) {
    await page.goto(postUrl, { waitUntil: "load" });

    const commentBox = await page.$('textarea[name="comment_text"]');
    if (commentBox) {
        await commentBox.type(commentText, { delay: 50 });
        await page.click('input[name="post"]');
        console.log(`✅ Comment posted: "${commentText}"`);
    } else {
        console.log("❌ Comment box not found.");
    }
}

// ** Auto React **
async function autoReact(page, postUrl, reaction) {
    await page.goto(postUrl, { waitUntil: "load" });

    const reactButtons = await page.$$('a[href*="reaction_type"]');
    if (reactButtons.length > 0) {
        let reactIndex = { "LIKE": 0, "LOVE": 1, "HAHA": 2, "WOW": 3, "SAD": 4, "ANGRY": 5 }[reaction.toUpperCase()];
        if (reactIndex !== undefined) {
            await reactButtons[reactIndex].click();
            console.log(`✅ Reacted with ${reaction}`);
        }
    }
}

// ** Auto Share **
async function autoShare(page, postUrl) {
    await page.goto(postUrl, { waitUntil: "load" });

    const shareButton = await page.$('a[href*="share"]');
    if (shareButton) {
        await shareButton.click();
        await page.waitForSelector('input[name="share"]');
        await page.click('input[name="share"]');
        console.log("✅ Post shared successfully!");
    }
}

// ** Auto Follow **
async function autoFollow(page, profileUrl) {
    await page.goto(profileUrl, { waitUntil: "load" });

    const followButton = await page.$('a[href*="subscribe"]');
    if (followButton) {
        await followButton.click();
        console.log("✅ Followed the profile!");
    }
}

// ** Auto Vote Poll **
async function autoVotePoll(page, pollUrl) {
    await page.goto(pollUrl, { waitUntil: "load" });

    const options = await page.$$('input[type="radio"]');
    if (options.length > 0) {
        await options[0].click();
        await page.click('input[type="submit"]');
        console.log("✅ Poll vote submitted!");
    }
}

// ** Start Server **
app.listen(3000, () => console.log("🚀 Server running at http://localhost:3000"));
