# ScienceLibrary

The Science Library is a user interface which visualises publications and the surrounding metadata such as authors, topics, organisations and venues. It runs on the [CE-Store](https://github.com/ce-store/ce-store/) and uses a model such as [SL-Data](https://github.com/ce-store/sl-data).

## Installation and Setup

Clone the code

```
git clone https://github.com/ce-store/science-library
```

## Prerequisites

* [Node.js](https://nodejs.org/en/)
* [Grunt](http://gruntjs.com/)
* [CE-Store](https://github.com/ce-store/ce-store/)
* CE Model loaded in CE-Store

## Build and Configuration

The project is built using NPM and Grunt.

To install the dependancies, run:

```
npm install
npm install -g bower
npm install -g grunt-cli
bower install
```

Edit the `home` and `server` properties in `app/scripts/services/urls.js` to point at your homepage and server where your CE-Store is running.

Build the minified files into the `dist` folder, by running:

```
grunt
```

For preview, run:

```
grunt serve
```

To serve on a production server, run:

```
npm start
```

## Testing

Running `grunt test` will JSHint your files.
