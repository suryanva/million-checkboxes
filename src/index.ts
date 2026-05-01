import { createServer } from "node:http"
import { createExpressApplication } from "./app/index.js";

async function main() {
    try {
        const server = createServer(createExpressApplication());
        const PORT = process.env.PORT || 8000;

        server.listen(PORT, () => {
            console.log(`http server is running on port: ${PORT}`)
        })

    } catch (error) {
        console.log(`Error starting the http server`)
        throw error;
    }
}

main()