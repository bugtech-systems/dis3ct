import { spawn, ChildProcessWithoutNullStreams } from "child_process";

let biometricProcess: ChildProcessWithoutNullStreams | null = null;

export const startBiometricService = () => {
    if (biometricProcess) {
        throw new Error("Biometric service is already running.");
    }

    console.log("🚀 Starting biometric service...");
    biometricProcess = spawn("python", ["path/to/your/python_script.py"], {
        cwd: process.cwd(),
        env: process.env,
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
    biometricProcess.kill("SIGTERM");

    biometricProcess.on("close", () => {
        biometricProcess = null;
        console.log("✅ Biometric service stopped.");
    });

    return { message: "✅ Biometric service stopped." };
};
