---
id: version-3.7.0-uglifyes-plugin
title: UglifyESPlugin
original_id: uglifyes-plugin
---

## Description

Compresses the javascript code by using
[UglifyES](https://github.com/mishoo/UglifyJS2/tree/harmony).

Unlike the **UglifyJS** plugin, the **UglifyES** plugin supports ES2015+ (ES6+)
code. Please note that because `uglify-es` is not longer supported this plugin
will be removed in the next major release. You can use the `TerserPlugin` as a
drop-in replacement.

## Install

This package depends on the `uglify-es` package.

```bash
yarn add uglify-es --dev
npm install uglify-es --save-dev
```

## Setup

Import from FuseBox

```js
const { UglifyESPlugin } = require("fuse-box");
```

Inject into a chain

```js
fuse.plugin(UglifyESPlugin());
```

Or add it to the main config plugins list to make it available across bundles

```js
FuseBox.init({
  plugins: [UglifyESPlugin()],
});
```

## Options

The plugin accepts an object that is the original `UglifyES` options as a
parameter. For example:

```js
FuseBox.init({
  plugins: [
    UglifyESPlugin({
      mangle: {
        toplevel: true,
        screw_ie8: true,
      },
    }),
  ],
});
```
