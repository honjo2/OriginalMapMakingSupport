# 手順
1. git clone git@github.com:honjo2/OriginalMapMakingSupport.git
2. cd OriginalMapMakingSupport
3. npm install
4. bower install
5. grunt server

# gh-pagesにpushする方法
1. git clone git@github.com:honjo2/OriginalMapMakingSupport.git dist
2. cd dist
3. git checkout gh-pages
4. cd ..
5. grunt build -f
6. cd dist
7. git add .
8. git commit -m 'aaa'
9. git push origin gh-pages
