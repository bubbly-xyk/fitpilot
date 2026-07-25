$pythonPath = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"

if (-not (Test-Path -LiteralPath $pythonPath)) {
    throw "Python environment not found. Run: py -3.12 -m venv server\.venv"
}

& $pythonPath -m uvicorn app.main:app `
    --host 127.0.0.1 `
    --port 8000 `
    --app-dir $PSScriptRoot

