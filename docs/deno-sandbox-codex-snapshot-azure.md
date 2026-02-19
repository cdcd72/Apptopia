# Deno Sandbox Snapshot with Codex CLI and Azure OpenAI (Safe Env)

This note records a working setup done on **2026-02-19**.

## Created Resources

- Volume ID: `vol_ord_xzgg0w3kbv9qv48a8w7e`
- Volume slug: `codex-cli-toolchain-v3-20260219`
- Snapshot ID: `snp_ord_05vry1tv4bskpyxcc8gy`
- Snapshot slug: `codex-cli-snapshot-v3-20260219`
- Region: `ord`
- Verified Codex CLI: `codex-cli 0.104.0`

## 1) Create a bootable root volume

```bash
deno sandbox volumes create codex-cli-toolchain-v3-20260219 \
  --capacity 8gib \
  --region ord \
  --from builtin:debian-13
```

## 2) Install Codex CLI into persistent root filesystem

Start a sandbox with that volume as root and SSH in:

```bash
deno sandbox create --root vol_ord_xzgg0w3kbv9qv48a8w7e --timeout 30m --ssh
```

In that shell, install Codex to `/usr/local` and fix the executable path:

```bash
sudo /data/.deno-sandbox/src/bin/npm install --prefix /usr/local \
  @openai/codex \
  @openai/codex-linux-x64@npm:@openai/codex@0.104.0-linux-x64

sudo unlink /usr/local/bin/codex
sudo cp /usr/local/node_modules/@openai/codex/bin/codex.js /usr/local/bin/codex
sudo chmod +x /usr/local/bin/codex
```

Verification:

```bash
which codex
codex --version
```

Expected:

```text
/usr/local/bin/codex
codex-cli 0.104.0
```

## 3) Snapshot the prepared volume

```bash
deno sandbox volumes snapshot vol_ord_xzgg0w3kbv9qv48a8w7e codex-cli-snapshot-v3-20260219
```

Check snapshot status:

```bash
deno sandbox snapshots list
```

Expected row includes:

- `SLUG=codex-cli-snapshot-v3-20260219`
- `BOOTABLE=TRUE`

## 4) Boot from snapshot and verify

```bash
deno sandbox create --root codex-cli-snapshot-v3-20260219 --timeout 30m --ssh
```

Then run:

```bash
which codex
codex --version
```

## 5) Azure OpenAI configuration (safe key handling)

Do **not** put API keys into snapshot, git, or command history.

### Codex config template (no secret)

Use `docs/templates/codex.azure.example.toml` as `~/.codex/config.toml`, then replace:

- `YOUR_RESOURCE_NAME`
- model/api-version as needed

### Inject API key at runtime only

In a shell inside sandbox, set key interactively:

```bash
read -r -s -p "Azure OpenAI API key: " AZURE_OPENAI_API_KEY; echo
export AZURE_OPENAI_API_KEY
```

Then run:

```bash
codex
```

PowerShell equivalent:

```powershell
$secure = Read-Host "Azure OpenAI API key" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
  $env:AZURE_OPENAI_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
}
finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}
```

## 6) Cleanup commands

```bash
deno sandbox list
deno sandbox kill <sandbox-id>

deno sandbox volumes list
deno sandbox volumes delete <old-volume-id-or-slug>

deno sandbox snapshots list
deno sandbox snapshots delete <old-snapshot-id-or-slug>
```

## Notes

- In this org, valid region for this run was `ord`.
- `deno sandbox create --timeout` currently allowed up to 30 minutes.

## References

- Deno Sandbox CLI: https://docs.deno.com/sandbox/cli/
- Deno Volumes & Snapshots: https://docs.deno.com/sandbox/volumes_and_snapshots/
- Codex Azure model provider config: https://github.com/openai/codex/blob/main/docs/config.md#examples
