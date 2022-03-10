#!/bin/sh
read -p "Enter Tag Number without prefix v: "  tag

NEW_TAG="v$tag"
echo "creating $NEW_TAG!"

sed -e "s/{{tagVersion}}/$tag/g" ./template_studio.ini > ./app/dist_src/studio.ini

git commit -a -m "bump version to $NEW_TAG"
git tag $NEW_TAG
git push origin $NEW_TAG
