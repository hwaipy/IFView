yarn quasar build
zip -q -r "dist-history/spa-$(date -u +%Y-%m-%dT%H-%M-%SZ).zip" dist/spa
python3 publish.py
