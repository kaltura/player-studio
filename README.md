# Kaltura Player Studio - HTML5 Angular version.

This repo was seeded by angular seed. It is an AngularJS application built with Grunt.

## Prerequisites
- [nvm](https://github.com/nvm-sh/nvm)
- Node.js 12 - the exact version is pinned in `.nvmrc`. On Apple Silicon Macs Node 12 runs under Rosetta (there is no native arm64 build).

## Installation
```bash
nvm install    # first time only - installs the Node version from .nvmrc
nvm use        # switch to the Node version from .nvmrc
npm install
```

## Build
```bash
npx grunt
```
The build output is written to `_dist`. Run the build again after every source change.

`npm run build` builds and also creates a release zip in `_dist` (used by the release pipeline).

## Run locally (standalone)
```bash
npm start
```
Then open http://localhost:8000/index.html#/login and log in with a Kaltura account.

When running standalone (not hosted inside KMC), the player library and the API host are taken from
`app/dist_src/studio.ini` (the `html5lib` value), which points to the **nvq2** environment by default.
Log in with an account from that environment, or change `html5lib` to another environment and rebuild.

## Other tasks
- Compile LESS only: `npx grunt less`
- Tests can be run with karma (legacy, not maintained): `./scripts/test.sh`, and e2e: `./scripts/e2e-test.sh`

# License and Copyright Information
All code in this project is released under the [AGPLv3 license](http://www.gnu.org/licenses/agpl-3.0.html) unless a different license for a particular library is specified in the applicable library path. 

Copyright © Kaltura Inc. All rights reserved.

Authors [@nadavsinai](https://github.com/nadavsinai), [@itaykinnrot](https://github.com/itaykinnrot), [@AmirChervinsky](https://github.com/amirch1), [@MichalRadwantzor](https://github.com/MichalRadwantzor) and many others.


