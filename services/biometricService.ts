import { spawn, exec, ChildProcessWithoutNullStreams } from "child_process";
import path from "path";

let biometricProcess: ChildProcessWithoutNullStreams | null = null;

export const startBiometricService = () => {
    if (biometricProcess) {
        throw new Error("Biometric service is already running.");
    }

    console.log("🚀 Starting biometric service...");
    let filePath = path.join(process.cwd(), "app.py");

    console.log("Running Python from:", filePath);

    biometricProcess = spawn("python", [filePath], {
        cwd: process.cwd(),
        env: process.env,
        // detached: true, // Ensures the process runs independently
        // stdio: "pipe",  // Allows logging output
    });

    biometricProcess.stdout.on("data", (data: Buffer) =>
        console.log(`🟢 [Biometric]: ${data.toString()}`)
    );

    biometricProcess.stderr.on("data", (data: Buffer) =>
        console.error(`🔴 [Biometric Error]: ${data.toString()}`)
    );

    biometricProcess.on("close", (code: number) => {
        console.log(`🛑 Biometric service stopped with exit code ${code}`);
        biometricProcess = null;
    });

    return { message: "✅ Biometric service started." };
};

export const stopBiometricService = () => {
    if (!biometricProcess) {
        throw new Error("No biometric service is running.");
    }

    console.log("🛑 Stopping biometric service...");

    try {
        if (biometricProcess.pid) {
            // Kill process using its PID
            process.kill(biometricProcess.pid, "SIGTERM");
        } else {
            console.warn("⚠️ Biometric service PID is undefined. Killing by reference.");
            biometricProcess.kill("SIGTERM");
        }

        biometricProcess.on("close", () => {
            biometricProcess = null;
            console.log("✅ Biometric service stopped.");
        });

        return { message: "✅ Biometric service stopped." };
    } catch (error) {
        console.error("❌ Error stopping biometric service:", error);
        return { error: "Failed to stop biometric service." };
    }
};

// ✅ Check if the process is running
export const isBiometricServiceRunning = () => {
    return biometricProcess !== null;
};
