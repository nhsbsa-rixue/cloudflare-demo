#!/usr/bin/env node

const net = require("net");
const { execSync } = require("child_process");

/**
 * Find an available port starting from the given port
 * @param {number} startPort - The port to start checking from
 * @param {number} maxAttempts - Maximum attempts before giving up
 * @returns {Promise<number>} - Available port number
 */
async function findAvailablePort(startPort = 8787, maxAttempts = 10) {
	for (let i = 0; i < maxAttempts; i++) {
		const port = startPort + i;

		return new Promise((resolve) => {
			const server = net.createServer();

			server.once("error", () => {
				// Port is in use, try next one
				if (i + 1 < maxAttempts) {
					server.close();
					resolve(null); // Will trigger next iteration
				} else {
					console.error(
						`❌ Could not find available port starting from ${startPort}`
					);
					process.exit(1);
				}
			});

			server.once("listening", () => {
				server.close(() => {
					console.log(`✅ Port ${port} is available`);
					resolve(port);
				});
			});

			server.listen(port, "127.0.0.1");
		}).then((port) => {
			if (port) return port;
			// Recursively find next available port
			return findAvailablePort(startPort + i + 1, maxAttempts - i - 1);
		});
	}
}

async function main() {
	const args = process.argv.slice(2);
	const startPort = args[0] ? parseInt(args[0], 10) : 8787;
	const inspectorPort = args[1] ? parseInt(args[1], 10) : 9229;
	const command = args[2] || "wrangler";

	const availablePort = await findAvailablePort(startPort, 10);

	console.log(`🚀 Starting ${command} on port ${availablePort}`);

	// Run wrangler dev with the available port
	try {
		execSync(`${command} dev --port ${availablePort} --inspector-port ${inspectorPort}`, {
			stdio: "inherit",
			cwd: process.cwd(),
		});
	} catch (error) {
		process.exit(error.status || 1);
	}
}

main().catch((error) => {
	console.error("❌ Error:", error.message);
	process.exit(1);
});
