sudo yarn quasar build
mkdir -p dist-history
zip -q -r "dist-history/spa-$(date -u +%Y-%m-%dT%H-%M-%SZ).zip" dist/spa
pip3 install webdavclient3
python3 publish.py
