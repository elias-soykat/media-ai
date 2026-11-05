
require("dotenv").config();

const { Client } = require("pg");
const {
    S3Client,
    HeadBucketCommand,
} = require("@aws-sdk/client-s3");

const results = [];

function maskSecret(value) {
    if (!value) return "NOT CONFIGURED";

    if (value.length <= 8) return "********";

    return `${value.slice(0, 4)}${"*".repeat(8)}${value.slice(-4)}`;
}

function report(service, success, message) {
    results.push({ service, success });

    console.log(
        `${success ? "✅ PASS" : "❌ FAIL"} ${service}: ${message}`
    );
}

// ==========================================
// DISPLAY CONFIGURED CREDENTIALS
// ==========================================

function logCredentials() {
    console.log("\n====================================");
    console.log(" CONFIGURED ENVIRONMENT CREDENTIALS");
    console.log("====================================\n");

    const credentials = {
        DATABASE_URL: process.env.DATABASE_URL,
        SESSION_SECRET: process.env.SESSION_SECRET,
        AI_PHOTO_PROVIDER: process.env.AI_PHOTO_PROVIDER,
        AI_AUDIO_PROVIDER: process.env.AI_AUDIO_PROVIDER,
        PADDLE_API_KEY: process.env.PADDLE_API_KEY,
        PADDLE_WEBHOOK_SECRET: process.env.PADDLE_WEBHOOK_SECRET,
        R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
        R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
        R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
        R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
        R2_PUBLIC_DOMAIN: process.env.R2_PUBLIC_DOMAIN,
        R2_ENDPOINT: process.env.R2_ENDPOINT,
        ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
    };

    const sensitiveKeys = [
        "DATABASE_URL",
        "SESSION_SECRET",
        "PADDLE_API_KEY",
        "PADDLE_WEBHOOK_SECRET",
        "R2_ACCESS_KEY_ID",
        "R2_SECRET_ACCESS_KEY",
        "ELEVENLABS_API_KEY",
    ];

    for (const [key, value] of Object.entries(credentials)) {
        const displayedValue = sensitiveKeys.includes(key)
            ? maskSecret(value)
            : value || "NOT CONFIGURED";

        console.log(`${key}: ${displayedValue}`);
    }

    console.log("\n====================================\n");
}

// ==========================================
// POSTGRESQL
// ==========================================

async function checkPostgres() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        connectionTimeoutMillis: 5000,
    });

    try {
        await client.connect();

        const result = await client.query(`
            SELECT
                current_database() AS database,
                current_user AS username,
                version() AS version
        `);

        report(
            "PostgreSQL",
            true,
            `Connected to ${result.rows[0].database} as ${result.rows[0].username}`
        );

        console.log(`   Database: ${result.rows[0].database}`);
        console.log(`   User: ${result.rows[0].username}`);
        console.log(`   Version: ${result.rows[0].version.split(" ").slice(0, 2).join(" ")}`);

    } catch (error) {
        report("PostgreSQL", false, error.message);
    } finally {
        await client.end().catch(() => {});
    }
}

// ==========================================
// PADDLE
// ==========================================

async function checkPaddle() {
    try {
        const response = await fetch(
            "https://api.paddle.com/products?per_page=1",
            {
                headers: {
                    Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
                    "Content-Type": "application/json",
                },
                signal: AbortSignal.timeout(10000),
            }
        );

        const data = await response.json().catch(() => ({}));

        report(
            "Paddle",
            response.ok,
            response.ok
                ? "API authentication successful"
                : `HTTP ${response.status}: ${data.error?.detail || data.error?.message || "API request failed"}`
        );

    } catch (error) {
        report("Paddle", false, error.message);
    }
}

// ==========================================
// CLOUDFLARE R2
// ==========================================

async function checkCloudflareR2() {
    const client = new S3Client({
        region: "auto",
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
    });

    try {
        await client.send(
            new HeadBucketCommand({
                Bucket: process.env.R2_BUCKET_NAME,
            })
        );

        report(
            "Cloudflare R2",
            true,
            `Bucket "${process.env.R2_BUCKET_NAME}" is accessible`
        );

        console.log(`   Account ID: ${process.env.R2_ACCOUNT_ID}`);
        console.log(`   Bucket: ${process.env.R2_BUCKET_NAME}`);
        console.log(`   Endpoint: ${process.env.R2_ENDPOINT}`);
        console.log(`   Public Domain: ${process.env.R2_PUBLIC_DOMAIN}`);

    } catch (error) {
        report(
            "Cloudflare R2",
            false,
            `${error.name}: ${error.message}`
        );
    } finally {
        client.destroy();
    }
}

// ==========================================
// ELEVENLABS
// ==========================================

async function checkElevenLabs() {
    try {
        const response = await fetch(
            "https://api.elevenlabs.io/v1/user",
            {
                headers: {
                    "xi-api-key": process.env.ELEVENLABS_API_KEY,
                },
                signal: AbortSignal.timeout(10000),
            }
        );

        if (!response.ok) {
            report(
                "ElevenLabs",
                false,
                `HTTP ${response.status}: Authentication/API request failed`
            );
            return;
        }

        const data = await response.json();

        report(
            "ElevenLabs",
            true,
            `Authenticated${data.subscription?.tier
                ? ` | Plan: ${data.subscription.tier}`
                : ""}`
        );

    } catch (error) {
        report("ElevenLabs", false, error.message);
    }
}

// ==========================================
// ENVIRONMENT CONFIGURATION
// ==========================================

function checkConfiguration() {
    const required = [
        "DATABASE_URL",
        "SESSION_SECRET",
        "PADDLE_API_KEY",
        "PADDLE_WEBHOOK_SECRET",
        "R2_ACCOUNT_ID",
        "R2_ACCESS_KEY_ID",
        "R2_SECRET_ACCESS_KEY",
        "R2_BUCKET_NAME",
        "R2_ENDPOINT",
        "ELEVENLABS_API_KEY",
    ];

    const missing = required.filter(
        (key) =>
            !process.env[key] ||
            process.env[key].includes("<YOUR_")
    );

    report(
        "Environment variables",
        missing.length === 0,
        missing.length
            ? `Missing or placeholder: ${missing.join(", ")}`
            : "All required variables are configured"
    );

    const secret = process.env.SESSION_SECRET || "";

    report(
        "Session Secret",
        secret.length >= 32,
        secret.length >= 32
            ? `Configured (${secret.length} characters)`
            : "Secret must contain at least 32 characters"
    );

    report(
        "Paddle Webhook Secret",
        Boolean(
            process.env.PADDLE_WEBHOOK_SECRET &&
            !process.env.PADDLE_WEBHOOK_SECRET.includes("<YOUR_")
        ),
        process.env.PADDLE_WEBHOOK_SECRET &&
        !process.env.PADDLE_WEBHOOK_SECRET.includes("<YOUR_")
            ? "Configured; signature verification not yet tested"
            : "Missing or placeholder"
    );

    report(
        "AI Providers",
        Boolean(
            process.env.AI_PHOTO_PROVIDER &&
            process.env.AI_AUDIO_PROVIDER
        ),
        `Photo: ${process.env.AI_PHOTO_PROVIDER || "Missing"} | Audio: ${process.env.AI_AUDIO_PROVIDER || "Missing"}`
    );
}

// ==========================================
// FINAL SUMMARY
// ==========================================

function printSummary() {
    console.log("\n====================================");
    console.log(" FINAL CREDENTIAL VALIDATION SUMMARY");
    console.log("====================================\n");

    for (const result of results) {
        console.log(
            `${result.success ? "✅ PASS" : "❌ FAIL"} ${result.service}`
        );
    }

    const passed = results.filter((r) => r.success).length;
    const failed = results.length - passed;

    console.log("\n------------------------------------");
    console.log(`Total Checks: ${results.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log("------------------------------------");

    console.log(
        failed === 0
            ? "\n🎉 ALL CHECKS PASSED!"
            : "\n⚠️ SOME CHECKS FAILED. Review the errors above."
    );

    console.log("====================================\n");

    process.exitCode = failed > 0 ? 1 : 0;
}

// ==========================================
// MAIN
// ==========================================

async function main() {
    console.log("\n====================================");
    console.log(" ONLINE EDITING - CREDENTIAL CHECK");
    console.log("====================================");

    logCredentials();

    console.log("========== CONFIGURATION ==========\n");

    checkConfiguration();

    console.log("\n========== SERVICE CONNECTIONS ==========\n");

    await Promise.all([
        checkPostgres(),
        checkPaddle(),
        checkCloudflareR2(),
        checkElevenLabs(),
    ]);

    printSummary();
}

main().catch((error) => {
    console.error("Unexpected validation error:", error.message);
    process.exitCode = 1;
});
