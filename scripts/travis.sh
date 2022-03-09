#!/bin/sh
# https://docs.travis-ci.com/user/customizing-the-build/#Implementing-Complex-Build-Steps
set -ev
npm install -g grunt
#yarn install
if [ "${TRAVIS_MODE}" = "release" ]; then
  echo "Building..."
  TAG=$TRAVIS_TAG yarn run build
  echo "Finish building"
elif [ "${TRAVIS_MODE}" = "build" ]; then
	 yarn run build
else
	echo "Unknown travis mode: ${TRAVIS_MODE}" 1>&2
	exit 1
fi
