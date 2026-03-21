#!/bin/bash

N8N_URL="http://localhost:5678"
N8N_USER="admin"
N8N_PASS="${N8N_PASSWORD:-hotel123}"

echo "📥 Importing workflows to n8n..."

for workflow in n8n/workflows/*.json; do
  echo "Importing: $workflow"
  
  response=$(curl -s -X POST "$N8N_URL/api/v1/workflows" \
    -u "$N8N_USER:$N8N_PASS" \
    -H "Content-Type: application/json" \
    -d @"$workflow")
  
  if echo "$response" | grep -q '"id"'; then
    echo "✅ Imported: $(basename $workflow)"
  else
    echo "❌ Failed: $(basename $workflow)"
    echo "   Response: $response"
  fi
done

echo ""
echo "🎉 Import complete!"
echo ""
echo "Access n8n at: $N8N_URL"
echo "Username: $N8N_USER"
echo "Password: $N8N_PASS"
