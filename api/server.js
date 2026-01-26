import { Server } from "socket.io"
import { createServer } from "http"

const PORT = 3000

const browsers = []

const httpServer = createServer( ( req, res ) => {

	res.writeHead( 200, { "Content-Type": "text/plain" } )
	res.end( "Socket server is running" )
} )

const io = new Server( httpServer, {
	cors: {
		origin: "*",
		methods: [ "GET", "POST" ],
	}
} )

io.on( "connection", browser => {

	browsers.push( browser )

	browser.on( "NEW_MESSAGE", message => {

		for ( const browser of browsers ) {

			browser.emit( "NEW_MESSAGE", message )
		}
	} )

	browser.on( "TYPING", () => {

		for ( const browser of browsers ) {

			browser.emit( "TYPING" )
		}
	} )
} )

httpServer.listen( PORT, "0.0.0.0", () => {

	console.log( `Server listening on port ${ PORT }` )
} )
