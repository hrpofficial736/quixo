package socket

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(req *http.Request) bool { return true },
}

func WebsocketHandler(res http.ResponseWriter, req *http.Request) {
	conn, err := upgrader.Upgrade(res, req, nil)
	if err != nil {
		log.Println("Error upgrading the connection...")
		log.Println(err)
		log.Fatal()
		return
	}

	defer conn.Close()

	log.Println("Client connected!")

	for {
		msgType, msg, err := conn.ReadMessage()
		if err != nil {
			log.Println("Error reading the message...")
			return
		}
		log.Printf("Message received: %s\n", msg)

		err = conn.WriteMessage(msgType, msg)
		if err != nil {
			log.Println("Error writing the message...")
			return
		}
	}
}
