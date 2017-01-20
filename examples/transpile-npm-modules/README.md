
# Hello World example

## How to use

Download the example (or clone the repo)[https://github.com/zeit/next.js.git]:

```bash
curl https://codeload.github.com/zeit/next.js/tar.gz/master | tar -xz --strip=2 next.js-master/examples/with-es6-npm-module-pages
cd with-es6-npm-module-pages
```

Install it and run:

```bash
cd app
npm install
npm run dev
```

Deploy it to the cloud with [now](https://zeit.co/now) ([download](https://zeit.co/download))

```bash
now
```

## The idea behind the example

This example shows how to transpile modules installed with NPM. With that, you could publish internal component libraries to NPM without transpiling and use them directly inside your Next.js app.

> By default those components get transpiled with the `next/babel` preset. You could also define a custom .babelrc in your app and define presets and plugins as you want.

You can do this by adding a field called `transpileModules` in the `next.config.js`. Here's an example config:

```js
module.exports = {
  // You need to define an array of regular expressions here
  transpileModules: [
    /react-button/
  ]
}
```

Here Next.js will transpile any module matches "react-button" in it's path name.

### Note

We only transpile modules inside the `node_modules` directory. So, `npm link` won't work in this case.
