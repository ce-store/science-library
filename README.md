# ScienceLibrary

The Science Library is a user interface which visualises publications and the surrounding metadata such as authors, topics, organisations and venues.
It runs on the [ce-store](https://github.com/ce-store/ce-store/) and uses a model such as [sl-data](https://github.com/ce-store/sl-data).

## Installation and Setup

> A complete installation guide including setting up the ce-store and populating it with data is found [here](https://github.com/ce-store/science-library/wiki/Complete-Installation-Guide).

Clone the code

```
git clone https://github.com/ce-store/science-library
```

## Prerequisites

* [Node.js](https://nodejs.org/en/)
* [Bower](http://bower.io/)
* [ce-store](https://github.com/ce-store/ce-store/)
* CE model loaded in ce-store

## Build and Configuration

The project is built using NPM and Bower.

To install the dependencies, run:

```
npm install
npm install -g bower
bower install
```

Edit the `home` and `server` properties in `app/scripts/services/urls.js` to point at your homepage and server where your ce-store is running.

To serve on a production server, run:

```
npm start
```

## Testing

## License

Licensed under the [Apache License, Version 2.0](https://github.com/ce-store/science-library/blob/master/LICENSE.md)

