This project contains examples of using google drive api for node.js. I made them following the [DiscoverDrive](http://campus.codeschool.com/courses/discover-drive/intro) course on [Codeschool](https://www.codeschool.com/). Examples in the course are written in ruby, so this might be helpful for someone. Btw, it's a free course, so jump in!

**Note, this are just examples i made for myself to get the basics of using google apis for drive, they may contain bugs, they do not cover all there's to it, you might not like the way i did things (and you might be right), etc.**

#Setup

	npm install

This environment variables should be declared:

	PORT=8080 # or any other
	CLIENT_ID=your_client_id
	CLIENT_SECRET=your_secret
	REDIRECT_URL=http://localhost:$PORT/oauth2callback # or any other url you setup in the GDC

To get your CLIENT_ID, CLIENT_SECRET and REDIRECT_URL you should create a new project in the Google Developers Console (GDC) and set it up. Follow the course materials for more info.

For your own convenience, you can create a file `run` (or whatever) in the root of the project with this contents:

	#!/usr/bin/env bash

	export PORT=8080
	export CLIENT_ID=your_client_id
	export CLIENT_SECRET=your_secter
	export REDIRECT_URL=http://localhost:$PORT/oauth2callback 

	node index.js # or use nodemon

And use it to start the project `./run` (don't forget to `chmod +x run`).
