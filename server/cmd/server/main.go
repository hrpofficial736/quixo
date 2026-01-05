package main

import (
	"log"
	"net/http"

	"github.com/hrpofficial736/quixo/server/internal/socket"
)

func main() {
	http.HandleFunc("/", socket.WebsocketHandler)
	log.Println("Websocket server is running at port 5000...")
	log.Fatal(http.ListenAndServe(":5000", nil))
}
