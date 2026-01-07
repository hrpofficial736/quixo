package socket

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(req *http.Request) bool { return true },
}

var rooms *map[string][]Client = &map[string][]Client{}

func WebsocketHandler(res http.ResponseWriter, req *http.Request) {
	conn, err := upgrader.Upgrade(res, req, nil)
	if err != nil {
		log.Println("Error upgrading the connection...")
		return
	}

	defer conn.Close()

	log.Println("Client connected!")

	for {
		var msg SocketRequest

		err := conn.ReadJSON(&msg)
		if err != nil {
			log.Println("Error reading the message...", err)
			return
		}

		decider(msg, conn)
	}
}
