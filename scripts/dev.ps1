param(
    [Parameter(Position = 0)]
    [string]$Command = "help"
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir
$ImageName = "mai"
$WorkspaceDir = "/workspace"
$CargoHome = "/usr/local/cargo"
$CargoRegistryVol = "cargo-registry"
$CargoGitVol = "cargo-git"
$TargetVol = "scheduler-target"
$PnpmStoreVol = "pnpm-store"
$PnpmStoreDir = "/pnpm/store"

function Show-Usage {
    Write-Host "Usage: .\scripts\dev.ps1 <command>"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  setup               Prepare Podman and build the dev image"
    Write-Host "  setup-no-tls-verify Build the dev image with Podman TLS verification disabled for this dev build"
    Write-Host "  dev                 Build wasm/web packages and start the Nuxt example"
    Write-Host "  verify              Run Rust, WASM, and web validation"
    Write-Host "  shell               Open a shell in the dev container"
    Write-Host "  web-install         Install web dependencies"
    Write-Host "  web-build           Build web packages"
    Write-Host "  web-test            Run web tests"
}

function Require-Podman {
    if (-not (Get-Command podman -ErrorAction SilentlyContinue)) {
        throw "Podman is required. Install Podman and retry."
    }
}

function Prepare-Podman {
    Require-Podman

    $machineName = "podman-machine-default"
    $machineList = @(podman machine list --format "{{.Name}} {{.Running}}" 2>$null) -replace "\*", ""
    if ($LASTEXITCODE -ne 0 -or -not ($machineList | Where-Object { $_ -match "^$machineName\s+" })) {
        podman machine init $machineName
        $machineList = @(podman machine list --format "{{.Name}} {{.Running}}" 2>$null) -replace "\*", ""
    }

    $isRunning = $machineList | Where-Object { $_ -match "^$machineName\s+true$" }
    if (-not $isRunning) {
        podman machine start $machineName *> $null
    }
}

function Build-Image {
    param([string]$TlsVerify = "true")

    Prepare-Podman
    podman build --tls-verify=$TlsVerify -t $ImageName -f "Containerfile" $RepoRoot
    if ($LASTEXITCODE -ne 0) {
        throw "Dev image build failed. If this is a corporate TLS certificate issue while pulling the base image, run: .\scripts\dev.ps1 setup-no-tls-verify"
    }
}

function Ensure-Image {
    Prepare-Podman
    podman image exists $ImageName
    if ($LASTEXITCODE -ne 0) {
        Build-Image "true"
    }
}

function Invoke-DevContainer {
    param(
        [string]$Script,
        [switch]$Interactive,
        [switch]$ExposeWeb
    )

    Ensure-Image

    $args = @(
        "run",
        "--rm",
        "-v", "${RepoRoot}:${WorkspaceDir}",
        "-v", "${CargoRegistryVol}:${CargoHome}/registry",
        "-v", "${CargoGitVol}:${CargoHome}/git",
        "-v", "${TargetVol}:${WorkspaceDir}/target",
        "-v", "${PnpmStoreVol}:${PnpmStoreDir}",
        "-e", "CARGO_TARGET_DIR=${WorkspaceDir}/target",
        "-e", "PNPM_HOME=/pnpm",
        "-e", "PNPM_STORE_DIR=${PnpmStoreDir}",
        "-w", $WorkspaceDir
    )

    if ($ExposeWeb) {
        $args += @("-p", "3000:3000")
    }

    if ($Interactive) {
        $args += @("-it", $ImageName, "bash")
    } else {
        $args += @($ImageName, "bash", "-lc", $Script)
    }

    podman @args
    if ($LASTEXITCODE -ne 0) {
        throw "Dev container command failed."
    }
}

function Run-WebInstall {
    Invoke-DevContainer "pnpm config set store-dir `$PNPM_STORE_DIR && cd web && pnpm install --frozen-lockfile"
}

function Run-WebBuild {
    Invoke-DevContainer "cd web && pnpm run build"
}

function Run-WebTest {
    Invoke-DevContainer "cd web && pnpm run test"
}

function Run-Dev {
    Invoke-DevContainer @"
core/tests/run_generated_package_smoke.sh
pnpm config set store-dir `$PNPM_STORE_DIR
cd web
pnpm install --frozen-lockfile
pnpm run build
pnpm --filter @mai/nuxt-app-example dev --host 0.0.0.0 --port 3000
"@ -ExposeWeb
}

function Run-Verify {
    Invoke-DevContainer @"
cargo fmt --all --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test
cargo check --target wasm32-unknown-unknown -p mai
core/tests/run_generated_package_smoke.sh
pnpm config set store-dir `$PNPM_STORE_DIR
cd web
pnpm install --frozen-lockfile
pnpm run build
pnpm run test
"@
}

switch ($Command) {
    "setup" {
        Build-Image "true"
        Run-WebInstall
    }
    "setup-no-tls-verify" {
        Build-Image "false"
        Run-WebInstall
    }
    "dev" {
        Run-Dev
    }
    "verify" {
        Run-Verify
    }
    "shell" {
        Invoke-DevContainer "" -Interactive
    }
    "web-install" {
        Run-WebInstall
    }
    "web-build" {
        Run-WebBuild
    }
    "web-test" {
        Run-WebTest
    }
    default {
        Show-Usage
        if ($Command -ne "help") {
            exit 1
        }
    }
}
