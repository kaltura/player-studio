#!/bin/sh

NEW_TAG=$(git describe --abbrev=0)

echo "extracting the new tag - $NEW_TAG"
sed -e "s/{{tagVersion}}/$tag/g" ./template_studio.ini > ./app/dist_src/studio.ini

git commit --amend --no-edit
