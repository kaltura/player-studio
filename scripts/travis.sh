#!/bin/sh
# https://docs.travis-ci.com/user/customizing-the-build/#Implementing-Complex-Build-Steps
set -ev
npm install grunt
if [ "${TRAVIS_MODE}" = "release" ]; then
  echo "Building..."
  TAG=$TRAVIS_TAG yarn run build
  echo "Finish building"
else
	echo "Unknown travis mode: ${TRAVIS_MODE}" 1>&2
	exit 1
fi
