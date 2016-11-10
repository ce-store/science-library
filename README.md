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

## Build & development

The project is built using NPM and Grunt. 

To build, run:

```
npm install
npm install -g bower
bower install
grunt
```

This will build the minified files into the `dist` folder.

Run `grunt serve` for preview.

## Testing

Running `grunt test` will JSHint your files.
