#!/bin/sh

echo Creating Grafana tag
export CELO_ENV=$CELO_ENV
export SUFFIX=$SUFFIX
export TAG=$TAG

export GRAFANA_CLOUD_PROJECT_ID=${GRAFANA_CLOUD_PROJECT_ID:-"253914576835"}
export GRAFANA_CLOUD_SECRET_NAME==${GRAFANA_CLOUD_SECRET_NAME:-"grafana-cloud"}
export GRAFANA_CLOUD_SECRET_VERSION==${GRAFANA_CLOUD_SECRET_VERSION:-"latest"}

SECRET=$(curl "https://secretmanager.googleapis.com/v1/projects/$GRAFANA_CLOUD_PROJECT_ID/secrets/$GRAFANA_CLOUD_SECRET_NAME/versions/$GRAFANA_CLOUD_SECRET_VERSION:access" \
    --request "GET" \
    --header "authorization: Bearer $(gcloud auth print-access-token)" \
    --header "content-type: application/json" \
    | jq -r ".payload.data" | base64 --decode)


GRAFANA_API_TOKEN=$(echo $SECRET | jq -r '.grafana_api_token')
GRAFANA_API_ENDPOINT=$(echo $SECRET | jq -r '.grafana_endpoint')

GCLOUD_ACCOUNT=$(gcloud config get-value account)

REQUEST=$(curl "$GRAFANA_API_ENDPOINT/api/annotations" \
  --request "POST" \
  --header "authorization: Bearer $GRAFANA_API_TOKEN" \
  --header "content-type: application/json" \
  --data @- << EOF
  {
    "text": "Deployed $CELO_ENV $SUFFIX by $GCLOUD_ACCOUNT with commit: \n \n <a href=\"https://github.com/celo-org/blockscout/commit/$TAG\"> $TAG</a>\n ",
    "tags": [
      "deployment",
      "$CELO_ENV"
    ]
  }
EOF
)