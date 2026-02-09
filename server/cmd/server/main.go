package main

import (
	"log"
	"net/http"
	"os"

	"github.com/hrpofficial736/quixo/server/internal/socket"
)

func main() {
	http.HandleFunc("/", socket.WebsocketHandler)
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
	    w.WriteHeader(http.StatusOK)
		log.Println("Health check is OK")
	    w.Write([]byte("ok"))
	})

	log.Println("Websocket server is running at port 5000...")
	port := os.Getenv("PORT")
	if port == "" {
		port = "5000"
	}

	log.Fatal(http.ListenAndServe(":"+port, nil))
}
