$chrome="C:\Program Files\Google\Chrome Dev\Application\chrome.exe"; & $chrome --remote-debugging-port=9222 --user-data-dir="$PWD\profiles\blazor"

$chrome="C:\Program Files\Google\Chrome Dev\Application\chrome.exe"; & $chrome --remote-debugging-port=9222 --user-data-dir="$PWD\profiles\next"

###################################################

node scripts/save-auth-state.mjs ` http://127.0.0.1:9222 ` playwright/.auth/next-user.json

###################################################

node scripts/save-auth-state.mjs `http://127.0.0.1:9222 ` playwright/.auth/blazor-user.json

##################################################

- testowe komendy czy jest konfiguracja
npx playwright test tests/read-flow.spec.ts `--project=next-cold `--headed
