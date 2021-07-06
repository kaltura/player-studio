#!/bin/sh
read -p "Enter Tag Number without prefix v: "  tag

PREV_TAG=$(git describe --tags)
TAG_WITHOUT_V="${PREV_TAG#v}"
NEW_TAG="v$tag"

echo "creating $NEW_TAG!"
echo "previous tag $PREV_TAG!"

sed -iE "s/$TAG_WITHOUT_V/$tag/g" ./app/studio.ini
sed -iE "s/$TAG_WITHOUT_V/$tag/g" ./app/dist_src/studio.ini
rm ./app/studio.iniE
rm ./app/dist_src/studio.iniE

git commit -a -m "bump version to $NEW_TAG"
git tag $NEW_TAG
