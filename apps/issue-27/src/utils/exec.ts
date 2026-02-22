import { execFile } from "node:child_process";

export interface ExecResult {
  stdout: string;
  stderr: string;
}

export function runCommand(command: string, args: string[], timeoutMs = 120000): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    console.info(
      "[exec]",
      JSON.stringify({
        ts: new Date().toISOString(),
        event: "exec.start",
        command,
        args,
        timeoutMs
      })
    );
    execFile(command, args, { timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        console.error(
          "[exec]",
          JSON.stringify({
            ts: new Date().toISOString(),
            event: "exec.error",
            command,
            args,
            timeoutMs,
            durationMs: Date.now() - startedAt,
            error: error.message,
            stdoutPreview: previewOutput(stdout),
            stderrPreview: previewOutput(stderr)
          })
        );
        const wrapped = new Error(`${command} 執行失敗: ${error.message}`);
        (wrapped as any).stdout = stdout;
        (wrapped as any).stderr = stderr;
        return reject(wrapped);
      }
      console.info(
        "[exec]",
        JSON.stringify({
          ts: new Date().toISOString(),
          event: "exec.done",
          command,
          args,
          durationMs: Date.now() - startedAt,
          stdoutPreview: previewOutput(stdout),
          stderrPreview: previewOutput(stderr)
        })
      );
      resolve({ stdout, stderr });
    });
  });
}

function previewOutput(value: string, maxLength = 240): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength)}...`;
}
