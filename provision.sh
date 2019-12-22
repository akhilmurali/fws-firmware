mos build --platform esp8266
mos flash
mos wifi XXXXXXXX yyyyyyyy
mos gcp-iot-setup --gcp-project fire-warning-backend --gcp-region us-central1 --gcp-registry fire-station-registry
