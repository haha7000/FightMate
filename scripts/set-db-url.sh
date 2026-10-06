#!/bin/bash
# Supabase DB 접속 주소를 .env.local에 저장한다 (비밀번호는 화면에 안 보이게 입력).
# 사용: ./scripts/set-db-url.sh
set -euo pipefail
cd "$(dirname "$0")/.."

HOST="aws-1-ap-southeast-2.pooler.supabase.com"
DB_USER="postgres.btzuokztiwburzvtkiaf"

read -r -s -p "Supabase DB 비밀번호 입력 (화면에 안 보여요): " PW
echo
if [ -z "$PW" ]; then echo "비밀번호가 비어 있어요. 취소합니다."; exit 1; fi

# 특수문자가 있어도 주소가 깨지지 않게 인코딩
ENC=$(PW="$PW" python3 -c 'import os, urllib.parse; print(urllib.parse.quote(os.environ["PW"], safe=""))')
LINE="SUPABASE_DB_URL=postgresql://${DB_USER}:${ENC}@${HOST}:5432/postgres"

touch .env.local
grep -v '^SUPABASE_DB_URL=' .env.local > .env.local.tmp || true
echo "$LINE" >> .env.local.tmp
mv .env.local.tmp .env.local
chmod 600 .env.local

# 접속 확인 (비밀번호가 맞는지)
if command -v psql >/dev/null; then
  if psql "${LINE#SUPABASE_DB_URL=}" -c "select 1" -tA >/dev/null 2>&1; then
    echo "✅ 저장하고 접속까지 확인했어요."
  else
    echo "⚠️ 저장은 했는데 접속이 안 돼요. 비밀번호를 다시 확인하고 한 번 더 실행해주세요."
  fi
else
  echo "✅ 저장했어요. (접속 확인은 Claude가 할게요)"
fi
