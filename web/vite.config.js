import path from "node:path"
import { defineConfig } from "vite"
import eslintPlugin from "vite-plugin-eslint"

export default defineConfig( {
	server: {
		// open: true,
		host: true,
		port: 3001,
	},
	build: {
		target: "esnext",
		chunkSizeWarningLimit: 2048,
	},
	resolve: {
		alias: {
			"@app": path.resolve( __dirname, "./src/app" ),
			"@css": path.resolve( __dirname, "./src/css" ),
			"@lib": path.resolve( __dirname, "./src/library" ),
		},
	},
	plugins: [
		eslintPlugin(),
	]
} )
